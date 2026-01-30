'use client';

import { useAuth } from '@/components/AuthProvider';
import { LandingPage } from '@/components/LandingPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityFeed } from '@/components/ActivityFeed';
import { UpcomingDeadlines } from '@/components/UpcomingDeadlines';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trophy, Users, GitCommit, Target, ArrowRight, TrendingUp, User, Loader2 } from 'lucide-react';
import type { ActivityLogWithParticipant, Assignment } from '@/lib/types';

interface HomePageProps {
  participantCount: number;
  submissionCount: number;
  activities: ActivityLogWithParticipant[];
  assignments: Assignment[];
  completionRate: number;
}

export function HomePage({
  participantCount,
  submissionCount,
  activities,
  assignments,
  completionRate,
}: HomePageProps) {
  const { user, isLoading, isAdmin, userStatus } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
      </div>
    );
  }

  // Not logged in - show landing page
  if (!user) {
    return <LandingPage />;
  }

  // Logged in but not approved - AuthGuard will redirect
  if (!isAdmin && userStatus !== 'approved') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
      </div>
    );
  }

  // Logged in and approved - show dashboard
  const stats = [
    {
      title: 'Participants',
      value: participantCount,
      icon: Users,
      description: '8 teams, 8 roles',
    },
    {
      title: 'Submissions',
      value: submissionCount,
      icon: GitCommit,
      description: 'Total assignments submitted',
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      icon: Target,
      description: 'Overall progress',
    },
    {
      title: 'Assignments',
      value: assignments.length,
      icon: TrendingUp,
      description: '5 days, in-class + homework',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Academy Dashboard</h1>
          <p className="text-muted-foreground">
            Track progress, submissions, and achievements
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/leaderboard">
            <Button className="bg-[#0062FF] hover:bg-[#0052D9]">
              <Trophy className="mr-2 h-4 w-4" />
              View Leaderboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upcoming Deadlines */}
      <UpcomingDeadlines assignments={assignments} />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Feed */}
        <ActivityFeed initialData={activities} />

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href="/my-dashboard"
              className="flex items-center justify-between p-4 rounded-lg bg-[#0062FF]/10 hover:bg-[#0062FF]/20 transition-colors border border-[#0062FF]/30"
            >
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-[#0062FF]" />
                <div>
                  <p className="font-medium">Môj Dashboard</p>
                  <p className="text-sm text-muted-foreground">Sleduj svoj pokrok a chýbajúce úlohy</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/leaderboard"
              className="flex items-center justify-between p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-[#0062FF]" />
                <div>
                  <p className="font-medium">Leaderboard</p>
                  <p className="text-sm text-muted-foreground">View rankings and points</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/progress"
              className="flex items-center justify-between p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Progress Matrix</p>
                  <p className="text-sm text-muted-foreground">Completion by role and day</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/teams"
              className="flex items-center justify-between p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">Teams</p>
                  <p className="text-sm text-muted-foreground">Team standings and members</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/peer-reviews"
              className="flex items-center justify-between p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <GitCommit className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Peer Reviews</p>
                  <p className="text-sm text-muted-foreground">Ohodnoť práce kolegov</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
