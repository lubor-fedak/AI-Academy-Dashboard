'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { useAuth } from '@/components/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
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

interface AnalyticsData {
  participants: Participant[];
  assignments: Assignment[];
  submissions: SubmissionWithTimestamp[];
  leaderboard: LeaderboardView[];
  teamProgress: TeamProgress[];
  activityLog: ActivityLogEntry[];
}

export default function AnalyticsPage() {
  const { user, isAdmin, userStatus, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    // Analytics requires admin or mentor (API enforces requireAdminOrMentor)
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch('/api/analytics');
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch analytics');
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      }
    };

    fetchData();
  }, [user, isAdmin, userStatus, authLoading, router]);

  if (authLoading || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of progress, activity, and statistics for mentors
          </p>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of progress, activity, and statistics for mentors
        </p>
      </div>
      <AnalyticsDashboard
        participants={data.participants}
        assignments={data.assignments}
        submissions={data.submissions}
        leaderboard={data.leaderboard}
        teamProgress={data.teamProgress}
        activityLog={data.activityLog}
      />
    </div>
  );
}
