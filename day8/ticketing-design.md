# TicketHub System Design

## 1. Requirements

**Functional Requirements:**
* Users can browse a list of upcoming events.
* Users can view the seat map and availability for a specific event.
* Users can select and place a temporary hold on specific seats.
* Users can pay for held seats to confirm their order.
* Users can view their successfully purchased tickets.

**Non-Functional Requirements:**
* **Speed:** The system must load event pages and seat maps with low latency, even under heavy load.
* **Correctness:** Strict data consistency must be maintained to guarantee that a single seat is never sold to two different people.
* **Fairness:** The system must enforce a first-come, first-served queuing mechanism during high-demand sales to give all fans an equal opportunity.

## 2. Capacity Estimates

**Normal Traffic:**
* **Users:** 2 million registered users.
* **Daily Traffic:** 50,000 visitors viewing 10 pages each = 500,000 page views per day.
* **Sales:** 5,000 tickets sold per day.
* **Throughput:** ~6 requests per second (QPS) on average. The load on the database is minimal.

**Big Sale Peak Traffic:**
* **Scale:** 200,000 people attempting to buy 20,000 seats within a 10-minute window.
* **Throughput:** 200,000 users / 600 seconds = ~333 QPS of *high-intent write requests*, accompanied by thousands of concurrent reads as users rapidly refresh pages.
* **Comparison:** While normal traffic requires minimal infrastructure, the "big sale" introduces a massive, sudden spike in concurrent database writes (holds and purchases) that would overwhelm a standard setup. The peak write volume is over 5,000% higher than the daily average.

## 3. API Design

1. `GET /events`
   * **Description:** Retrieves a list of upcoming events.
2. `GET /events/{event_id}/seats`
   * **Description:** Returns the seating layout and current availability status (available, held, sold) for the event.
3. `POST /seats/hold`
   * **Description:** Attempts to place a temporary hold (e.g., 5 minutes) on a `seat_id` for a specific `user_id`.
4. `POST /payments`
   * **Description:** Processes payment for a user's held seats and transitions the seat status to "sold". 
5. `GET /users/{user_id}/tickets`
   * **Description:** Retrieves the confirmed tickets belonging to the user.

## 4. Data Model

**1. Users Table**
* `id` (Primary Key)
* `email` (String, Unique)
* `password_hash` (String)

**2. Events Table**
* `id` (Primary Key)
* `name` (String)
* `date` (Datetime)
* `venue` (String)
* `total_seats` (Integer)

**3. Seats Table**
* `id` (Primary Key)
* `event_id` (Foreign Key -> Events.id)
* `seat_number` (String)
* `status` (Enum: AVAILABLE, HELD, SOLD)
* `hold_expires_at` (Datetime, Nullable)

**4. Orders Table**
* `id` (Primary Key)
* `user_id` (Foreign Key -> Users.id)
* `seat_id` (Foreign Key -> Seats.id, Unique)
* `payment_status` (Enum: PENDING, COMPLETED, FAILED)
* `created_at` (Datetime)

## 5. Preventing Double-Booking

To ensure two users cannot buy the same seat simultaneously, the system relies on **database transactions and constraints**:

1. **Pessimistic Locking (`SELECT ... FOR UPDATE`):** When a user requests to hold a seat, the database opens a transaction and locks the specific seat row. If another user's request hits the database at the exact same millisecond, it must wait for the first transaction to complete. 
2. **Atomic State Checks:** The system checks if `status == 'AVAILABLE'` or if `hold_expires_at` is in the past. Only then does it update the status to `'HELD'` and set a new expiration time, committing the transaction.
3. **Unique Constraints:** The `Orders` table enforces a `UNIQUE(seat_id)` constraint for completed orders. Even if a race condition somehow bypassed the application logic, the relational database would reject the second insert attempt, throwing a constraint violation error.

## 6. Architecture 

```text
[ Users ] 
   |
[ CDN / WAF ] -- Serves static assets, filters bad traffic
   |
[ API Gateway & Load Balancer ]
   |
   +-- [ Virtual Waiting Room (Redis/Token Bucket) ]
   |
[ Web / Application Servers ] (Stateless, auto-scaling)
   |
   +-- [ Redis Cache ] -- Fast reads for events and seat map availability
   |
[ PostgreSQL Primary ] (Handles writes/holds securely with ACID)
   |
[ PostgreSQL Replicas ] (Handles read-heavy normal traffic)

```

**Surviving the Big Sale:**
The architecture survives the traffic spike using a Virtual Waiting Room and a Caching Layer. When 200,000 users hit the site simultaneously, the API gateway routes the overflow to the waiting room, letting a controlled number of users through to the application servers (matching the database's max write capacity). Meanwhile, Redis handles the thousands of read requests for seat maps, shielding the primary PostgreSQL database so it can exclusively process seat holds and payments without crashing.

## 7. Trade-offs
**Consistency vs. Availability:** To strictly prevent double-booking, the system chooses Consistency over Availability (from the CAP theorem). During peak loads, the database might lock rows or time out, resulting in errors for some users. We trade the ability to serve every request immediately for the guarantee that data is perfectly accurate.

**Seat Map Accuracy vs. Performance:** To survive traffic spikes, the seat map is served from the Redis cache rather than the primary database. The trade-off is that the cached map might be a few seconds stale. A user might click a seat that appears "available," only to be told upon clicking that it was just held by someone else. Performance is favored over real-time UI accuracy.