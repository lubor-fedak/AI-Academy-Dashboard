'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Activity, GitCommit, Award } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ACHIEVEMENT_ICONS } from '@/lib/types';
import type { ActivityLogWithParticipant } from '@/lib/types';

interface ActivityFeedProps {
  initialData: ActivityLogWithParticipant[];
  limit?: number;
}

export function ActivityFeed({ initialData, limit = 10 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLogWithParticipant[]>(initialData);

  // Subscribe to real-time updates
  useEffect(() => {
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
        },
        async (payload) => {
          // Fetch the new activity with participant details
          const { data: newActivity, error } = await supabase
            .from('activity_log')
            .select('*, participants(name, github_username, avatar_url)')
            .eq('id', payload.new.id)
            .single();

          if (!error && newActivity) {
            setActivities((prev) => [newActivity as ActivityLogWithParticipant, ...prev.slice(0, limit - 1)]);
            
            // Show toast for achievements
            if (payload.new.action === 'achievement') {
              const code = payload.new.details?.achievement_code as string;
              toast.success('Achievement Unlocked!', {
                description: `${ACHIEVEMENT_ICONS[code] || '🏆'} New achievement earned!`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'submission':
        return <GitCommit className="h-4 w-4 text-green-500" />;
      case 'achievement':
        return <Award className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getActivityText = (activity: ActivityLogWithParticipant) => {
    const details = activity.details as Record<string, string> | null;
    
    switch (activity.action) {
      case 'submission':
        return (
          <span>
            submitted to <Badge variant="outline">{details?.folder || 'assignment'}</Badge>
          </span>
        );
      case 'achievement':
        const code = details?.achievement_code;
        return (
          <span>
            earned {ACHIEVEMENT_ICONS[code || ''] || '🏆'}{' '}
            <Badge variant="secondary">{code?.replace('_', ' ')}</Badge>
          </span>
        );
      case 'review':
        return <span>received a mentor review</span>;
      default:
        return <span>{activity.action}</span>;
    }
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No activity yet. Waiting for submissions...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#0062FF]" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-accent/50 transition-colors"
            >
              <div className="mt-1">{getActivityIcon(activity.action)}</div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.participants?.avatar_url ?? undefined} />
                <AvatarFallback>
                  {activity.participants?.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('') || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <Link
                    href={`/participant/${activity.participants?.github_username}`}
                    className="font-medium hover:underline"
                  >
                    {activity.participants?.name || 'Unknown'}
                  </Link>{' '}
                  {getActivityText(activity)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
