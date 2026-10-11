# SnapShare Scaling Plan

## 1. Assumptions and Traffic Estimates

**Starting Facts & Assumptions:**
- Total registered users: 10,000,000
- Daily Active Users (DAU) rate: 10%
- Uploads per active user: 1 photo/day
- Feed views per active user: 50 pages/day
- Average photo size: 2 MB
- Average thumbnail size: 50 KB (0.05 MB)
- Seconds in a day: 86,400

**Calculations:**
- **Daily Active Users (DAU):** 10,000,000 * 10% = **1,000,000 users**
- **Uploads per second:** (1,000,000 uploads / 86,400 seconds) ≈ **12 uploads/sec**
- **Feed views per second (Average):** (1,000,000 users * 50 views) / 86,400 seconds ≈ **580 views/sec**
- **Feed views per second (Peak):** 580 views/sec * 5 = **2,900 views/sec**
- **Photo storage per year:** 1,000,000 uploads/day * 365 days * (2 MB + 0.05 MB) = 748,250,000 MB ≈ **748 TB/year**

## 2. Read-Heavy vs. Write-Heavy

**Statement:** The system is heavily **read-heavy**. 

**Explanation & Design Impact:** 
With an average of 580 feed views per second compared to only 12 uploads per second, the read-to-write ratio is roughly 48:1. Because the system is read-heavy, the architecture must be optimized to serve reads as quickly and cheaply as possible. This means we should heavily utilize CDNs to serve static assets, implement aggressive caching for feed data, use database read replicas to offload query traffic, and potentially use a "push" (fan-out on write) model for feed generation so that reads require minimal computation.

## 3. Photo Storage Strategy

**Why photos should not be stored inside the database:**
Relational databases are optimized for structured data, transactional integrity, and low-latency small reads/writes. Storing large binary blobs (like 2 MB photos) bloats the database, consumes expensive RAM (buffer pool), drastically slows down backups, and makes horizontal scaling incredibly difficult and costly.

**Where they should go instead:**
Photos and thumbnails should be stored in **Object Storage** (such as AWS S3). Object storage is specifically designed for unstructured binary data, offering virtually infinite scalability, high durability, low cost, and seamless integration with CDNs.

## 4. Architecture Diagram

```text
           +---------+
           |  Users  |
           +----+----+
                |
           +----v----+
           |   CDN   | (Caches thumbnails & static assets)
           +----+----+
                |
           +----v----+
           |   LB    | (Load Balancer)
           +----+----+
                |
        +-------v-------+
        |  App Servers  |
        +---+---+---+---+
            |   |   |
      +-----+   |   +-----+
      |         |         |
    +-v--+    +-v--+    +-v-------+
    |Cache|   | DB |    |  Queue  |
    +----+    +-+--+    +----+----+
                |            |
            +---v---+    +---v----+
            |Read   |    |Workers |
            |Replica|    +---+----+
            +-------+        |
                         +---v----+
                         | Object |
                         |Storage |
                         +--------+
```

## 5. Component Explanations
- **CDN:** Caches and serves thumbnails and static assets globally to reduce latency and origin server load.
- **Load Balancer:** Distributes incoming user traffic evenly across multiple app servers to prevent any single server from becoming a bottleneck.
- **App Servers:** Handle business logic, authenticate users, process feed requests, and coordinate the upload process.
- **Cache:** Stores frequently accessed feed data and session information in memory to provide ultra-fast read responses.
- **Database:** Stores structured metadata like user profiles, follower relationships, and photo records.
- **Read Replica:** Offloads read traffic (like fetching feeds) from the primary database to prevent write operations from being slowed down.
- **Message Queue:** Decouples the photo upload process from thumbnail generation by holding jobs until workers are ready to process them.
- **Worker Servers:** Asynchronously consume jobs from the queue to generate thumbnails and update metadata without blocking the user.
- **Object Storage:** Provides highly durable, scalable, and cost-effective storage for the actual large photo and thumbnail image files.

## 6. Upload Flow Step-by-Step
1. The user selects a photo and initiates an upload via the client application.
2. The request travels through the CDN (for routing) and the Load Balancer, reaching an available App Server.
3. The App Server uploads the original 2 MB photo file directly to Object Storage.
4. The App Server saves the photo's metadata (Object Storage URL, user ID, timestamp) to the primary Database.
5. The App Server pushes a "generate thumbnail" job to the Message Queue.
6. The App Server immediately returns a success response to the user's client.
7. A Worker Server picks up the job from the queue, downloads the original photo from Object Storage, resizes it to create a 50 KB thumbnail, and uploads the thumbnail back to Object Storage.
8. The Worker updates the photo's metadata in the Database with the new thumbnail URL.

## 7. Trade-offs

### Trade-off 1: Feed Generation (Push vs. Pull)
- **Push (Fan-out on write):** When a user uploads a photo, the system immediately writes that post into the feeds of all their followers. **Pros:** Reading the feed is extremely fast and requires no complex queries. **Cons:** Write latency increases, and it is highly inefficient for users with millions of followers (e.g., celebrities).
- **Pull (Fan-out on read):** When a user views their feed, the system queries the database for all people they follow and aggregates their recent posts on the fly. **Pros:** Writes are fast and storage isn't wasted on inactive followers. **Cons:** Reads are very slow and put a massive computational load on the database.
- **Resolution:** We will use a hybrid approach: Push for normal users, and Pull for users with an exceptionally high follower count.

### Trade-off 2: Thumbnail Generation (Synchronous vs. Asynchronous)
- **Synchronous:** The App Server generates the thumbnail before responding to the user. **Pros:** Simpler architecture with no need for queues or background workers. **Cons:** Blocks the user, significantly increases upload latency, and if the server crashes mid-processing, the thumbnail is lost.
- **Asynchronous (Chosen):** The App Server returns immediately, and a background worker handles the thumbnail generation. **Pros:** Provides a fast, responsive user experience and is resilient to worker failures. **Cons:** Adds architectural complexity (requires a queue and workers), and the thumbnail isn't immediately available (requiring the client to poll or use a fallback image).