
# Course Reflection

The most difficult concept in this course was mastering concurrency and database locks, particularly understanding how race conditions occur in high-throughput backend environments. Initially, I struggled to conceptualize how two simultaneous API calls could read the exact same database state and overwrite each other's data. I overcame this by intentionally writing flawed code and using local scripts to fire dozens of simultaneous requests at my endpoints. Watching the database incorrectly double-book entries made the problem tangible, and implementing ACID transactions and `SELECT ... FOR UPDATE` locks finally made the solution click.

Looking at the feedback on my capstone project, the main area I need to improve is my application's error handling and user feedback. While the backend logic was structurally sound, UI errors were failing silently. If an API call timed out or failed a constraint check, the user was left staring at a static screen. I plan to refactor the frontend state management to gracefully catch backend errors and display clear, actionable toast notifications to the user.

Moving forward, I plan to learn more about cloud deployment and CI/CD pipelines. While I can build robust applications locally, I want to master Docker, GitHub Actions, and AWS to fully automate testing and deployment in real-world staging and production environments.