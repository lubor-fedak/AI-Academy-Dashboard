import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { MyProgressDashboard } from '@/components/MyProgressDashboard';
import type {
  Participant,
  ParticipantMastery,
  TaskForce,
  PilotClient,
  RecognitionType,
  ParticipantRecognition,
  MissionDay,
} from '@/lib/types';

export const revalidate = 0;

export default async function MyProgressPage() {
  const supabase = await createServerSupabaseClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch participant with all related data
  const { data: participant, error } = await supabase
    .from('participants')
    .select('*')
    .eq('email', user.email)
    .single();

  if (error || !participant) {
    redirect('/onboarding');
  }

  // Fetch mastery data
  const { data: mastery } = await supabase
    .from('participant_mastery')
    .select('*')
    .eq('participant_id', participant.id)
    .single();

  // Fetch task force membership
  const { data: taskForceMembership } = await supabase
    .from('task_force_members')
    .select(`
      *,
      task_forces(*, pilot_clients(*))
    `)
    .eq('participant_id', participant.id)
    .single();

  // Fetch recognitions earned
  const { data: recognitionsEarned } = await supabase
    .from('participant_recognitions')
    .select(`
      *,
      recognition_types(*)
    `)
    .eq('participant_id', participant.id)
    .order('earned_at', { ascending: false });

  // Fetch all recognition types
  const { data: allRecognitionTypes } = await supabase
    .from('recognition_types')
    .select('*');

  // Fetch mission days for progress tracking
  const { data: missionDays } = await supabase
    .from('mission_days')
    .select('*')
    .order('day');

  // Fetch submissions to calculate progress
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, assignments(day)')
    .eq('participant_id', participant.id);

  // Calculate completed days
  const completedDays = new Set(
    submissions?.map(s => (s.assignments as { day: number } | null)?.day).filter(Boolean) ?? []
  );

  const taskForce = taskForceMembership?.task_forces as (TaskForce & { pilot_clients: PilotClient | null }) | null;
  const client = taskForce?.pilot_clients ?? null;

  return (
    <MyProgressDashboard
      participant={participant as Participant}
      mastery={mastery as ParticipantMastery | null}
      taskForce={taskForce}
      client={client}
      recognitionsEarned={(recognitionsEarned as (ParticipantRecognition & { recognition_types: RecognitionType })[]) ?? []}
      allRecognitionTypes={(allRecognitionTypes as RecognitionType[]) ?? []}
      missionDays={(missionDays as MissionDay[]) ?? []}
      completedDays={Array.from(completedDays) as number[]}
      totalSubmissions={submissions?.length ?? 0}
    />
  );
}
