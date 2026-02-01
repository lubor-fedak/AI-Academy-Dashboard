'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { AchievementBadge } from '@/components/AchievementBadge';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import Link from 'next/link';
import {
  Trophy,
  GitCommit,
  Star,
  Flame,
  Target,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  ArrowUp,
  ArrowDown,
  Minus,
  UserCog,
  Info,
  Loader2,
} from 'lucide-react';
import type {
  Assignment,
  LeaderboardView,
  Achievement,
  TeamProgress,
  SubmissionWithDetails,
  ParticipantAchievement,
} from '@/lib/types';
import { ACHIEVEMENT_ICONS } from '@/lib/types';

interface MyDashboardClientProps {
  assignments: Assignment[];
  leaderboard: LeaderboardView[];
  allAchievements: Achievement[];
  teamProgress: TeamProgress[];
}

export function MyDashboardClient({
  assignments,
  leaderboard,
  allAchievements,
  teamProgress,
}: MyDashboardClientProps) {
  const { participant, isLoading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [earnedAchievements, setEarnedAchievements] = useState<
    (ParticipantAchievement & { achievements: Achievement })[]
  >([]);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // Fetch user-specific data when participant is available
  useEffect(() => {
    if (!participant) {
      return;
    }

    let isCancelled = false;

    const fetchUserData = async () => {
      setIsFetchingData(true);
      const supabase = getSupabaseClient();

      const [submissionsResult, achievementsResult] = await Promise.all([
        supabase
          .from('submissions')
          .select('*, assignments(title, day, type)')
          .eq('participant_id', participant.id)
          .order('submitted_at', { ascending: false }),
        supabase
          .from('participant_achievements')
          .select('*, achievements(*)')
          .eq('participant_id', participant.id),
      ]);

      if (!isCancelled) {
        setSubmissions(
          (submissionsResult.data as SubmissionWithDetails[]) ?? []
        );
        setEarnedAchievements(
          (achievementsResult.data as (ParticipantAchievement & {
            achievements: Achievement;
          })[]) ?? []
        );
        setIsFetchingData(false);
      }
    };

    fetchUserData();

    return () => {
      isCancelled = true;
    };
  }, [participant]);

  // Find user in leaderboard - match by nickname or name since github_username might be null
  const userLeaderboard = participant
    ? leaderboard.find((l) =>
        l.github_username === participant.github_username ||
        l.name === participant.name
      )
    : undefined;

  const userTeamProgress = participant?.team
    ? teamProgress.find((t) => t.team === participant.team)
    : undefined;

  // Calculate missing assignments
  const submittedAssignmentIds = new Set(
    submissions.map((s) => s.assignment_id)
  );
  const missingAssignments = assignments.filter(
    (a) => !submittedAssignmentIds.has(a.id)
  );

  // Calculate team comparison
  const teamMembers = participant?.team
    ? leaderboard.filter((l) => l.team === participant.team)
    : [];
  const teamAvgPoints =
    teamMembers.length > 0
      ? Math.round(
          teamMembers.reduce((sum, m) => sum + m.total_points, 0) /
            teamMembers.length
        )
      : 0;
  const teamAvgSubmissions =
    teamMembers.length > 0
      ? Math.round(
          teamMembers.reduce((sum, m) => sum + m.total_submissions, 0) /
            teamMembers.length
        )
      : 0;

  // Calculate overall comparison
  const overallAvgPoints =
    leaderboard.length > 0
      ? Math.round(
          leaderboard.reduce((sum, l) => sum + l.total_points, 0) /
            leaderboard.length
        )
      : 0;
  const overallAvgSubmissions =
    leaderboard.length > 0
      ? Math.round(
          leaderboard.reduce((sum, l) => sum + l.total_submissions, 0) /
            leaderboard.length
        )
      : 0;

  // Earned achievement codes
  const earnedCodes = new Set(earnedAchievements.map((a) => a.achievements.code));
  const availableAchievements = allAchievements.filter(
    (a) => !earnedCodes.has(a.code)
  );

  // Helper for deadline status
  const getDeadlineStatus = (assignment: Assignment) => {
    if (!assignment.due_at) return 'none';
    const hoursLeft = differenceInHours(
      new Date(assignment.due_at),
      new Date()
    );
    if (hoursLeft < 0) return 'overdue';
    if (hoursLeft < 24) return 'urgent';
    if (hoursLeft < 72) return 'soon';
    return 'ok';
  };

  const getComparisonIcon = (userValue: number, avgValue: number) => {
    if (userValue > avgValue)
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (userValue < avgValue)
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  // Loading state - show spinner while auth is loading or data is being fetched
  if (authLoading || (participant && isFetchingData)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
      </div>
    );
  }

  // No participant found
  if (!participant) {
    return (
      <Card className="border-[#0062FF]/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Info className="h-8 w-8 text-[#0062FF]" />
            <div>
              <p className="font-bold">Complete Your Registration</p>
              <p className="text-sm text-muted-foreground">
                Please complete the onboarding process to access your dashboard.
              </p>
              <Link href="/onboarding">
                <Button size="sm" className="mt-3 bg-[#0062FF] hover:bg-[#0052D9]">
                  Go to Onboarding
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create a default leaderboard entry if user is not in leaderboard yet
  const displayLeaderboard = userLeaderboard || {
    rank: leaderboard.length + 1,
    total_points: 0,
    total_submissions: 0,
    avg_mentor_rating: null,
    current_streak: 0,
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={participant.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl">
                {participant.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{participant.name}</h2>
                {userLeaderboard && (
                  <Badge
                    className={`${
                      userLeaderboard.rank <= 3
                        ? 'bg-yellow-500 text-black'
                        : 'bg-[#0062FF]'
                    }`}
                  >
                    #{userLeaderboard.rank}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">@{participant.nickname || 'no-nickname'}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {participant.role ? (
                  <Badge variant="outline">{participant.role}</Badge>
                ) : (
                  <Badge variant="outline" className="border-dashed text-muted-foreground">No Role</Badge>
                )}
                {participant.team ? (
                  <Badge variant="secondary">Team {participant.team}</Badge>
                ) : (
                  <Badge variant="secondary" className="border-dashed text-muted-foreground">No Team</Badge>
                )}
                {participant.stream ? (
                  <Badge>{participant.stream}</Badge>
                ) : (
                  <Badge className="border-dashed text-muted-foreground bg-muted">No Stream</Badge>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-accent/50 rounded-lg">
                <Trophy className="h-5 w-5 mx-auto mb-1 text-[#0062FF]" />
                <p className="text-xl font-bold">{displayLeaderboard.total_points}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div className="text-center p-3 bg-accent/50 rounded-lg">
                <GitCommit className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="text-xl font-bold">
                  {displayLeaderboard.total_submissions}
                </p>
                <p className="text-xs text-muted-foreground">Submissions</p>
              </div>
              <div className="text-center p-3 bg-accent/50 rounded-lg">
                <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                <p className="text-xl font-bold">
                  {displayLeaderboard.avg_mentor_rating?.toFixed(1) ?? '-'}
                </p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
              <div className="text-center p-3 bg-accent/50 rounded-lg">
                <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                <p className="text-xl font-bold">{displayLeaderboard.current_streak}</p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Prompt - Show when role/team/stream not set */}
      {(!participant.role || !participant.team || !participant.stream) && (
        <Card className="border-[#0062FF]/50 bg-[#0062FF]/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0062FF]/10">
                <UserCog className="h-5 w-5 text-[#0062FF]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Complete Your Profile Setup</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Set your role, team, and learning stream to get personalized content and join team activities.
                </p>
                <Link href="/profile">
                  <Button size="sm" className="mt-3 bg-[#0062FF] hover:bg-[#0052D9]">
                    <UserCog className="mr-2 h-4 w-4" />
                    Setup Now
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Submissions & Assignments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignments to Complete */}
          {assignments.length === 0 ? (
            <Card className="border-[#0062FF]/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Info className="h-8 w-8 text-[#0062FF]" />
                  <div>
                    <p className="font-bold">Welcome to AI Academy!</p>
                    <p className="text-sm text-muted-foreground">
                      Assignments will appear here as they become available. Check back on the program start date.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : missingAssignments.length > 0 ? (
            <Card className="border-amber-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Target className="h-5 w-5" />
                  Assignments to Complete ({missingAssignments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {missingAssignments.map((assignment) => {
                    const status = getDeadlineStatus(assignment);
                    return (
                      <div
                        key={assignment.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          status === 'overdue'
                            ? 'bg-red-500/10 border border-red-500/30'
                            : status === 'urgent'
                            ? 'bg-orange-500/10 border border-orange-500/30'
                            : status === 'soon'
                            ? 'bg-yellow-500/10 border border-yellow-500/30'
                            : 'bg-accent/50'
                        }`}
                      >
                        <div>
                          <p className="font-medium">
                            Day {assignment.day}: {assignment.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">
                              {assignment.type === 'in_class'
                                ? 'In-Class'
                                : 'Homework'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {assignment.max_points} points
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {status === 'overdue' && (
                            <Badge variant="destructive">Overdue</Badge>
                          )}
                          {status === 'urgent' && (
                            <Badge className="bg-orange-500">
                              <Clock className="mr-1 h-3 w-3" />
                              Less than 24h
                            </Badge>
                          )}
                          {status === 'soon' && (
                            <Badge className="bg-yellow-500 text-black">
                              Deadline approaching
                            </Badge>
                          )}
                          {assignment.due_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(assignment.due_at), {
                                addSuffix: true,
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Completed check - only show if there are assignments available */}
          {assignments.length > 0 && missingAssignments.length === 0 && (
            <Card className="border-green-500/50 bg-green-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-bold text-green-600 dark:text-green-400">
                      All assignments submitted!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Congratulations, you have a 100% completion rate.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCommit className="h-5 w-5 text-[#0062FF]" />
                My Submissions ({submissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No submissions yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">
                          Day {sub.assignments?.day}: {sub.assignments?.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {sub.assignments?.type === 'in_class'
                              ? 'In-Class'
                              : 'Homework'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-[#0062FF]">
                          {sub.points_earned}
                        </TableCell>
                        <TableCell className="text-right">
                          {sub.mentor_rating ? (
                            <span className="flex items-center justify-end gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {sub.mentor_rating}/5
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              sub.status === 'approved'
                                ? 'default'
                                : sub.status === 'submitted'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(sub.submitted_at), {
                            addSuffix: true,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Achievements & Comparison */}
        <div className="space-y-6">
          {/* Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#0062FF]" />
                Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Comparison - only show if user has a team */}
              {participant.team ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      vs. Team {participant.team}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Points</span>
                        <div className="flex items-center gap-2">
                          {getComparisonIcon(
                            displayLeaderboard.total_points,
                            teamAvgPoints
                          )}
                          <span className="font-medium">
                            {displayLeaderboard.total_points} / {teamAvgPoints} avg
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Submissions</span>
                        <div className="flex items-center gap-2">
                          {getComparisonIcon(
                            displayLeaderboard.total_submissions,
                            teamAvgSubmissions
                          )}
                          <span className="font-medium">
                            {displayLeaderboard.total_submissions} / {teamAvgSubmissions}{' '}
                            avg
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Separator />
                </>
              ) : (
                <>
                  <div className="text-center py-2">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Join a team to see team comparisons
                    </p>
                    <Link href="/profile">
                      <Button variant="outline" size="sm" className="mt-2">
                        Select Team
                      </Button>
                    </Link>
                  </div>
                  <Separator />
                </>
              )}

              {/* Overall Comparison */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  vs. Entire Academy
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Points</span>
                    <div className="flex items-center gap-2">
                      {getComparisonIcon(
                        displayLeaderboard.total_points,
                        overallAvgPoints
                      )}
                      <span className="font-medium">
                        {displayLeaderboard.total_points} / {overallAvgPoints} avg
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Submissions</span>
                    <div className="flex items-center gap-2">
                      {getComparisonIcon(
                        displayLeaderboard.total_submissions,
                        overallAvgSubmissions
                      )}
                      <span className="font-medium">
                        {displayLeaderboard.total_submissions} /{' '}
                        {overallAvgSubmissions} avg
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rank</span>
                    <span className="font-medium">
                      #{displayLeaderboard.rank} of {leaderboard.length || 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* Team Rank - only show if user has a team */}
              {participant.team && userTeamProgress && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Team {participant.team} rank</span>
                    <Badge>
                      #{teamProgress.findIndex((t) => t.team === participant.team) + 1}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Earned Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                My Achievements ({earnedAchievements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {earnedAchievements.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No achievements yet
                </p>
              ) : (
                <div className="space-y-2">
                  {earnedAchievements.map((a) => (
                    <AchievementBadge
                      key={a.achievement_id}
                      achievement={a.achievements}
                      earnedAt={a.earned_at}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                Available Achievements ({availableAchievements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableAchievements.length === 0 ? (
                <div className="text-center py-4">
                  <Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                  <p className="font-medium text-green-500">
                    You have all achievements!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableAchievements.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 opacity-60"
                    >
                      <span className="text-2xl">
                        {ACHIEVEMENT_ICONS[a.code] || '🏆'}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{a.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.description}
                        </p>
                      </div>
                      <Badge variant="outline">+{a.points_bonus}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
