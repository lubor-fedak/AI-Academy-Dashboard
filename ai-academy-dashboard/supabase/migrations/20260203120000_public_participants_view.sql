-- ============================================================================
-- Migration: Public-safe participants view + tighten participants RLS
-- Date: 2026-02-03
-- ============================================================================

-- ============================================================================
-- Public-safe view (no email or sensitive fields)
-- ============================================================================

CREATE OR REPLACE VIEW public_participants AS
SELECT
  id,
  name,
  nickname,
  github_username,
  role,
  team,
  stream,
  avatar_url,
  repo_url
FROM participants;

GRANT SELECT ON public_participants TO anon, authenticated;

-- Activity log view joined with public participant fields
CREATE OR REPLACE VIEW public_activity_log AS
SELECT
  al.id,
  al.participant_id,
  al.action,
  al.details,
  al.created_at,
  p.name,
  p.nickname,
  p.github_username,
  p.avatar_url,
  p.role,
  p.team,
  p.stream
FROM activity_log al
LEFT JOIN public_participants p ON p.id = al.participant_id;

GRANT SELECT ON public_activity_log TO anon, authenticated;

-- ============================================================================
-- Update existing public views to use public_participants
-- ============================================================================

CREATE OR REPLACE VIEW leaderboard_view AS
SELECT
  l.rank,
  p.name,
  p.github_username,
  p.role,
  p.team,
  p.stream,
  p.avatar_url,
  l.total_points,
  l.total_submissions,
  l.avg_mentor_rating,
  l.current_streak
FROM leaderboard l
JOIN public_participants p ON l.participant_id = p.id
ORDER BY l.rank;

CREATE OR REPLACE VIEW progress_matrix AS
SELECT
  p.role,
  a.day,
  a.type,
  COUNT(s.id) as submitted,
  COUNT(p.id) as total,
  ROUND(COUNT(s.id)::decimal / NULLIF(COUNT(p.id), 0) * 100, 0) as completion_pct
FROM public_participants p
CROSS JOIN assignments a
LEFT JOIN submissions s ON s.participant_id = p.id AND s.assignment_id = a.id
GROUP BY p.role, a.day, a.type
ORDER BY p.role, a.day, a.type;

CREATE OR REPLACE VIEW team_progress AS
SELECT
  p.team,
  SUM(l.total_points) as team_points,
  AVG(l.total_submissions) as avg_submissions,
  AVG(l.avg_mentor_rating) as avg_rating
FROM public_participants p
JOIN leaderboard l ON p.id = l.participant_id
GROUP BY p.team
ORDER BY team_points DESC;

-- ============================================================================
-- Tighten participants SELECT policies (remove public read)
-- ============================================================================

DROP POLICY IF EXISTS "Public read participants" ON participants;
DROP POLICY IF EXISTS "Users can view own profile" ON participants;

DROP POLICY IF EXISTS "Service read participants" ON participants;
CREATE POLICY "Service read participants" ON participants
  FOR SELECT
  USING (
    (current_setting('role', true) = 'service_role')
  );

DROP POLICY IF EXISTS "Authenticated read own participant" ON participants;
CREATE POLICY "Authenticated read own participant" ON participants
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid()::text = auth_user_id::text
      OR auth.jwt() ->> 'email' = email
    )
  );

DROP POLICY IF EXISTS "Admin read participants" ON participants;
CREATE POLICY "Admin read participants" ON participants
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1
      FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND au.is_active = true
    )
  );
