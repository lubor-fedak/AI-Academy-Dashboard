-- Migration: Add peer_reviews and comments tables for ROADMAP features #10 and #14
-- Date: 2026-01-30

-- ============================================
-- PEER REVIEWS TABLE (#10 - Peer Review System)
-- ============================================

CREATE TABLE IF NOT EXISTS peer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  bonus_points_earned INTEGER DEFAULT 0,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Ensure a reviewer can only review a submission once
  UNIQUE(submission_id, reviewer_id)
);

-- Indexes for peer_reviews
CREATE INDEX IF NOT EXISTS idx_peer_reviews_reviewer_id ON peer_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_submission_id ON peer_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_status ON peer_reviews(status);

-- Enable RLS on peer_reviews
ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read peer reviews
CREATE POLICY "peer_reviews_select_policy" ON peer_reviews
  FOR SELECT USING (true);

-- Policy: Service role can insert/update/delete
CREATE POLICY "peer_reviews_service_policy" ON peer_reviews
  FOR ALL USING (true);

-- ============================================
-- COMMENTS TABLE (#14 - Comments and Discussions)
-- ============================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_submission_id ON comments(submission_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Enable RLS on comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read comments
CREATE POLICY "comments_select_policy" ON comments
  FOR SELECT USING (true);

-- Policy: Service role can insert/update/delete
CREATE POLICY "comments_service_policy" ON comments
  FOR ALL USING (true);

-- ============================================
-- RPC FUNCTION: increment_bonus_points
-- ============================================

CREATE OR REPLACE FUNCTION increment_bonus_points(
  p_participant_id UUID,
  p_points INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update bonus_points in submissions (if tracking there)
  -- or update a separate bonus tracking column

  -- For now, we'll update the leaderboard_entries directly
  UPDATE leaderboard_entries
  SET
    total_points = total_points + p_points,
    updated_at = NOW()
  WHERE participant_id = p_participant_id;

  -- If no leaderboard entry exists, create one
  IF NOT FOUND THEN
    INSERT INTO leaderboard_entries (participant_id, total_points, updated_at)
    VALUES (p_participant_id, p_points, NOW())
    ON CONFLICT (participant_id) DO UPDATE
    SET total_points = leaderboard_entries.total_points + p_points,
        updated_at = NOW();
  END IF;
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage to authenticated users
GRANT SELECT ON peer_reviews TO authenticated;
GRANT SELECT ON comments TO authenticated;

-- Grant all to service role
GRANT ALL ON peer_reviews TO service_role;
GRANT ALL ON comments TO service_role;

-- Grant execute on function
GRANT EXECUTE ON FUNCTION increment_bonus_points(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_bonus_points(UUID, INTEGER) TO service_role;
