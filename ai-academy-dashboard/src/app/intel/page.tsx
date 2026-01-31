import { createServerSupabaseClient } from '@/lib/supabase-server';
import { IntelDropsPage } from '@/components/IntelDropsPage';
import type { IntelDrop } from '@/lib/types';

export const revalidate = 0;

export default async function IntelPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch all released intel drops
  const { data: intelDrops } = await supabase
    .from('intel_drops')
    .select('*')
    .eq('is_released', true)
    .order('day', { ascending: false });

  // Get user's task force for filtering
  const { data: { user } } = await supabase.auth.getUser();

  let userTaskForce: string | null = null;
  if (user) {
    const { data: participant } = await supabase
      .from('participants')
      .select(`
        task_force_members(task_forces(name))
      `)
      .eq('email', user.email)
      .single();

    // Extract task force name from nested structure
    const tfMembers = participant?.task_force_members;
    if (Array.isArray(tfMembers) && tfMembers.length > 0) {
      const firstMember = tfMembers[0] as { task_forces?: { name?: string } | { name?: string }[] };
      if (firstMember?.task_forces) {
        if (Array.isArray(firstMember.task_forces)) {
          userTaskForce = firstMember.task_forces[0]?.name ?? null;
        } else {
          userTaskForce = firstMember.task_forces.name ?? null;
        }
      }
    }
  }

  return (
    <IntelDropsPage
      intelDrops={(intelDrops as IntelDrop[]) ?? []}
      userTaskForce={userTaskForce}
    />
  );
}
