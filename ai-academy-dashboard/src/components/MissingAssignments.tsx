'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { differenceInHours, differenceInMinutes, formatDistanceToNow } from 'date-fns';
import { sk } from 'date-fns/locale';
import { AlertCircle, Clock, ExternalLink, AlertTriangle } from 'lucide-react';
import type { Assignment } from '@/lib/types';

interface MissingAssignmentsProps {
  assignments: Assignment[];
  repoUrl?: string | null;
  compact?: boolean;
}

type DeadlineStatus = 'overdue' | 'urgent' | 'soon' | 'ok' | 'none';

function getDeadlineStatus(assignment: Assignment): DeadlineStatus {
  if (!assignment.due_at) return 'none';
  const hoursLeft = differenceInHours(new Date(assignment.due_at), new Date());
  if (hoursLeft < 0) return 'overdue';
  if (hoursLeft < 24) return 'urgent';
  if (hoursLeft < 72) return 'soon';
  return 'ok';
}

function getStatusStyles(status: DeadlineStatus): string {
  switch (status) {
    case 'overdue':
      return 'bg-red-500/10 border border-red-500/30';
    case 'urgent':
      return 'bg-orange-500/10 border border-orange-500/30';
    case 'soon':
      return 'bg-yellow-500/10 border border-yellow-500/30';
    default:
      return 'bg-accent/50';
  }
}

function CountdownTimer({ dueAt }: { dueAt: string }) {
  const now = new Date();
  const due = new Date(dueAt);
  const hoursLeft = differenceInHours(due, now);
  const minutesLeft = differenceInMinutes(due, now) % 60;

  if (hoursLeft < 0) {
    return (
      <span className="text-red-500 font-medium">
        Po termíne
      </span>
    );
  }

  if (hoursLeft < 24) {
    return (
      <span className="text-orange-500 font-medium">
        {hoursLeft}h {minutesLeft}m
      </span>
    );
  }

  return (
    <span className="text-muted-foreground">
      {formatDistanceToNow(due, { addSuffix: true, locale: sk })}
    </span>
  );
}

export function MissingAssignments({
  assignments,
  repoUrl,
  compact = false,
}: MissingAssignmentsProps) {
  if (assignments.length === 0) {
    return null;
  }

  // Sort by deadline urgency
  const sortedAssignments = [...assignments].sort((a, b) => {
    const statusOrder: Record<DeadlineStatus, number> = {
      overdue: 0,
      urgent: 1,
      soon: 2,
      ok: 3,
      none: 4,
    };
    const statusA = getDeadlineStatus(a);
    const statusB = getDeadlineStatus(b);
    if (statusOrder[statusA] !== statusOrder[statusB]) {
      return statusOrder[statusA] - statusOrder[statusB];
    }
    // Then by day
    return a.day - b.day;
  });

  // Count by urgency
  const overdueCount = sortedAssignments.filter((a) => getDeadlineStatus(a) === 'overdue').length;
  const urgentCount = sortedAssignments.filter((a) => getDeadlineStatus(a) === 'urgent').length;

  if (compact) {
    return (
      <Card className="border-amber-500/50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="font-medium">
                {assignments.length} chýbajúcich úloh
              </span>
              {overdueCount > 0 && (
                <Badge variant="destructive">{overdueCount} po termíne</Badge>
              )}
              {urgentCount > 0 && (
                <Badge className="bg-orange-500">{urgentCount} urgentných</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-5 w-5" />
          Chýbajúce úlohy ({assignments.length})
          {overdueCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {overdueCount} po termíne
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedAssignments.map((assignment) => {
            const status = getDeadlineStatus(assignment);
            return (
              <div
                key={assignment.id}
                className={`flex items-center justify-between p-3 rounded-lg ${getStatusStyles(status)}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {status === 'overdue' && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    {status === 'urgent' && (
                      <Clock className="h-4 w-4 text-orange-500" />
                    )}
                    <p className="font-medium">
                      Day {assignment.day}: {assignment.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">
                      {assignment.type === 'in_class' ? 'In-Class' : 'Homework'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {assignment.max_points} bodov
                    </span>
                    {assignment.description && (
                      <span className="text-sm text-muted-foreground hidden md:inline">
                        - {assignment.description}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {status === 'overdue' && (
                      <Badge variant="destructive">Po termíne</Badge>
                    )}
                    {status === 'urgent' && (
                      <Badge className="bg-orange-500">
                        <Clock className="mr-1 h-3 w-3" />
                        Menej ako 24h
                      </Badge>
                    )}
                    {status === 'soon' && (
                      <Badge className="bg-yellow-500 text-black">
                        Blíži sa deadline
                      </Badge>
                    )}
                    {assignment.due_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <CountdownTimer dueAt={assignment.due_at} />
                      </p>
                    )}
                  </div>
                  {repoUrl && (
                    <a
                      href={`${repoUrl}/tree/main/${assignment.folder_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Otvoriť
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50"></div>
            <span>Po termíne</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500/30 border border-orange-500/50"></div>
            <span>&lt; 24h</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500/50"></div>
            <span>&lt; 72h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
