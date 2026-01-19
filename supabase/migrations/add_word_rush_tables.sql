-- Migration: Add Word Rush vocabulary and progress tracking
-- Creates tables for vocabulary, user progress, sessions, and badges

-- ============================================================================
-- VOCABULARY TABLE
-- Stores Spanish words with difficulty levels (A0, A1, A2)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vocabulary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  english_word TEXT NOT NULL,
  spanish_word TEXT NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('A0', 'A1', 'A2', 'B1', 'B2')),
  category TEXT, -- e.g., "animals", "food", "daily_routines", "verbs"
  illustration_emoji TEXT,
  audio_url TEXT, -- Optional: pre-generated TTS URLs
  is_core BOOLEAN DEFAULT false, -- True for seeded core vocabulary (500 words)
  source TEXT DEFAULT 'seeded' CHECK (source IN ('seeded', 'ai_generated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_vocabulary_difficulty ON vocabulary(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_vocabulary_category ON vocabulary(difficulty_level, category);
CREATE INDEX IF NOT EXISTS idx_vocabulary_core ON vocabulary(is_core, difficulty_level);

-- ============================================================================
-- USER WORD PROGRESS TABLE
-- Tracks which words users have mastered vs. still learning
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_word_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vocabulary_id UUID REFERENCES vocabulary(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('learning', 'mastered')) DEFAULT 'learning',
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  last_practiced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vocabulary_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_word_progress_user ON user_word_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_word_progress_status ON user_word_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_word_progress_vocabulary ON user_word_progress(vocabulary_id);

-- ============================================================================
-- WORD RUSH SESSIONS TABLE
-- Tracks flashcard sessions for analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS word_rush_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_length INTEGER NOT NULL, -- Number of words (e.g., 10, 20, 30)
  difficulty_level TEXT NOT NULL,
  words_correct INTEGER DEFAULT 0,
  words_incorrect INTEGER DEFAULT 0,
  duration_seconds INTEGER, -- Total session time
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_word_rush_sessions_user ON word_rush_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_word_rush_sessions_created ON word_rush_sessions(created_at);

-- ============================================================================
-- USER BADGES TABLE
-- Tracks earned badges (stuffed animals) for Word Rush and other features
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL, -- e.g., "word_rush_bear", "word_rush_bunny"
  badge_category TEXT NOT NULL CHECK (badge_category IN ('word_rush', 'mystery', 'story')),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB, -- e.g., { "words_mastered": 25, "label": "25 words!" }
  UNIQUE(user_id, badge_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_category ON user_badges(user_id, badge_category);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE vocabulary IS 'Spanish vocabulary words for Word Rush flashcard feature';
COMMENT ON COLUMN vocabulary.is_core IS 'True for the 500 seeded core words based on CEFR frequency lists';
COMMENT ON COLUMN vocabulary.source IS 'Origin of word: seeded (CEFR lists) or ai_generated (personalized)';

COMMENT ON TABLE user_word_progress IS 'Tracks individual word mastery and spaced repetition';
COMMENT ON COLUMN user_word_progress.status IS 'learning = still practicing, mastered = consistently correct';

COMMENT ON TABLE word_rush_sessions IS 'Analytics for Word Rush flashcard sessions';

COMMENT ON TABLE user_badges IS 'Earned badges across all features (Word Rush stuffed animals, mystery badges, story badges)';
