-- ============================================================================
-- Security Improvements Migration
-- Date: 2026-01-31
-- Description: Add RLS policies for write operations and missing indexes
-- ============================================================================

-- ============================================================================
-- PART 1: Additional Indexes for Performance
-- ============================================================================

-- Index for participant status filtering (frequently used in AuthGuard)
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);

-- Index for submissions by submission time (used in deadline calculations)
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at DESC);

-- Index for mission_days by day number (frequently queried)
CREATE INDEX IF NOT EXISTS idx_mission_days_day ON mission_days(day);

-- Index for intel_drops by day and release status
CREATE INDEX IF NOT EXISTS idx_intel_drops_day_released ON intel_drops(day, is_released);

-- Index for task_force_members by participant (for lookups)
CREATE INDEX IF NOT EXISTS idx_task_force_members_participant_id ON task_force_members(participant_id);

-- Index for participant_mastery lookups
CREATE INDEX IF NOT EXISTS idx_participant_mastery_participant_id ON participant_mastery(participant_id);

-- Index for live_sessions by is_active (idx_live_sessions_active may already exist from operation migration)
CREATE INDEX IF NOT EXISTS idx_live_sessions_is_active ON live_sessions(is_active);

-- ============================================================================
-- PART 2: RLS Policies for Write Operations
-- ============================================================================

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE intel_drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_forces ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_force_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognition_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_recognitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_clients ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Participants Table Policies
-- ============================================================================

-- Keep existing public read policy (already exists)
-- DROP POLICY IF EXISTS "Public read participants" ON participants;
-- CREATE POLICY "Public read participants" ON participants FOR SELECT USING (true);

-- Only service role can insert (registration goes through API with validation)
DROP POLICY IF EXISTS "Service insert participants" ON participants;
CREATE POLICY "Service insert participants" ON participants
  FOR INSERT
  WITH CHECK (
    -- Allow service role (API routes) to insert
    (current_setting('role', true) = 'service_role')
  );

-- Only service role can update participants
DROP POLICY IF EXISTS "Service update participants" ON participants;
CREATE POLICY "Service update participants" ON participants
  FOR UPDATE
  USING (
    (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- Submissions Table Policies
-- ============================================================================

-- Keep existing public read and service insert policies

-- Only service role can update submissions (reviews go through API)
DROP POLICY IF EXISTS "Service update submissions" ON submissions;
CREATE POLICY "Service update submissions" ON submissions
  FOR UPDATE
  USING (
    (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- Leaderboard Table Policies
-- ============================================================================

-- Keep existing public read policy

-- Only service role or triggers can modify leaderboard
DROP POLICY IF EXISTS "Service modify leaderboard" ON leaderboard;
CREATE POLICY "Service modify leaderboard" ON leaderboard
  FOR ALL
  USING (
    (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- Activity Log Table Policies
-- ============================================================================

-- Keep existing public read policy

-- Only service role can insert activity logs
DROP POLICY IF EXISTS "Service insert activity_log" ON activity_log;
CREATE POLICY "Service insert activity_log" ON activity_log
  FOR INSERT
  WITH CHECK (
    (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- Assignments Table Policies
-- ============================================================================

-- Public read for assignments
DROP POLICY IF EXISTS "Public read assignments" ON assignments;
CREATE POLICY "Public read assignments" ON assignments
  FOR SELECT
  USING (true);

-- Only service role can modify assignments
DROP POLICY IF EXISTS "Service modify assignments" ON assignments;
CREATE POLICY "Service modify assignments" ON assignments
  FOR ALL
  USING (
    (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- Achievements Table Policies
-- ============================================================================

-- Public read for achievements
DROP POLICY IF EXISTS "Public read achievements" ON achievements;
CREATE POLICY "Public read achievements" ON achievements
  FOR SELECT
  USING (true);

-- Only service role can modify achievements
DROP POLICY IF EXISTS "Service modify achievements" ON achievements;
CREATE POLICY "Service modify achievements" ON achievements
  FOR ALL
  USING (
    (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- Participant Achievements Table Policies
-- ============================================================================

-- Public read for participant_achievements
DROP POLICY IF EXISTS "Public read participant_achievements" ON participant_achievements;
CREATE POLICY "Public read participant_achievements" ON participant_achievements
  FOR SELECT
  USING (true);

-- Only service role can modify
DROP POLICY IF EXISTS "Service modify participant_achievements" ON participant_achievements;
CREATE POLICY "Service modify participant_achievements" ON participant_achievements
  FOR ALL
  USING (
    (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- Intel Drops Table Policies
-- ============================================================================

-- Public read only for released intel drops
DROP POLICY IF EXISTS "Public read released intel_drops" ON intel_drops;
CREATE POLICY "Public read released intel_drops" ON intel_drops
  FOR SELECT
  USING (is_released = true OR (current_setting('role', true) = 'service_role'));

-- Only service role can modify intel drops
DROP POLICY IF EXISTS "Service modify intel_drops" ON intel_drops;
CREATE POLICY "Service modify intel_drops" ON intel_drops
  FOR ALL
  USING (
    (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- Mission Days Table Policies
-- ============================================================================

-- Public read for mission days
DROP POLICY IF EXISTS "Public read mission_days" ON mission_days;
CREATE POLICY "Public read mission_days" ON mission_days
  FOR SELECT
  USING (true);

-- Only service role can modify
DROP POLICY IF EXISTS "Service modify mission_days" ON mission_days;
CREATE POLICY "Service modify mission_days" ON mission_days
  FOR ALL
  USING (
    (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- Task Forces Table Policies
-- ============================================================================

-- Public read for task forces
DROP POLICY IF EXISTS "Public read task_forces" ON task_forces;
CREATE POLICY "Public read task_forces" ON task_forces
  FOR SELECT
  USING (true);

-- Only service role can modify
DROP POLICY IF EXISTS "Service modify task_forces" ON task_forces;
CREATE POLICY "Service modify task_forces" ON task_forces
  FOR ALL
  USING (
    (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- Task Force Members Table Policies
-- ============================================================================

-- Public read for task force members
DROP POLICY IF EXISTS "Public read task_force_members" ON task_force_members;
CREATE POLICY "Public read task_force_members" ON task_force_members
  FOR SELECT
  USING (true);

-- Only service role can modify
DROP POLICY IF EXISTS "Service modify task_force_members" ON task_force_members;
CREATE POLICY "Service modify task_force_members" ON task_force_members
  FOR ALL
  USING (
    (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- Participant Mastery Table Policies
-- ============================================================================

-- Public read for mastery (leaderboard visibility)
DROP POLICY IF EXISTS "Public read participant_mastery" ON participant_mastery;
CREATE POLICY "Public read participant_mastery" ON participant_mastery
  FOR SELECT
  USING (true);

-- Only service role can modify mastery
DROP POLICY IF EXISTS "Service modify participant_mastery" ON participant_mastery;
CREATE POLICY "Service modify participant_mastery" ON participant_mastery
  FOR ALL
  USING (
    (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- Recognition Types Table Policies
-- ============================================================================

-- Public read for recognition types
DROP POLICY IF EXISTS "Public read recognition_types" ON recognition_types;
CREATE POLICY "Public read recognition_types" ON recognition_types
  FOR SELECT
  USING (true);

-- Only service role can modify
DROP POLICY IF EXISTS "Service modify recognition_types" ON recognition_types;
CREATE POLICY "Service modify recognition_types" ON recognition_types
  FOR ALL
  USING (
    (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- Participant Recognitions Table Policies
-- ============================================================================

-- Public read for participant recognitions
DROP POLICY IF EXISTS "Public read participant_recognitions" ON participant_recognitions;
CREATE POLICY "Public read participant_recognitions" ON participant_recognitions
  FOR SELECT
  USING (true);

-- Only service role can modify
DROP POLICY IF EXISTS "Service modify participant_recognitions" ON participant_recognitions;
CREATE POLICY "Service modify participant_recognitions" ON participant_recognitions
  FOR ALL
  USING (
    (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- Live Sessions Table Policies
-- ============================================================================

-- Public read for active live sessions
DROP POLICY IF EXISTS "Public read live_sessions" ON live_sessions;
CREATE POLICY "Public read live_sessions" ON live_sessions
  FOR SELECT
  USING (is_active = true OR (current_setting('role', true) = 'service_role'));

-- Only service role can modify live sessions
DROP POLICY IF EXISTS "Service modify live_sessions" ON live_sessions;
CREATE POLICY "Service modify live_sessions" ON live_sessions
  FOR ALL
  USING (
    (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- Pilot Clients Table Policies
-- ============================================================================

-- Public read for pilot clients
DROP POLICY IF EXISTS "Public read pilot_clients" ON pilot_clients;
CREATE POLICY "Public read pilot_clients" ON pilot_clients
  FOR SELECT
  USING (true);

-- Only service role can modify
DROP POLICY IF EXISTS "Service modify pilot_clients" ON pilot_clients;
CREATE POLICY "Service modify pilot_clients" ON pilot_clients
  FOR ALL
  USING (
    (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- PART 3: Add audit columns for tracking changes
-- ============================================================================

-- Add updated_at column to key tables if not exists
DO $$
BEGIN
  -- participants
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'participants' AND column_name = 'updated_at') THEN
    ALTER TABLE participants ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- submissions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'submissions' AND column_name = 'updated_at') THEN
    ALTER TABLE submissions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- intel_drops
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'intel_drops' AND column_name = 'updated_at') THEN
    ALTER TABLE intel_drops ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END
$$;

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS trigger_participants_updated_at ON participants;
CREATE TRIGGER trigger_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_submissions_updated_at ON submissions;
CREATE TRIGGER trigger_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_intel_drops_updated_at ON intel_drops;
CREATE TRIGGER trigger_intel_drops_updated_at
  BEFORE UPDATE ON intel_drops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- End of Migration
-- ============================================================================
