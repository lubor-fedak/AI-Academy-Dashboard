-- ============================================================================
-- Migration: Participants Public View (RLS / Privacy)
-- Date: 2026-02-04
-- Description: Create view without sensitive data (email, auth_user_id) for
--              public leaderboard and progress displays. Use when restricting
--              direct participants table access.
-- ============================================================================

-- View exposes only non-sensitive participant data for approved users
-- Excludes: email, auth_user_id (and is_admin, is_mentor for security)
CREATE OR REPLACE VIEW public.participants_public AS
SELECT
  p.id,
  p.name,
  p.nickname,
  p.github_username,
  p.role,
  p.team,
  p.stream,
  p.avatar_url,
  p.repo_url,
  p.status,
  p.created_at,
  p.updated_at,
  l.total_points
FROM participants p
LEFT JOIN leaderboard l ON l.participant_id = p.id
WHERE p.status = 'approved';

-- Grant read access to anon and authenticated roles
GRANT SELECT ON public.participants_public TO anon;
GRANT SELECT ON public.participants_public TO authenticated;

COMMENT ON VIEW public.participants_public IS 'Public participant data for leaderboard; excludes email and auth_user_id';
