import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import { requireAdminOrMentor } from '@/lib/api-auth';
import type {
  Participant,
  Assignment,
  LeaderboardView,
  TeamProgress,
} from '@/lib/types';

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

/**
 * GET /api/analytics
 * Fetch analytics data for mentors/admins. Uses service role to access
 * full participant data (needed for mentor dashboard).
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminOrMentor(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const supabase = createServiceSupabaseClient();

    const [
      participantsResult,
      assignmentsResult,
      submissionsResult,
      leaderboardResult,
      teamProgressResult,
      activityResult,
    ] = await Promise.all([
      supabase.from('participants_public').select('id, name, nickname, github_username, role, team, stream, avatar_url, total_points'),
      supabase.from('assignments').select('*').order('day').order('type'),
      supabase
        .from('submissions')
        .select('*, participants!inner(name, github_username, team, role), assignments(title, day, type)')
        .order('submitted_at', { ascending: true }),
      supabase.from('leaderboard_view').select('*').order('rank'),
      supabase.from('team_progress').select('*').order('team_points', { ascending: false }),
      supabase
        .from('activity_log')
        .select('id, participant_id, action, created_at')
        .order('created_at', { ascending: true }),
    ]);

    return NextResponse.json({
      participants: (participantsResult.data ?? []) as unknown as Participant[],
      assignments: (assignmentsResult.data as Assignment[]) ?? [],
      submissions: (submissionsResult.data as SubmissionWithTimestamp[]) ?? [],
      leaderboard: (leaderboardResult.data as LeaderboardView[]) ?? [],
      teamProgress: (teamProgressResult.data as TeamProgress[]) ?? [],
      activityLog: (activityResult.data as ActivityLogEntry[]) ?? [],
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
