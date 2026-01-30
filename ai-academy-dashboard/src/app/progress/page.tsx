import { createServerSupabaseClient } from '@/lib/supabase-server';
import { ProgressMatrix } from '@/components/ProgressMatrix';
import type { ProgressMatrix as ProgressMatrixType, Participant, Assignment, Submission } from '@/lib/types';

export const revalidate = 0;

export default async function ProgressPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch all data needed for drill-down
  const [matrixResult, participantsResult, assignmentsResult, submissionsResult] = await Promise.all([
    supabase.from('progress_matrix').select('*'),
    supabase.from('participants').select('*'),
    supabase.from('assignments').select('*').order('day').order('type'),
    supabase.from('submissions').select('participant_id, assignment_id, status, submitted_at'),
  ]);

  const matrix = (matrixResult.data as ProgressMatrixType[]) ?? [];
  const participants = (participantsResult.data as Participant[]) ?? [];
  const assignments = (assignmentsResult.data as Assignment[]) ?? [];
  const submissions = (submissionsResult.data as Pick<Submission, 'participant_id' | 'assignment_id' | 'status' | 'submitted_at'>[]) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Progress Matrix</h1>
        <p className="text-muted-foreground">
          Completion rates by role and assignment - click any cell for details
        </p>
      </div>
      <ProgressMatrix
        data={matrix}
        participants={participants}
        assignments={assignments}
        submissions={submissions}
      />
    </div>
  );
}
