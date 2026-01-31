import { createServerSupabaseClient } from '@/lib/supabase-server';
import { LiveSessionPage } from '@/components/LiveSessionPage';
import type { MissionDay, LiveSession } from '@/lib/types';

export const revalidate = 0;

export default async function LiveSessionRoute() {
  const supabase = await createServerSupabaseClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch mission days
  const { data: missionDays } = await supabase
    .from('mission_days')
    .select('*')
    .order('day');

  // Fetch active sessions
  const { data: activeSessions } = await supabase
    .from('live_sessions')
    .select(`
      *,
      mission_days(*)
    `)
    .eq('is_active', true);

  // Check if user is admin/instructor
  let isInstructor = false;
  if (user) {
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', user.email)
      .single();
    isInstructor = !!adminUser;
  }

  return (
    <LiveSessionPage
      missionDays={(missionDays as MissionDay[]) ?? []}
      activeSessions={(activeSessions as (LiveSession & { mission_days: MissionDay | null })[]) ?? []}
      isInstructor={isInstructor}
      userId={user?.id ?? null}
    />
  );
}
