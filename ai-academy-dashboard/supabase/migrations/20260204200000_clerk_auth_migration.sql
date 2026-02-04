-- ============================================================================
-- Migration: Clerk Authentication Migration
-- Date: 2026-02-04
-- Description: Update schema for Clerk authentication (replacing Supabase Auth)
--
-- Changes:
-- 1. Remove FK constraint on admin_users.user_id (Clerk uses string IDs)
-- 2. Change auth_user_id column type to TEXT for Clerk user IDs
-- 3. Update RLS helper functions for service role access
-- 4. Add index on participants.auth_user_id for faster lookups
-- ============================================================================

-- ============================================================================
-- PART 1: Update admin_users table for Clerk user IDs
-- ============================================================================

-- Drop the foreign key constraint (Clerk user IDs are not in auth.users)
ALTER TABLE admin_users
  DROP CONSTRAINT IF EXISTS admin_users_user_id_fkey;

-- Change user_id column type to TEXT (Clerk IDs are strings like "user_2abc...")
ALTER TABLE admin_users
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- ============================================================================
-- PART 2: Update participants.auth_user_id for Clerk user IDs
-- ============================================================================

-- Change auth_user_id column type to TEXT (from UUID)
-- First drop the index
DROP INDEX IF EXISTS idx_participants_auth_user_id;

-- Change column type
ALTER TABLE participants
  ALTER COLUMN auth_user_id TYPE TEXT USING auth_user_id::TEXT;

-- Recreate index
CREATE INDEX IF NOT EXISTS idx_participants_auth_user_id ON participants(auth_user_id);

-- ============================================================================
-- PART 3: Update RLS helper functions
-- Since we're using service role for most operations, these functions
-- are less critical, but we update them for consistency.
-- With Clerk, auth.uid() returns NULL, so these functions won't match
-- unless called with service_role.
-- ============================================================================

-- Update admin check function to handle both service role and potential future Clerk JWT
CREATE OR REPLACE FUNCTION public.current_user_is_admin() RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  -- Service role bypasses RLS, so this is mainly for anon/authenticated roles
  -- With Clerk, auth.uid() is NULL unless we set up Clerk-Supabase JWT integration
  SELECT EXISTS (
    SELECT 1 FROM participants
    WHERE auth_user_id = COALESCE(auth.uid()::TEXT, current_setting('request.jwt.claims', true)::json->>'sub')
      AND is_admin = true
  );
$$;

-- Update admin/mentor check function
CREATE OR REPLACE FUNCTION public.current_user_is_admin_or_mentor() RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM participants
    WHERE auth_user_id = COALESCE(auth.uid()::TEXT, current_setting('request.jwt.claims', true)::json->>'sub')
      AND (is_admin = true OR is_mentor = true)
  );
$$;

-- ============================================================================
-- PART 4: Update RLS policies for participants table
-- Since API routes use service_role (bypasses RLS), these policies mainly
-- affect direct browser Supabase client calls.
-- ============================================================================

-- Drop old policies that rely on Supabase Auth
DROP POLICY IF EXISTS "Users read own participant" ON participants;
DROP POLICY IF EXISTS "Users update own participant" ON participants;
DROP POLICY IF EXISTS "Authenticated read participants" ON participants;
DROP POLICY IF EXISTS "Users can view own profile" ON participants;
DROP POLICY IF EXISTS "Users can update own profile" ON participants;

-- Keep admin policies (they use helper functions)
-- DROP POLICY IF EXISTS "Admins and mentors read all participants" ON participants;
-- DROP POLICY IF EXISTS "Admins update participants" ON participants;

-- Allow public read on participants_public view (already granted)
-- The main participants table is now accessed via API routes using service role

-- For any remaining direct browser access, allow anon to read via participants_public view
-- The participants table itself should only be accessed via service role

-- ============================================================================
-- PART 5: Ensure public views are accessible
-- ============================================================================

-- Grant SELECT on public views to anon (for leaderboard, activity feed, etc.)
GRANT SELECT ON public.participants_public TO anon;
GRANT SELECT ON public.leaderboard_view TO anon;
GRANT SELECT ON public.activity_log_public TO anon;
GRANT SELECT ON public.team_progress TO anon;
GRANT SELECT ON public.progress_matrix TO anon;

-- ============================================================================
-- PART 6: Clean up any Supabase Auth specific data
-- ============================================================================

-- If there are any auth.users references that need updating, handle them here
-- For now, we just ensure the schema is compatible with Clerk user IDs

-- ============================================================================
-- End of Migration
-- ============================================================================

-- Note: After running this migration, you need to:
-- 1. Update admin_users.user_id values to Clerk user IDs for existing admins
-- 2. Update participants.auth_user_id values if any were set with Supabase UUIDs
--
-- Example to update an admin user:
-- UPDATE admin_users SET user_id = 'user_2abc123...' WHERE email = 'admin@example.com';
