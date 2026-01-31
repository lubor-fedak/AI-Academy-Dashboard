'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Assignment } from '@/lib/types';

interface UpcomingDeadlinesProps {
  assignments: Assignment[];
}

function LiveCountdown({ dueAt }: { dueAt: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const due = new Date(dueAt);
      const totalSeconds = differenceInSeconds(due, now);

      if (totalSeconds < 0) {
        return { hours: 0, minutes: 0, seconds: 0, isOverdue: true };
      }

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return { hours, minutes, seconds, isOverdue: false };
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [dueAt]);

  if (!timeLeft) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  if (timeLeft.isOverdue) {
    return (
      <span className="text-red-500 font-mono font-bold">
        EXPIRED
      </span>
    );
  }

  const isUrgent = timeLeft.hours < 24;
  const isCritical = timeLeft.hours < 6;

  return (
    <span
      className={`font-mono font-bold ${
        isCritical
          ? 'text-red-500'
          : isUrgent
          ? 'text-orange-500'
          : 'text-muted-foreground'
      }`}
    >
      {String(timeLeft.hours).padStart(2, '0')}:
      {String(timeLeft.minutes).padStart(2, '0')}:
      {String(timeLeft.seconds).padStart(2, '0')}
    </span>
  );
}

export function UpcomingDeadlines({ assignments }: UpcomingDeadlinesProps) {
  // Filter assignments with deadlines and sort by due date
  const upcomingAssignments = assignments
    .filter((a) => a.due_at)
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())
    .slice(0, 3); // Show only next 3

  if (upcomingAssignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#0062FF]" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-muted-foreground">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>No upcoming deadlines</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#0062FF]" />
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingAssignments.map((assignment) => {
            const hoursLeft = differenceInHours(
              new Date(assignment.due_at!),
              new Date()
            );
            const isOverdue = hoursLeft < 0;
            const isUrgent = hoursLeft >= 0 && hoursLeft < 24;

            return (
              <div
                key={assignment.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isOverdue
                    ? 'bg-red-500/10 border border-red-500/30'
                    : isUrgent
                    ? 'bg-orange-500/10 border border-orange-500/30'
                    : 'bg-accent/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isOverdue && (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  {isUrgent && !isOverdue && (
                    <Clock className="h-5 w-5 text-orange-500 animate-pulse" />
                  )}
                  <div>
                    <p className="font-medium">
                      Day {assignment.day}: {assignment.title}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {assignment.type === 'in_class' ? 'In-Class' : 'Homework'}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <LiveCountdown dueAt={assignment.due_at!} />
                  {isUrgent && !isOverdue && (
                    <p className="text-xs text-orange-500 mt-1">Urgent!</p>
                  )}
                  {isOverdue && (
                    <p className="text-xs text-red-500 mt-1">Overdue</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
