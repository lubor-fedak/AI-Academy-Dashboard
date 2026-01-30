import { createServerSupabaseClient } from '@/lib/supabase-server';
import { MyDashboardClient } from '@/components/MyDashboardClient';
import type {
  Participant,
  Assignment,
  LeaderboardView,
  Achievement,
  TeamProgress
} from '@/lib/types';

export const revalidate = 0;

export default async function MyDashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch all data needed for the dashboard
  const [
    participantsResult,
    assignmentsResult,
    leaderboardResult,
    achievementsResult,
    teamProgressResult,
  ] = await Promise.all([
    supabase.from('participants').select('*'),
    supabase.from('assignments').select('*').order('day').order('type'),
    supabase.from('leaderboard_view').select('*').order('rank'),
    supabase.from('achievements').select('*'),
    supabase.from('team_progress').select('*'),
  ]);

  const participants = (participantsResult.data as Participant[]) ?? [];
  const assignments = (assignmentsResult.data as Assignment[]) ?? [];
  const leaderboard = (leaderboardResult.data as LeaderboardView[]) ?? [];
  const allAchievements = (achievementsResult.data as Achievement[]) ?? [];
  const teamProgress = (teamProgressResult.data as TeamProgress[]) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Môj Dashboard</h1>
        <p className="text-muted-foreground">
          Sleduj svoj pokrok, submisie a achievements
        </p>
      </div>

      <MyDashboardClient
        participants={participants}
        assignments={assignments}
        leaderboard={leaderboard}
        allAchievements={allAchievements}
        teamProgress={teamProgress}
      />
    </div>
  );
}
