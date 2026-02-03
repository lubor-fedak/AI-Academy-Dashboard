-- Migration: Update Day 2 Assignment
-- Date: 2026-02-03
-- Description: Updates the assignment entry for Day 2 to match the new Agentic Framework + Clerk scope

-- Update Day 2 in-class assignment
UPDATE assignments
SET
  title = 'Agentic AI Framework + Clerk Auth',
  folder_name = 'day-02-agentic-framework',
  description = 'Explain the 5 evolution layers of AI and implement Clerk authentication'
WHERE day = 2 AND type = 'in_class';

-- Update Day 2 homework assignment (if exists)
UPDATE assignments
SET
  title = 'Clerk Integration Deep Dive',
  description = 'Extend Clerk implementation with role-based agent capabilities and user context personalization'
WHERE day = 2 AND type = 'homework';

-- If there's no Day 2 assignment yet, insert it
INSERT INTO assignments (day, type, title, folder_name, max_points, description)
SELECT 2, 'in_class', 'Agentic AI Framework + Clerk Auth', 'day-02-agentic-framework', 15,
       'Explain the 5 evolution layers of AI and implement Clerk authentication'
WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE day = 2 AND type = 'in_class');
