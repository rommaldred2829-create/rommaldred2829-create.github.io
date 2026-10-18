-- Student Records: database schema, sample data and example queries.
-- On InfinityFree, create the database in the control panel (MySQL Databases)
-- and skip the next two lines.
CREATE DATABASE IF NOT EXISTS student_records CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_records;

CREATE TABLE IF NOT EXISTS students (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_no VARCHAR(20)  NOT NULL UNIQUE,
  full_name  VARCHAR(100) NOT NULL,
  course     VARCHAR(80)  NOT NULL,
  year_level TINYINT UNSIGNED NOT NULL,
  email      VARCHAR(120) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_full_name (full_name)
) ENGINE=InnoDB;

-- Sample (fictional) data
INSERT INTO students (student_no, full_name, course, year_level, email) VALUES
  ('2024-0001', 'Ana Reyes',      'BS Information Technology', 2, 'ana@example.com'),
  ('2024-0002', 'Mark Santos',    'BS Computer Science',       1, 'mark@example.com'),
  ('2023-0105', 'Liza Dela Cruz', 'BS Information Technology', 3, NULL);

-- Example queries
-- Students per course:
--   SELECT course, COUNT(*) AS total FROM students GROUP BY course ORDER BY total DESC;
-- Find by name (use prepared statements when the value comes from a user):
--   SELECT * FROM students WHERE full_name LIKE '%reyes%';
