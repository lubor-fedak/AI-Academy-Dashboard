import { createServerSupabaseClient } from '@/lib/supabase-server';
import { MissionHub } from '@/components/MissionHub';
import type {
  MissionDay,
  TaskForce,
  PilotClient,
  IntelDrop,
  ParticipantMastery,
  TaskForceMember,
} from '@/lib/types';

export const revalidate = 0;

export default async function MissionPage() {
  const supabase = await createServerSupabaseClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all mission data in parallel
  const [
    missionDaysResult,
    taskForcesResult,
    pilotClientsResult,
    intelDropsResult,
    participantResult,
  ] = await Promise.all([
    supabase
      .from('mission_days')
      .select('*')
      .order('day'),
    supabase
      .from('task_forces')
      .select('*, pilot_clients(*)'),
    supabase
      .from('pilot_clients')
      .select('*'),
    supabase
      .from('intel_drops')
      .select('*')
      .eq('is_released', true)
      .order('day', { ascending: false }),
    user ? supabase
      .from('participants')
      .select(`
        *,
        participant_mastery(*),
        task_force_members(*, task_forces(*))
      `)
      .eq('email', user.email)
      .single() : Promise.resolve({ data: null }),
  ]);

  const allMissionDays = (missionDaysResult.data as MissionDay[]) ?? [];
  const taskForces = (taskForcesResult.data as (TaskForce & { pilot_clients: PilotClient | null })[]) ?? [];
  const pilotClients = (pilotClientsResult.data as PilotClient[]) ?? [];
  const intelDrops = (intelDropsResult.data as IntelDrop[]) ?? [];

  // Filter mission days to only show unlocked ones (unlock_date <= today)
  const todayStr = new Date().toISOString().split('T')[0];
  const missionDays = allMissionDays.filter(md => {
    if (!md.unlock_date) return false; // No unlock date = not unlocked
    return new Date(md.unlock_date) <= new Date(todayStr);
  });
  const participant = participantResult.data as {
    id: string;
    name: string;
    role: string;
    participant_mastery: ParticipantMastery | null;
    task_force_members: (TaskForceMember & { task_forces: TaskForce | null })[] | null;
  } | null;

  // Get participant's task force and client
  const participantTaskForce = participant?.task_force_members?.[0]?.task_forces ?? null;
  const participantClient = participantTaskForce
    ? pilotClients.find(c => c.id === participantTaskForce.client_id) ?? null
    : null;

  // Calculate current day based on program dates
  const programStart = new Date('2026-02-02');
  const today = new Date();
  const daysSinceStart = Math.floor((today.getTime() - programStart.getTime()) / (1000 * 60 * 60 * 24));

  // Map to actual program day (accounting for spring break week 3)
  let currentProgramDay = 1;
  if (daysSinceStart >= 0) {
    if (daysSinceStart < 5) {
      currentProgramDay = daysSinceStart + 1; // Days 1-5 (Week 1)
    } else if (daysSinceStart < 10) {
      currentProgramDay = daysSinceStart + 1; // Days 6-10 (Week 2)
    } else if (daysSinceStart < 17) {
      currentProgramDay = 10; // Spring break - stay on day 10
    } else if (daysSinceStart < 22) {
      currentProgramDay = daysSinceStart - 6; // Days 11-15 (Week 4)
    } else {
      currentProgramDay = Math.min(daysSinceStart - 6, 25); // Days 16-25 (Week 5)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OPERATION AI READY EUROPE</h1>
          <p className="text-muted-foreground">
            Your mission control center
          </p>
        </div>
        {currentProgramDay > 0 && currentProgramDay <= 25 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="text-sm font-medium text-blue-500">LIVE DAY {currentProgramDay}</span>
          </div>
        )}
      </div>

      <MissionHub
        missionDays={missionDays}
        taskForces={taskForces}
        intelDrops={intelDrops}
        currentProgramDay={currentProgramDay}
        participant={participant}
        participantTaskForce={participantTaskForce}
        participantClient={participantClient}
        participantMastery={participant?.participant_mastery ?? null}
      />
    </div>
  );
}
