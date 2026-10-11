# School Database Design

## Table Explanations
- **students**: Stores core information about each student. It includes a unique identifier (`student_id`), the student's `name`, and their `email`. The `email` column has a `UNIQUE` constraint to prevent duplicate accounts and ensure reliable communication.
- **courses**: Stores information about available academic courses. It includes a unique identifier (`course_id`), the `course_name`, and the number of `credits` the course is worth.
- **enrolments**: A join table that records the fact that a student is enrolled in a specific course. It contains its own primary key (`enrolment_id`), foreign keys linking to the `students` and `courses` tables, and a `grade` field to store the student's performance. A `UNIQUE` constraint on `(student_id, course_id)` prevents a student from enrolling in the same course more than once.

## Relationships
- **Students and Courses**: This is a **many-to-many** relationship. A single student can enroll in multiple courses, and a single course can have multiple students enrolled in it.
- **Why a join table is needed**: Relational databases cannot directly map many-to-many relationships between two tables. The `enrolments` table acts as an associative (join) table to resolve this. It breaks the many-to-many relationship into two **one-to-many** relationships: one student can have many enrolments, and one course can have many enrolments. Additionally, this table is the natural place to store attributes specific to the relationship itself, such as the `grade`.

## Proposed Index
- **Index**: `CREATE INDEX idx_enrolments_student_id ON enrolments(student_id);`
- **Reason**: Queries frequently look up all courses and grades for a specific student (e.g., generating a student's transcript or report card). Adding an index on `student_id` in the `enrolments` table will significantly speed up these `JOIN` and `WHERE` operations, especially as the number of enrolments grows into the thousands or millions.

## SQL vs NoSQL Choice
For this system, **SQL** is the clear and appropriate choice. The data is highly structured and relational, with strict requirements for data integrity (e.g., preventing duplicate enrolments via `UNIQUE` constraints, ensuring referential integrity via `FOREIGN KEY` constraints). Academic systems require strong consistency (ACID properties) to ensure that grades and enrolments are accurately recorded and never lost or corrupted. While a NoSQL database could store this data, it would require manual enforcement of these relationships and constraints at the application level, making SQL the more robust, maintainable, and natural fit for a school enrolment system.