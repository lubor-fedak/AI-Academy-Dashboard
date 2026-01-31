import { createServerSupabaseClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { DayBriefing } from '@/components/DayBriefing';
import type { MissionDay, Assignment } from '@/lib/types';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MissionDayPage({ params }: PageProps) {
  const { id } = await params;
  const dayNumber = parseInt(id, 10);

  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 25) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();

  // Check if day is accessible
  const programStart = new Date('2026-02-02');
  const today = new Date();

  // Get current user and check admin status first
  const { data: { user } } = await supabase.auth.getUser();
  let userRole: string | undefined;
  let isAdmin = false;

  if (user) {
    // Check participants table
    const { data: participant } = await supabase
      .from('participants')
      .select('role, is_admin')
      .eq('email', user.email)
      .single();

    userRole = participant?.role ?? undefined;
    isAdmin = participant?.is_admin ?? false;

    // Also check admin_users table for email-authenticated admins
    if (!isAdmin) {
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      isAdmin = !!adminUser;
    }
  }

  // Fetch mission day
  const { data: missionDay, error } = await supabase
    .from('mission_days')
    .select('*')
    .eq('day', dayNumber)
    .single();

  if (error || !missionDay) {
    notFound();
  }

  // Check if day is unlocked (skip for admins - they can see all content)
  if (!isAdmin && missionDay.unlock_date) {
    const unlockDate = new Date(missionDay.unlock_date);
    if (today < unlockDate) {
      // Day is locked for non-admin users
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="text-6xl">🔒</div>
          <h1 className="text-2xl font-bold">Day {dayNumber} is Locked</h1>
          <p className="text-muted-foreground text-center max-w-md">
            This briefing will be available on {unlockDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}.
          </p>
        </div>
      );
    }
  }

  // Fetch adjacent days for navigation
  const [prevDayResult, nextDayResult, assignmentsResult, allDaysResult] = await Promise.all([
    dayNumber > 1
      ? supabase.from('mission_days').select('day, title').eq('day', dayNumber - 1).single()
      : Promise.resolve({ data: null }),
    dayNumber < 25
      ? supabase.from('mission_days').select('day, title').eq('day', dayNumber + 1).single()
      : Promise.resolve({ data: null }),
    // Fetch assignments for this day
    supabase
      .from('assignments')
      .select('*')
      .eq('day', dayNumber)
      .order('type'),
    // Fetch all days for timeline
    supabase
      .from('mission_days')
      .select('day, title, codename, act, week')
      .order('day'),
  ]);

  const prevDay = prevDayResult.data as { day: number; title: string } | null;
  const nextDay = nextDayResult.data as { day: number; title: string } | null;
  const assignments = (assignmentsResult.data as Assignment[]) ?? [];
  const allDays = (allDaysResult.data as Pick<MissionDay, 'day' | 'title' | 'codename' | 'act' | 'week'>[]) ?? [];

  // Calculate current program day
  const daysSinceStart = Math.floor((today.getTime() - programStart.getTime()) / (1000 * 60 * 60 * 24));
  let currentProgramDay = 1;
  if (daysSinceStart >= 0) {
    if (daysSinceStart < 5) {
      currentProgramDay = daysSinceStart + 1;
    } else if (daysSinceStart < 10) {
      currentProgramDay = daysSinceStart + 1;
    } else if (daysSinceStart < 17) {
      currentProgramDay = 10;
    } else if (daysSinceStart < 22) {
      currentProgramDay = daysSinceStart - 6;
    } else {
      currentProgramDay = Math.min(daysSinceStart - 6, 25);
    }
  }

  return (
    <DayBriefing
      missionDay={missionDay as MissionDay}
      assignments={assignments}
      prevDay={prevDay}
      nextDay={nextDay}
      allDays={allDays}
      currentProgramDay={currentProgramDay}
      userRole={userRole}
    />
  );
}

// Generate static params for all days
export async function generateStaticParams() {
  return Array.from({ length: 25 }, (_, i) => ({
    id: String(i + 1),
  }));
}
