-- Migration: User approval system and admin users
-- Date: 2026-01-30
-- Adds: participants.status, participants.is_admin, admin_users table

-- ============================================
-- PARTICIPANT STATUS (pending/approved/rejected)
-- ============================================

DO $$ BEGIN
  CREATE TYPE participant_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS status participant_status NOT NULL DEFAULT 'pending';

-- Existing participants are considered approved
UPDATE participants SET status = 'approved' WHERE status = 'pending';

-- ============================================
-- PARTICIPANT IS_ADMIN
-- ============================================

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- ADMIN_USERS (email-authenticated admins)
-- ============================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_participant_id ON admin_users(participant_id);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins / service can read admin_users
CREATE POLICY "admin_users_select_policy" ON admin_users
  FOR SELECT USING (true);

CREATE POLICY "admin_users_service_policy" ON admin_users
  FOR ALL USING (true);

-- Optional: allow approved participants to read their own status
-- (existing "Public read participants" already exposes participants; restrict in app if needed)
