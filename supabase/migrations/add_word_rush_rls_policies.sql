-- Row Level Security Policies for Word Rush Tables
-- Run this in Supabase Dashboard → SQL Editor

-- ============================================================================
-- ENABLE RLS ON ALL WORD RUSH TABLES
-- ============================================================================

ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_rush_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VOCABULARY TABLE POLICIES
-- Everyone can read vocabulary (it's public content)
-- ============================================================================

CREATE POLICY "Anyone can read vocabulary"
ON vocabulary
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can insert vocabulary"
ON vocabulary
FOR INSERT
TO service_role
WITH CHECK (true);

-- ============================================================================
-- USER_WORD_PROGRESS TABLE POLICIES
-- Users can only access their own word progress
-- ============================================================================

CREATE POLICY "Users can read their own word progress"
ON user_word_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own word progress"
ON user_word_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own word progress"
ON user_word_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- WORD_RUSH_SESSIONS TABLE POLICIES
-- Users can only access their own sessions
-- ============================================================================

CREATE POLICY "Users can read their own sessions"
ON word_rush_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
ON word_rush_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- USER_BADGES TABLE POLICIES
-- Users can only access their own badges
-- ============================================================================

CREATE POLICY "Users can read their own badges"
ON user_badges
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
ON user_badges
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- GRANT USAGE ON TABLES (if needed)
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON vocabulary TO authenticated;
GRANT ALL ON user_word_progress TO authenticated;
GRANT ALL ON word_rush_sessions TO authenticated;
GRANT ALL ON user_badges TO authenticated;
