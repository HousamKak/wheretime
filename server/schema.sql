-- SQLite database schema for Time Spent Visualization & Tracking Web App

PRAGMA foreign_keys = ON;  -- Enable foreign key constraints

-- Categories table for hierarchical category tracking
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    parent_id INTEGER,
    color TEXT NOT NULL DEFAULT '#6B7280',  -- Default to a neutral gray color
    threshold_minutes INTEGER DEFAULT NULL, -- New column for time thresholds
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Time logs table for tracking time spent per category per day
CREATE TABLE IF NOT EXISTS time_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    date TEXT NOT NULL,  -- Stored in ISO format (YYYY-MM-DD)
    total_time INTEGER NOT NULL,  -- Total time in minutes
    notes TEXT,  -- Optional notes for the time entry
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(category_id, date)  -- Ensure only one log per category per day
);

-- Create an index on date for faster filtering
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON time_logs(date);

-- Create an index on category_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_time_logs_category ON time_logs(category_id);

-- -- =============================================
-- -- INSERT DUMMY DATA
-- -- =============================================

-- -- Insert main categories with custom colors
-- INSERT OR IGNORE INTO categories (id, name, color) VALUES 
--     (1, 'Work', '#4361ee'),          -- Blue
--     (2, 'Personal', '#10B981'),      -- Green
--     (3, 'Health', '#ef4444'),        -- Red
--     (4, 'Learning', '#8B5CF6'),      -- Purple
--     (5, 'Entertainment', '#f72585'); -- Pink

-- -- Insert Work subcategories
-- INSERT OR IGNORE INTO categories (name, parent_id, color) 
-- VALUES ('Meetings', 1, '#4895ef');

-- INSERT OR IGNORE INTO categories (name, parent_id, color)
-- VALUES ('Coding', 1, '#4cc9f0');

-- INSERT OR IGNORE INTO categories (name, parent_id, color)
-- VALUES ('Documentation', 1, '#3a0ca3');

-- INSERT OR IGNORE INTO categories (name, parent_id, color)
-- VALUES ('Planning', 1, '#3f37c9');

-- -- Insert Health subcategories
-- INSERT OR IGNORE INTO categories (name, parent_id, color)
-- VALUES ('Exercise', 3, '#ff5c5c');

-- INSERT OR IGNORE INTO categories (name, parent_id, color)
-- VALUES ('Meditation', 3, '#ff7f51');

-- INSERT OR IGNORE INTO categories (name, parent_id, color)
-- VALUES ('Sleep', 3, '#dd2c53');

-- -- Insert Learning subcategories
-- INSERT OR IGNORE INTO categories (name, parent_id, color)
-- VALUES ('Reading', 4, '#a679e0');

-- INSERT OR IGNORE INTO categories (name, parent_id, color)
-- VALUES ('Courses', 4, '#7209b7');

-- INSERT OR IGNORE INTO categories (name, parent_id, color)
-- VALUES ('Projects', 4, '#560bad');

-- -- Insert Personal subcategories
-- INSERT OR IGNORE INTO categories (name, parent_id, color)
-- VALUES ('Family', 2, '#2dd4bf');

-- INSERT OR IGNORE INTO categories (name, parent_id, color)
-- VALUES ('Friends', 2, '#34d399');

-- INSERT OR IGNORE INTO categories (name, parent_id, color)
-- VALUES ('Hobbies', 2, '#06d6a0');

-- -- Insert Entertainment subcategories
-- INSERT OR IGNORE INTO categories (name, parent_id, color)
-- VALUES ('Movies', 5, '#e0457b');

-- INSERT OR IGNORE INTO categories (name, parent_id, color)
-- VALUES ('Gaming', 5, '#b5179e');

-- INSERT OR IGNORE INTO categories (name, parent_id, color)
-- VALUES ('Social Media', 5, '#d53f8c');

-- -- =============================================
-- -- INSERT TIME LOG DUMMY DATA
-- -- =============================================

-- -- Current date for reference
-- -- Use date ranges from the last 30 days
-- -- SQLite date functions: current_date, date(timestring, modifier)

-- -- Work - Meetings
-- INSERT OR IGNORE INTO time_logs (category_id, date, total_time, notes) 
-- SELECT (SELECT id FROM categories WHERE name = 'Meetings'), 
--        date(date('now', '-' || i || ' days')), 
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 70 THEN (ABS(RANDOM()) % 120) + 30
--          ELSE 0
--        END,
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 30 THEN 'Team sync meeting'
--          WHEN (ABS(RANDOM()) % 100) < 60 THEN 'Client meeting' 
--          WHEN (ABS(RANDOM()) % 100) < 90 THEN 'Status update'
--          ELSE NULL
--        END
-- FROM (SELECT 0 AS i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
--       UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
--       UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
--       UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 
--       UNION SELECT 27 UNION SELECT 28 UNION SELECT 29)
-- WHERE (ABS(RANDOM()) % 100) < 70;  -- Only insert entries for ~70% of days

-- -- Work - Coding
-- INSERT OR IGNORE INTO time_logs (category_id, date, total_time, notes) 
-- SELECT (SELECT id FROM categories WHERE name = 'Coding'), 
--        date(date('now', '-' || i || ' days')), 
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 80 THEN (ABS(RANDOM()) % 240) + 120
--          ELSE 0
--        END,
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 25 THEN 'Backend development'
--          WHEN (ABS(RANDOM()) % 100) < 50 THEN 'Frontend development' 
--          WHEN (ABS(RANDOM()) % 100) < 75 THEN 'Bug fixes'
--          WHEN (ABS(RANDOM()) % 100) < 90 THEN 'Refactoring code'
--          ELSE NULL
--        END
-- FROM (SELECT 0 AS i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
--       UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
--       UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
--       UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 
--       UNION SELECT 27 UNION SELECT 28 UNION SELECT 29)
-- WHERE (ABS(RANDOM()) % 100) < 80;  -- Only insert entries for ~80% of days

-- -- Work - Documentation
-- INSERT OR IGNORE INTO time_logs (category_id, date, total_time, notes) 
-- SELECT (SELECT id FROM categories WHERE name = 'Documentation'), 
--        date(date('now', '-' || i || ' days')), 
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 50 THEN (ABS(RANDOM()) % 90) + 30
--          ELSE 0
--        END,
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 50 THEN 'API documentation'
--          WHEN (ABS(RANDOM()) % 100) < 80 THEN 'User guide updates' 
--          ELSE NULL
--        END
-- FROM (SELECT 0 AS i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
--       UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
--       UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
--       UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 
--       UNION SELECT 27 UNION SELECT 28 UNION SELECT 29)
-- WHERE (ABS(RANDOM()) % 100) < 40;  -- Only insert entries for ~40% of days

-- -- Work - Planning
-- INSERT OR IGNORE INTO time_logs (category_id, date, total_time, notes) 
-- SELECT (SELECT id FROM categories WHERE name = 'Planning'), 
--        date(date('now', '-' || i || ' days')), 
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 60 THEN (ABS(RANDOM()) % 60) + 15
--          ELSE 0
--        END,
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 40 THEN 'Sprint planning'
--          WHEN (ABS(RANDOM()) % 100) < 70 THEN 'Task organization' 
--          ELSE NULL
--        END
-- FROM (SELECT 0 AS i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
--       UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
--       UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
--       UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 
--       UNION SELECT 27 UNION SELECT 28 UNION SELECT 29)
-- WHERE (ABS(RANDOM()) % 100) < 50;  -- Only insert entries for ~50% of days

-- -- Health - Exercise
-- INSERT OR IGNORE INTO time_logs (category_id, date, total_time, notes) 
-- SELECT (SELECT id FROM categories WHERE name = 'Exercise'), 
--        date(date('now', '-' || i || ' days')), 
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 70 THEN (ABS(RANDOM()) % 60) + 30
--          ELSE 0
--        END,
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 33 THEN 'Morning run'
--          WHEN (ABS(RANDOM()) % 100) < 66 THEN 'Gym workout' 
--          ELSE 'Home workout'
--        END
-- FROM (SELECT 0 AS i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
--       UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
--       UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
--       UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 
--       UNION SELECT 27 UNION SELECT 28 UNION SELECT 29)
-- WHERE (ABS(RANDOM()) % 100) < 60;  -- Only insert entries for ~60% of days

-- -- Health - Meditation
-- INSERT OR IGNORE INTO time_logs (category_id, date, total_time, notes) 
-- SELECT (SELECT id FROM categories WHERE name = 'Meditation'), 
--        date(date('now', '-' || i || ' days')), 
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 80 THEN (ABS(RANDOM()) % 15) + 10
--          ELSE 0
--        END,
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 50 THEN 'Morning meditation'
--          ELSE 'Evening relaxation'
--        END
-- FROM (SELECT 0 AS i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
--       UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
--       UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
--       UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 
--       UNION SELECT 27 UNION SELECT 28 UNION SELECT 29)
-- WHERE (ABS(RANDOM()) % 100) < 70;  -- Only insert entries for ~70% of days

-- -- Learning - Reading
-- INSERT OR IGNORE INTO time_logs (category_id, date, total_time, notes) 
-- SELECT (SELECT id FROM categories WHERE name = 'Reading'), 
--        date(date('now', '-' || i || ' days')), 
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 75 THEN (ABS(RANDOM()) % 90) + 30
--          ELSE 0
--        END,
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 40 THEN 'Technical book'
--          WHEN (ABS(RANDOM()) % 100) < 70 THEN 'Blog articles' 
--          ELSE 'Research papers'
--        END
-- FROM (SELECT 0 AS i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
--       UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
--       UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
--       UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 
--       UNION SELECT 27 UNION SELECT 28 UNION SELECT 29)
-- WHERE (ABS(RANDOM()) % 100) < 65;  -- Only insert entries for ~65% of days

-- -- Learning - Courses
-- INSERT OR IGNORE INTO time_logs (category_id, date, total_time, notes) 
-- SELECT (SELECT id FROM categories WHERE name = 'Courses'), 
--        date(date('now', '-' || i || ' days')), 
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 50 THEN (ABS(RANDOM()) % 120) + 60
--          ELSE 0
--        END,
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 40 THEN 'Frontend development course'
--          WHEN (ABS(RANDOM()) % 100) < 70 THEN 'Data visualization course' 
--          ELSE 'Machine learning course'
--        END
-- FROM (SELECT 0 AS i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
--       UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
--       UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
--       UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 
--       UNION SELECT 27 UNION SELECT 28 UNION SELECT 29)
-- WHERE (ABS(RANDOM()) % 100) < 40;  -- Only insert entries for ~40% of days

-- -- Personal - Family
-- INSERT OR IGNORE INTO time_logs (category_id, date, total_time, notes) 
-- SELECT (SELECT id FROM categories WHERE name = 'Family'), 
--        date(date('now', '-' || i || ' days')), 
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 90 THEN (ABS(RANDOM()) % 180) + 60
--          ELSE 0
--        END,
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 30 THEN 'Family dinner'
--          WHEN (ABS(RANDOM()) % 100) < 60 THEN 'Quality time' 
--          ELSE NULL
--        END
-- FROM (SELECT 0 AS i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
--       UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
--       UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
--       UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 
--       UNION SELECT 27 UNION SELECT 28 UNION SELECT 29)
-- WHERE (ABS(RANDOM()) % 100) < 85;  -- Only insert entries for ~85% of days

-- -- Entertainment - Gaming
-- INSERT OR IGNORE INTO time_logs (category_id, date, total_time, notes) 
-- SELECT (SELECT id FROM categories WHERE name = 'Gaming'), 
--        date(date('now', '-' || i || ' days')), 
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 60 THEN (ABS(RANDOM()) % 120) + 30
--          ELSE 0
--        END,
--        NULL
-- FROM (SELECT 0 AS i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
--       UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
--       UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
--       UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 
--       UNION SELECT 27 UNION SELECT 28 UNION SELECT 29)
-- WHERE (ABS(RANDOM()) % 100) < 50;  -- Only insert entries for ~50% of days

-- -- Entertainment - Social Media
-- INSERT OR IGNORE INTO time_logs (category_id, date, total_time, notes) 
-- SELECT (SELECT id FROM categories WHERE name = 'Social Media'), 
--        date(date('now', '-' || i || ' days')), 
--        CASE 
--          WHEN (ABS(RANDOM()) % 100) < 95 THEN (ABS(RANDOM()) % 60) + 15
--          ELSE 0
--        END,
--        NULL
-- FROM (SELECT 0 AS i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
--       UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
--       UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
--       UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 
--       UNION SELECT 27 UNION SELECT 28 UNION SELECT 29)
-- WHERE (ABS(RANDOM()) % 100) < 90;  -- Only insert entries for ~90% of days