import { createServerSupabaseClient } from '@/lib/supabase-server';
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
import { AchievementBadge } from '@/components/AchievementBadge';
import { MissingAssignments } from '@/components/MissingAssignments';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Github,
  Trophy,
  GitCommit,
  Star,
  Flame,
  ExternalLink,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import type {
  Participant,
  SubmissionWithDetails,
  Achievement,
  ParticipantAchievement,
  LeaderboardEntry,
  Assignment,
} from '@/lib/types';

export const revalidate = 0;

interface ParticipantPageProps {
  params: Promise<{ username: string }>;
}

export default async function ParticipantPage({ params }: ParticipantPageProps) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch participant
  const { data: participant, error } = await supabase
    .from('participants')
    .select('*')
    .eq('github_username', username)
    .single();

  if (error || !participant) {
    notFound();
  }

  // Fetch all data in parallel
  const [submissionsResult, achievementsResult, leaderboardResult, assignmentsResult] = await Promise.all([
    supabase
      .from('submissions')
      .select('*, assignments(title, day, type)')
      .eq('participant_id', participant.id)
      .order('submitted_at', { ascending: false }),
    supabase
      .from('participant_achievements')
      .select('*, achievements(*)')
      .eq('participant_id', participant.id),
    supabase
      .from('leaderboard')
      .select('*')
      .eq('participant_id', participant.id)
      .single(),
    supabase
      .from('assignments')
      .select('*')
      .order('day')
      .order('type'),
  ]);

  const p = participant as Participant;
  const subs = (submissionsResult.data ?? []) as SubmissionWithDetails[];
  const achievementData = (achievementsResult.data ?? []) as (ParticipantAchievement & { achievements: Achievement })[];
  const stats = leaderboardResult.data as LeaderboardEntry | null;
  const allAssignments = (assignmentsResult.data ?? []) as Assignment[];

  // Calculate missing assignments
  const submittedAssignmentIds = new Set(subs.map((s) => s.assignment_id));
  const missingAssignments = allAssignments.filter((a) => !submittedAssignmentIds.has(a.id));

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/leaderboard">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leaderboard
        </Button>
      </Link>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={p.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl">
                {p.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold">{p.name}</h1>
                {stats?.rank && stats.rank <= 3 && (
                  <Badge className="bg-yellow-500 text-black">
                    {stats.rank === 1 && '🥇'}
                    {stats.rank === 2 && '🥈'}
                    {stats.rank === 3 && '🥉'}
                    #{stats.rank}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Github className="h-4 w-4" />@{p.github_username}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline">{p.role}</Badge>
                <Badge variant="secondary">Team {p.team}</Badge>
                <Badge>{p.stream}</Badge>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <Trophy className="h-5 w-5 mx-auto mb-1 text-[#0062FF]" />
                <p className="text-2xl font-bold">{stats?.total_points ?? 0}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <GitCommit className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="text-2xl font-bold">{stats?.total_submissions ?? 0}</p>
                <p className="text-xs text-muted-foreground">Submissions</p>
              </div>
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                <p className="text-2xl font-bold">
                  {stats?.avg_mentor_rating?.toFixed(1) ?? '-'}
                </p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                <p className="text-2xl font-bold">{stats?.current_streak ?? 0}</p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missing Assignments Alert */}
      {missingAssignments.length > 0 ? (
        <MissingAssignments
          assignments={missingAssignments}
          repoUrl={p.repo_url}
        />
      ) : (
        <Card className="border-green-500/50 bg-green-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-bold text-green-600 dark:text-green-400">
                  Všetky úlohy odovzdané!
                </p>
                <p className="text-sm text-muted-foreground">
                  {subs.length} z {allAssignments.length} úloh dokončených
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Submissions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCommit className="h-5 w-5 text-[#0062FF]" />
              Submissions ({subs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No submissions yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subs.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        Day {sub.assignments?.day}: {sub.assignments?.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {sub.assignments?.type === 'in_class' ? 'In-Class' : 'Homework'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-[#0062FF]">
                        {sub.points_earned}
                      </TableCell>
                      <TableCell>
                        {sub.mentor_rating ? (
                          <span className="flex items-center gap-1">
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
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        {sub.commit_url && (
                          <a
                            href={sub.commit_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Achievements ({achievementData.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {achievementData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No achievements yet
              </p>
            ) : (
              <div className="space-y-3">
                {achievementData.map((a) => (
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
      </div>
    </div>
  );
}
