import { createServerSupabaseClient } from '@/lib/supabase-server';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import type {
  Participant,
  Assignment,
  LeaderboardView,
  TeamProgress,
} from '@/lib/types';

export const revalidate = 0;

interface SubmissionWithTimestamp {
  id: string;
  participant_id: string;
  assignment_id: string;
  points_earned: number;
  mentor_rating: number | null;
  status: string;
  submitted_at: string;
  participants: {
    name: string;
    github_username: string;
    team: string;
    role: string;
  } | null;
  assignments: {
    title: string;
    day: number;
    type: string;
  } | null;
}

interface ActivityLogEntry {
  id: string;
  participant_id: string;
  action: string;
  created_at: string;
}

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch all data needed for analytics
  const [
    participantsResult,
    assignmentsResult,
    submissionsResult,
    leaderboardResult,
    teamProgressResult,
    activityResult,
  ] = await Promise.all([
    supabase.from('participants').select('*'),
    supabase.from('assignments').select('*').order('day').order('type'),
    supabase
      .from('submissions')
      .select('*, participants(name, github_username, team, role), assignments(title, day, type)')
      .order('submitted_at', { ascending: true }),
    supabase.from('leaderboard_view').select('*').order('rank'),
    supabase.from('team_progress').select('*').order('team_points', { ascending: false }),
    supabase
      .from('activity_log')
      .select('id, participant_id, action, created_at')
      .order('created_at', { ascending: true }),
  ]);

  const participants = (participantsResult.data as Participant[]) ?? [];
  const assignments = (assignmentsResult.data as Assignment[]) ?? [];
  const submissions = (submissionsResult.data as SubmissionWithTimestamp[]) ?? [];
  const leaderboard = (leaderboardResult.data as LeaderboardView[]) ?? [];
  const teamProgress = (teamProgressResult.data as TeamProgress[]) ?? [];
  const activityLog = (activityResult.data as ActivityLogEntry[]) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Prehľad pokroku, aktivity a štatistík pre mentorov
        </p>
      </div>

      <AnalyticsDashboard
        participants={participants}
        assignments={assignments}
        submissions={submissions}
        leaderboard={leaderboard}
        teamProgress={teamProgress}
        activityLog={activityLog}
      />
    </div>
  );
}
