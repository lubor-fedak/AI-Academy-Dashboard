'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import type {
  Participant,
  Assignment,
  LeaderboardView,
  Achievement,
  TeamProgress,
  SubmissionWithDetails,
  ParticipantAchievement,
} from '@/lib/types';
import { ACHIEVEMENT_ICONS } from '@/lib/types';

interface MyDashboardClientProps {
  participants: Participant[];
  assignments: Assignment[];
  leaderboard: LeaderboardView[];
  allAchievements: Achievement[];
  teamProgress: TeamProgress[];
}

export function MyDashboardClient({
  participants,
  assignments,
  leaderboard,
  allAchievements,
  teamProgress,
}: MyDashboardClientProps) {
  const [selectedUsername, setSelectedUsername] = useState<string>('');
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [earnedAchievements, setEarnedAchievements] = useState<
    (ParticipantAchievement & { achievements: Achievement })[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved username from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('my-dashboard-username');
    if (saved && participants.some((p) => p.github_username === saved)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedUsername(saved);
    }
  }, [participants]);

  // Fetch user-specific data when username changes
  useEffect(() => {
    if (!selectedUsername) return;

    localStorage.setItem('my-dashboard-username', selectedUsername);

    const fetchUserData = async () => {
      setIsLoading(true);
      const supabase = getSupabaseClient();

      const participant = participants.find(
        (p) => p.github_username === selectedUsername
      );
      if (!participant) return;

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

      setSubmissions(
        (submissionsResult.data as SubmissionWithDetails[]) ?? []
      );
      setEarnedAchievements(
        (achievementsResult.data as (ParticipantAchievement & {
          achievements: Achievement;
        })[]) ?? []
      );
      setIsLoading(false);
    };

    fetchUserData();
  }, [selectedUsername, participants]);

  const currentUser = participants.find(
    (p) => p.github_username === selectedUsername
  );
  const userLeaderboard = leaderboard.find(
    (l) => l.github_username === selectedUsername
  );
  const userTeamProgress = teamProgress.find(
    (t) => t.team === currentUser?.team
  );

  // Calculate missing assignments
  const submittedAssignmentIds = new Set(
    submissions.map((s) => s.assignment_id)
  );
  const missingAssignments = assignments.filter(
    (a) => !submittedAssignmentIds.has(a.id)
  );

  // Calculate team comparison
  const teamMembers = leaderboard.filter((l) => l.team === currentUser?.team);
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

  if (!selectedUsername) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#0062FF]" />
            Select Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            To view your personal dashboard, select your name from the list:
          </p>
          <Select value={selectedUsername} onValueChange={setSelectedUsername}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select your GitHub username" />
            </SelectTrigger>
            <SelectContent>
              {participants.map((p) => (
                <SelectItem key={p.github_username} value={p.github_username}>
                  {p.name} (@{p.github_username})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Your selection will be saved for next time.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser || !userLeaderboard) {
    return (
      <Card className="border-red-500/50 bg-red-500/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <span>User not found</span>
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSelectedUsername('');
              localStorage.removeItem('my-dashboard-username');
            }}
          >
            Select another user
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Selector */}
      <div className="flex items-center justify-between">
        <Select value={selectedUsername} onValueChange={setSelectedUsername}>
          <SelectTrigger className="w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {participants.map((p) => (
              <SelectItem key={p.github_username} value={p.github_username}>
                {p.name} (@{p.github_username})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Link href={`/participant/${selectedUsername}`}>
          <Button variant="outline" size="sm">
            Public Profile
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={currentUser.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                <Badge
                  className={`${
                    userLeaderboard.rank <= 3
                      ? 'bg-yellow-500 text-black'
                      : 'bg-[#0062FF]'
                  }`}
                >
                  #{userLeaderboard.rank}
                </Badge>
              </div>
              <p className="text-muted-foreground">@{currentUser.github_username}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{currentUser.role}</Badge>
                <Badge variant="secondary">Team {currentUser.team}</Badge>
                <Badge>{currentUser.stream}</Badge>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-accent/50 rounded-lg">
                <Trophy className="h-5 w-5 mx-auto mb-1 text-[#0062FF]" />
                <p className="text-xl font-bold">{userLeaderboard.total_points}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div className="text-center p-3 bg-accent/50 rounded-lg">
                <GitCommit className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="text-xl font-bold">
                  {userLeaderboard.total_submissions}
                </p>
                <p className="text-xs text-muted-foreground">Submissions</p>
              </div>
              <div className="text-center p-3 bg-accent/50 rounded-lg">
                <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                <p className="text-xl font-bold">
                  {userLeaderboard.avg_mentor_rating?.toFixed(1) ?? '-'}
                </p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
              <div className="text-center p-3 bg-accent/50 rounded-lg">
                <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                <p className="text-xl font-bold">{userLeaderboard.current_streak}</p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Submissions & Missing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Missing Assignments */}
          {missingAssignments.length > 0 && (
            <Card className="border-amber-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-5 w-5" />
                  Missing Assignments ({missingAssignments.length})
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
          )}

          {/* Completed check */}
          {missingAssignments.length === 0 && (
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
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading...
                </div>
              ) : submissions.length === 0 ? (
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
              {/* Team Comparison */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  vs. Team {currentUser.team}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Points</span>
                    <div className="flex items-center gap-2">
                      {getComparisonIcon(
                        userLeaderboard.total_points,
                        teamAvgPoints
                      )}
                      <span className="font-medium">
                        {userLeaderboard.total_points} / {teamAvgPoints} avg
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Submissions</span>
                    <div className="flex items-center gap-2">
                      {getComparisonIcon(
                        userLeaderboard.total_submissions,
                        teamAvgSubmissions
                      )}
                      <span className="font-medium">
                        {userLeaderboard.total_submissions} / {teamAvgSubmissions}{' '}
                        avg
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

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
                        userLeaderboard.total_points,
                        overallAvgPoints
                      )}
                      <span className="font-medium">
                        {userLeaderboard.total_points} / {overallAvgPoints} avg
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Submissions</span>
                    <div className="flex items-center gap-2">
                      {getComparisonIcon(
                        userLeaderboard.total_submissions,
                        overallAvgSubmissions
                      )}
                      <span className="font-medium">
                        {userLeaderboard.total_submissions} /{' '}
                        {overallAvgSubmissions} avg
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rank</span>
                    <span className="font-medium">
                      #{userLeaderboard.rank} of {leaderboard.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Team Rank */}
              {userTeamProgress && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Team {currentUser.team} rank</span>
                    <Badge>
                      #{teamProgress.findIndex((t) => t.team === currentUser.team) + 1}
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
