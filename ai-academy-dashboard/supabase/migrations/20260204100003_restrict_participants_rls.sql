-- ============================================================================
-- Migration: Restrict Participants RLS - Hide Emails from Public
-- Date: 2026-02-04
-- Description: Drop public read on participants, add row-level policies for
--              authenticated users, recreate views to use participants_public.
-- ============================================================================

-- ============================================================================
-- PART 1: Create activity_log_public view (for dashboard/activity feed)
-- ============================================================================

CREATE OR REPLACE VIEW public.activity_log_public AS
SELECT
  a.id,
  a.participant_id,
  a.action,
  a.details,
  a.created_at,
  pp.name,
  pp.github_username,
  pp.avatar_url
FROM activity_log a
LEFT JOIN participants_public pp ON pp.id = a.participant_id;

GRANT SELECT ON public.activity_log_public TO anon;
GRANT SELECT ON public.activity_log_public TO authenticated;

-- ============================================================================
-- PART 2: Recreate leaderboard_view to use participants_public
-- ============================================================================

DROP VIEW IF EXISTS leaderboard_view;
CREATE VIEW leaderboard_view AS
SELECT
  l.rank,
  pp.name,
  pp.github_username,
  pp.role,
  pp.team,
  pp.stream,
  pp.avatar_url,
  l.total_points,
  l.total_submissions,
  l.avg_mentor_rating,
  l.current_streak
FROM leaderboard l
JOIN participants_public pp ON pp.id = l.participant_id
ORDER BY l.rank;

-- ============================================================================
-- PART 3: Recreate team_progress to use participants_public
-- ============================================================================

DROP VIEW IF EXISTS team_progress;
CREATE VIEW team_progress AS
SELECT
  pp.team,
  SUM(l.total_points) as team_points,
  AVG(l.total_submissions) as avg_submissions,
  AVG(l.avg_mentor_rating) as avg_rating
FROM participants_public pp
JOIN leaderboard l ON l.participant_id = pp.id
GROUP BY pp.team
ORDER BY team_points DESC;

-- ============================================================================
-- PART 4: Recreate progress_matrix to use participants_public
-- ============================================================================

DROP VIEW IF EXISTS progress_matrix;
CREATE VIEW progress_matrix AS
SELECT
  pp.role,
  a.day,
  a.type,
  COUNT(s.id) as submitted,
  COUNT(pp.id) as total,
  ROUND(COUNT(s.id)::decimal / NULLIF(COUNT(pp.id), 0) * 100, 0) as completion_pct
FROM participants_public pp
CROSS JOIN assignments a
LEFT JOIN submissions s ON s.participant_id = pp.id AND s.assignment_id = a.id
GROUP BY pp.role, a.day, a.type
ORDER BY pp.role, a.day, a.type;

-- ============================================================================
-- PART 5: Drop Public read participants, add restrictive policies
-- ============================================================================

DROP POLICY IF EXISTS "Public read participants" ON participants;

-- SECURITY DEFINER functions to check admin/mentor status (bypass RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.current_user_is_admin() RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM participants
    WHERE auth_user_id = auth.uid() AND is_admin = true
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin_or_mentor() RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM participants
    WHERE auth_user_id = auth.uid() AND (is_admin = true OR is_mentor = true)
  );
$$;

-- Authenticated users can read their own participant row (by auth_user_id or email for first login)
CREATE POLICY "Users read own participant" ON participants
  FOR SELECT
  USING (
    auth_user_id = auth.uid()
    OR email = (auth.jwt() ->> 'email')
  );

-- Admins and mentors can read all participants (for admin panel, review flow)
CREATE POLICY "Admins and mentors read all participants" ON participants
  FOR SELECT
  USING (public.current_user_is_admin_or_mentor());

-- Authenticated academy members can read all participants (for comments, live sessions, peer reviews)
-- Blocks unauthenticated scraping while allowing app functionality for logged-in users
CREATE POLICY "Authenticated read participants" ON participants
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can update their own participant row (profile updates)
CREATE POLICY "Users update own participant" ON participants
  FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Admins can update any participant (for status changes, etc.)
CREATE POLICY "Admins update participants" ON participants
  FOR UPDATE
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());
