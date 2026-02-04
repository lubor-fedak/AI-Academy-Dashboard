import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { HomePage } from '@/components/HomePage';
import type { ActivityLogWithParticipant, Assignment } from '@/lib/types';

export const revalidate = 0;

export default async function Dashboard() {
  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Supabase is not configured.';
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">AI Academy Dashboard</h1>
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
              Configuration needed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">{message}</p>
            <p>
              Add <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_URL</code>,{' '}
              <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and{' '}
              <code className="rounded bg-muted px-1">SUPABASE_SERVICE_KEY</code> in Vercel → Project
              → Settings → Environment Variables, then redeploy.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch stats
  let participantCount = 0;
  let submissionCount = 0;
  let activities: ActivityLogWithParticipant[] = [];
  let assignments: Assignment[] = [];
  let fetchError: string | null = null;

  try {
    const [participantsResult, submissionsResult, activityResult, assignmentsResult] = await Promise.all([
      supabase.from('participants_public').select('id', { count: 'exact', head: true }),
      supabase.from('submissions').select('id', { count: 'exact', head: true }),
      supabase
        .from('activity_log_public')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('assignments')
        .select('*')
        .order('day')
        .order('type'),
    ]);

    participantCount = participantsResult.count ?? 0;
    submissionCount = submissionsResult.count ?? 0;
    // Map activity_log_public flat structure to ActivityLogWithParticipant (nested participants)
    const rawActivities = activityResult.data ?? [];
    activities = rawActivities.map((a: { id: string; participant_id: string; action: string; details: unknown; created_at: string; name: string | null; github_username: string | null; avatar_url: string | null }) => ({
      id: a.id,
      participant_id: a.participant_id,
      action: a.action,
      details: a.details,
      created_at: a.created_at,
      participants: a.name ? { name: a.name, github_username: a.github_username, avatar_url: a.avatar_url } : null,
    })) as ActivityLogWithParticipant[];
    assignments = (assignmentsResult.data as Assignment[]) ?? [];
  } catch (e) {
    fetchError = e instanceof Error ? e.message : 'Failed to load data from database.';
  }

  const assignmentCount = assignments.length;
  const totalPossible = participantCount * (assignmentCount ?? 0);
  const completionRate = totalPossible > 0 ? Math.round((submissionCount / totalPossible) * 100) : 0;

  if (fetchError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">AI Academy Dashboard</h1>
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
              Database not ready
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">{fetchError}</p>
            <p>
              Run the schema from <code className="rounded bg-muted px-1">supabase-schema.sql</code> in
              Supabase → SQL Editor, then refresh.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <HomePage
      participantCount={participantCount}
      submissionCount={submissionCount}
      activities={activities}
      assignments={assignments}
      completionRate={completionRate}
    />
  );
}
