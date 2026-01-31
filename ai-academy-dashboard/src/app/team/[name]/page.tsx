import { createServerSupabaseClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { TaskForceDashboard } from '@/components/TaskForceDashboard';
import type { TaskForce, PilotClient, Participant, ParticipantMastery } from '@/lib/types';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function TaskForcePage({ params }: PageProps) {
  const { name } = await params;
  const taskForceName = name.toUpperCase();

  // Valid task force names
  const validNames = ['RHEIN', 'LYON', 'MILAN', 'AMSTERDAM'];
  if (!validNames.includes(taskForceName)) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();

  // Fetch task force with client
  const { data: taskForce, error } = await supabase
    .from('task_forces')
    .select(`
      *,
      pilot_clients(*)
    `)
    .eq('name', taskForceName)
    .single();

  if (error || !taskForce) {
    notFound();
  }

  // Fetch task force members with their mastery
  const { data: members } = await supabase
    .from('task_force_members')
    .select(`
      *,
      participants(*),
      participant_id
    `)
    .eq('task_force_id', taskForce.id);

  // Fetch mastery data for all members
  const memberIds = members?.map(m => m.participant_id) || [];
  const { data: masteryData } = memberIds.length > 0
    ? await supabase
        .from('participant_mastery')
        .select('*')
        .in('participant_id', memberIds)
    : { data: [] };

  // Create a map of mastery data
  const masteryMap = new Map(
    (masteryData || []).map(m => [m.participant_id, m])
  );

  // Combine members with their mastery
  const membersWithMastery = (members || []).map(member => ({
    ...member,
    mastery: masteryMap.get(member.participant_id) || null,
  }));

  // Calculate role stats
  const roleStats = membersWithMastery.reduce((acc, member) => {
    const role = (member.participants as Participant)?.role || 'Unknown';
    if (!acc[role]) {
      acc[role] = { total: 0, specialists: 0, field_ready: 0, field_trainee: 0, trainee: 0 };
    }
    acc[role].total++;
    if (member.mastery) {
      if (member.mastery.clearance === 'SPECIALIST') acc[role].specialists++;
      else if (member.mastery.clearance === 'FIELD_READY') acc[role].field_ready++;
      else if (member.mastery.clearance === 'FIELD_TRAINEE') acc[role].field_trainee++;
      else acc[role].trainee++;
    } else {
      acc[role].trainee++;
    }
    return acc;
  }, {} as Record<string, { total: number; specialists: number; field_ready: number; field_trainee: number; trainee: number }>);

  // Calculate overall readiness
  const totalMembers = membersWithMastery.length;
  const totalMasteryLevel = membersWithMastery.reduce((sum, m) => sum + (m.mastery?.mastery_level || 1), 0);
  const overallReadiness = totalMembers > 0 ? Math.round((totalMasteryLevel / (totalMembers * 4)) * 100) : 0;

  // Get team leads
  const teamLeads = membersWithMastery.filter(m => m.is_team_lead);

  return (
    <TaskForceDashboard
      taskForce={taskForce as TaskForce & { pilot_clients: PilotClient | null }}
      members={membersWithMastery as Array<{
        id: string;
        participant_id: string;
        is_team_lead: boolean;
        participants: Participant | null;
        mastery: ParticipantMastery | null;
      }>}
      roleStats={roleStats}
      overallReadiness={overallReadiness}
      teamLeads={teamLeads}
    />
  );
}

// Generate static params for all task forces
export async function generateStaticParams() {
  return [
    { name: 'rhein' },
    { name: 'lyon' },
    { name: 'milan' },
    { name: 'amsterdam' },
  ];
}
