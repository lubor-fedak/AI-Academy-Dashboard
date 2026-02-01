import { createServerSupabaseClient } from '@/lib/supabase-server';
import { MyDashboardClient } from '@/components/MyDashboardClient';
import type {
  Assignment,
  LeaderboardView,
  Achievement,
  TeamProgress,
  MissionDay
} from '@/lib/types';

export const revalidate = 0;

export default async function MyDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Fetch all data needed for the dashboard
  const [
    assignmentsResult,
    leaderboardResult,
    achievementsResult,
    teamProgressResult,
    missionDaysResult,
  ] = await Promise.all([
    supabase.from('assignments').select('*').order('day').order('type'),
    supabase.from('leaderboard_view').select('*').order('rank'),
    supabase.from('achievements').select('*'),
    supabase.from('team_progress').select('*'),
    // Fetch mission days to determine which are unlocked
    supabase.from('mission_days').select('day, unlock_date, is_visible'),
  ]);

  const allAssignments = (assignmentsResult.data as Assignment[]) ?? [];
  const leaderboard = (leaderboardResult.data as LeaderboardView[]) ?? [];
  const allAchievements = (achievementsResult.data as Achievement[]) ?? [];
  const teamProgress = (teamProgressResult.data as TeamProgress[]) ?? [];
  const missionDays = (missionDaysResult.data as Pick<MissionDay, 'day' | 'unlock_date' | 'is_visible'>[]) ?? [];

  // Determine which days are unlocked (unlock_date <= today OR is_visible = true)
  const unlockedDays = new Set(
    missionDays
      .filter(md => {
        if (!md.unlock_date) return md.is_visible;
        return new Date(md.unlock_date) <= new Date(today) || md.is_visible;
      })
      .map(md => md.day)
  );

  // Filter assignments to only include those for unlocked days
  // Students should only see assignments for days that have been unlocked
  const assignments = allAssignments.filter(a => unlockedDays.has(a.day));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">
          Track your progress, submissions, and achievements
        </p>
      </div>

      <MyDashboardClient
        assignments={assignments}
        leaderboard={leaderboard}
        allAchievements={allAchievements}
        teamProgress={teamProgress}
      />
    </div>
  );
}
