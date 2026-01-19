-- Migration: Add difficulty level and category support to scenarios
-- Run this BEFORE inserting scenario seeds

-- Add new columns for difficulty-based filtering and categorization
ALTER TABLE scenarios 
ADD COLUMN IF NOT EXISTS difficulty_level TEXT NOT NULL DEFAULT 'A1',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add constraint to ensure valid difficulty levels (CEFR standard)
DO $$ BEGIN
    ALTER TABLE scenarios
    ADD CONSTRAINT valid_difficulty_level 
    CHECK (difficulty_level IN ('A0', 'A1', 'A2', 'B1', 'B2', 'C1'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes for efficient filtering on difficulty level
CREATE INDEX IF NOT EXISTS idx_scenarios_difficulty 
ON scenarios(difficulty_level);

CREATE INDEX IF NOT EXISTS idx_scenarios_category 
ON scenarios(category);

-- Composite index for the most common query (active scenarios by difficulty)
CREATE INDEX IF NOT EXISTS idx_scenarios_active_difficulty 
ON scenarios(is_active, difficulty_level) 
WHERE is_active = true;

-- Index for sorting within difficulty levels
CREATE INDEX IF NOT EXISTS idx_scenarios_sort 
ON scenarios(sort_order);

-- Update existing scenarios to have A1 difficulty if not set
UPDATE scenarios 
SET difficulty_level = 'A1' 
WHERE difficulty_level IS NULL;

COMMENT ON COLUMN scenarios.difficulty_level IS 'CEFR difficulty level: A0 (absolute beginner), A1 (beginner), A2 (elementary), B1 (intermediate), B2 (upper intermediate), C1 (advanced)';
COMMENT ON COLUMN scenarios.category IS 'Scenario category for organization: Daily Routines, Social, Food, Shopping, Travel, Health, School';
COMMENT ON COLUMN scenarios.sort_order IS 'Manual ordering within difficulty level, lower numbers appear first';
