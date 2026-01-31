'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, parseISO, differenceInDays, getHours } from 'date-fns';
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertTriangle,
  Download,
  Clock,
  Target,
  Award,
} from 'lucide-react';
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

interface AnalyticsDashboardProps {
  participants: Participant[];
  assignments: Assignment[];
  submissions: SubmissionWithTimestamp[];
  leaderboard: LeaderboardView[];
  teamProgress: TeamProgress[];
  activityLog: ActivityLogEntry[];
}

const TEAM_COLORS: Record<string, string> = {
  Alpha: '#ef4444',
  Beta: '#3b82f6',
  Gamma: '#22c55e',
  Delta: '#eab308',
  Epsilon: '#a855f7',
  Zeta: '#ec4899',
  Eta: '#f97316',
  Theta: '#06b6d4',
};

const PIE_COLORS = ['#0062FF', '#22c55e', '#f97316', '#ef4444', '#a855f7'];

const WEEKS = [
  { week: 0, label: 'All Weeks', days: Array.from({ length: 25 }, (_, i) => i + 1) },
  { week: 1, label: 'Week 1', sublabel: 'Foundations', days: [1, 2, 3, 4, 5] },
  { week: 2, label: 'Week 2', sublabel: 'Deep Dive', days: [6, 7, 8, 9, 10] },
  { week: 4, label: 'Week 4', sublabel: 'Team Build', days: [11, 12, 13, 14, 15] },
  { week: 5, label: 'Week 5', sublabel: 'Polish', days: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25] },
];

export function AnalyticsDashboard({
  participants,
  assignments,
  submissions,
  leaderboard,
  teamProgress,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  activityLog,
}: AnalyticsDashboardProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<string>('0');

  // Calculate key metrics
  const totalParticipants = participants.length;
  const totalSubmissions = submissions.length;
  const totalPossibleSubmissions = totalParticipants * assignments.length;
  const overallCompletionRate = totalPossibleSubmissions > 0
    ? Math.round((totalSubmissions / totalPossibleSubmissions) * 100)
    : 0;

  // Submissions over time
  const submissionsOverTime = useMemo(() => {
    const byDate = new Map<string, number>();
    submissions.forEach((s) => {
      const date = format(parseISO(s.submitted_at), 'yyyy-MM-dd');
      byDate.set(date, (byDate.get(date) || 0) + 1);
    });

    return Array.from(byDate.entries())
      .map(([date, count]) => ({
        date,
        displayDate: format(parseISO(date), 'MMM d'),
        submissions: count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [submissions]);

  // Activity heatmap (by hour)
  const activityByHour = useMemo(() => {
    const byHour = Array(24).fill(0);
    submissions.forEach((s) => {
      const hour = getHours(parseISO(s.submitted_at));
      byHour[hour]++;
    });

    return byHour.map((count, hour) => ({
      hour: `${hour}:00`,
      submissions: count,
    }));
  }, [submissions]);

  // Team comparison
  const teamComparison = useMemo(() => {
    return teamProgress.map((tp) => ({
      team: tp.team,
      points: tp.team_points,
      avgSubmissions: Math.round(tp.avg_submissions * 10) / 10,
      avgRating: tp.avg_rating ? Math.round(tp.avg_rating * 10) / 10 : 0,
    }));
  }, [teamProgress]);

  // Get current week config
  const currentWeek = WEEKS.find(w => w.week.toString() === selectedWeek) || WEEKS[0];

  // Assignment completion rates - filtered by week
  const assignmentStats = useMemo(() => {
    return assignments
      .filter(a => currentWeek.days.includes(a.day))
      .map((a) => {
        const subs = submissions.filter((s) => s.assignment_id === a.id);
        const avgRating = subs.filter((s) => s.mentor_rating).reduce((sum, s) => sum + (s.mentor_rating || 0), 0) / (subs.filter((s) => s.mentor_rating).length || 1);
        const completionRate = Math.round((subs.length / totalParticipants) * 100);

        return {
          id: a.id,
          day: a.day,
          name: `Day ${a.day}: ${a.title}`,
          type: a.type,
          submissions: subs.length,
          completionRate,
          avgRating: Math.round(avgRating * 10) / 10 || null,
          maxPoints: a.max_points,
          week: a.day <= 5 ? 1 : a.day <= 10 ? 2 : a.day <= 15 ? 4 : 5,
        };
      });
  }, [assignments, submissions, totalParticipants, currentWeek]);

  // Problem assignments (low completion or rating)
  const problemAssignments = assignmentStats
    .filter((a) => a.completionRate < 50 || (a.avgRating !== null && a.avgRating < 3))
    .sort((a, b) => a.completionRate - b.completionRate);

  // Risk students (no submissions in X days or low activity)
  const riskStudents = useMemo(() => {
    const now = new Date();
    return participants
      .map((p) => {
        const participantSubs = submissions.filter((s) => s.participant_id === p.id);
        const lastSubmission = participantSubs.length > 0
          ? participantSubs[participantSubs.length - 1]
          : null;
        const daysSinceLastSubmission = lastSubmission
          ? differenceInDays(now, parseISO(lastSubmission.submitted_at))
          : 999;
        const leaderboardEntry = leaderboard.find((l) => l.github_username === p.github_username);

        return {
          ...p,
          submissionCount: participantSubs.length,
          lastSubmission: lastSubmission?.submitted_at || null,
          daysSinceLastSubmission,
          totalPoints: leaderboardEntry?.total_points || 0,
          rank: leaderboardEntry?.rank || 999,
        };
      })
      .filter((p) => p.daysSinceLastSubmission >= 2 || p.submissionCount === 0)
      .sort((a, b) => b.daysSinceLastSubmission - a.daysSinceLastSubmission);
  }, [participants, submissions, leaderboard]);

  // Submission status distribution
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      submitted: 0,
      reviewed: 0,
      approved: 0,
      needs_revision: 0,
    };
    submissions.forEach((s) => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });

    return Object.entries(counts).map(([status, count]) => ({
      name: status === 'needs_revision' ? 'Needs Revision' : status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  }, [submissions]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'GitHub', 'Team', 'Role', 'Points', 'Submissions', 'Rank', 'Last Submission'];
    const rows = participants.map((p) => {
      const lb = leaderboard.find((l) => l.github_username === p.github_username);
      const lastSub = submissions
        .filter((s) => s.participant_id === p.id)
        .pop();
      return [
        p.name,
        p.github_username,
        p.team,
        p.role,
        lb?.total_points || 0,
        lb?.total_submissions || 0,
        lb?.rank || '-',
        lastSub ? format(parseISO(lastSub.submitted_at), 'yyyy-MM-dd HH:mm') : '-',
      ];
    });

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ai-academy-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-muted-foreground">
              {teamProgress.length} teams
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              of {totalPossibleSubmissions} possible
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#0062FF]">{overallCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">
              overall completion
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              At-Risk Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{riskStudents.length}</div>
            <p className="text-xs text-muted-foreground">
              inactive 2+ days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="risk">At-Risk Students</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Submissions Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#0062FF]" />
                  Submissions Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={submissionsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="displayDate" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="submissions"
                      stroke="#0062FF"
                      strokeWidth={2}
                      dot={{ fill: '#0062FF' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activity by Hour */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#0062FF]" />
                  Activity by Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="hour" stroke="#888" fontSize={10} interval={2} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    />
                    <Bar dataKey="submissions" fill="#0062FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#0062FF]" />
                  Submission Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {statusDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Problem Assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Problem Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {problemAssignments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No problem assignments
                  </p>
                ) : (
                  <div className="space-y-3">
                    {problemAssignments.slice(0, 5).map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/30"
                      >
                        <div>
                          <p className="font-medium">{a.name}</p>
                          <Badge variant="outline">
                            {a.type === 'in_class' ? 'In-Class' : 'Homework'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            <span className="text-orange-500 font-bold">{a.completionRate}%</span> completion
                          </p>
                          {a.avgRating && (
                            <p className="text-xs text-muted-foreground">
                              Avg rating: {a.avgRating}/5
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#0062FF]" />
                Team Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={teamComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" stroke="#888" fontSize={12} />
                  <YAxis dataKey="team" type="category" stroke="#888" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  />
                  <Legend />
                  <Bar dataKey="points" name="Body" fill="#0062FF" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {teamComparison.map((team, index) => (
              <Card key={team.team} className={index < 3 ? 'border-yellow-500/30' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>Team {team.team}</span>
                    {index === 0 && <span>🥇</span>}
                    {index === 1 && <span>🥈</span>}
                    {index === 2 && <span>🥉</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Points:</span>
                      <span className="font-bold" style={{ color: TEAM_COLORS[team.team] }}>
                        {team.points}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg submissions:</span>
                      <span>{team.avgSubmissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg rating:</span>
                      <span>{team.avgRating || '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assignment Statistics</CardTitle>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  {WEEKS.map((week) => (
                    <SelectItem key={week.week} value={week.week.toString()}>
                      {week.label}{week.sublabel ? `: ${week.sublabel}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Submissions</TableHead>
                    <TableHead className="text-right">Completion</TableHead>
                    <TableHead className="text-right">Avg Rating</TableHead>
                    <TableHead className="text-right">Max Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignmentStats.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Week {a.week}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {a.type === 'in_class' ? 'In-Class' : 'Homework'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{a.submissions}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            a.completionRate < 50
                              ? 'text-red-500'
                              : a.completionRate < 80
                              ? 'text-yellow-500'
                              : 'text-green-500'
                          }
                        >
                          {a.completionRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {a.avgRating ? `${a.avgRating}/5` : '-'}
                      </TableCell>
                      <TableCell className="text-right">{a.maxPoints}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Students Tab */}
        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                At-Risk Students ({riskStudents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {riskStudents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No at-risk students - everyone is active!
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Submissions</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right">Days Inactive</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riskStudents.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{p.team}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.role}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{p.submissionCount}</TableCell>
                        <TableCell className="text-right">{p.totalPoints}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              p.daysSinceLastSubmission >= 5
                                ? 'text-red-500 font-bold'
                                : p.daysSinceLastSubmission >= 3
                                ? 'text-orange-500 font-bold'
                                : 'text-yellow-500'
                            }
                          >
                            {p.daysSinceLastSubmission === 999 ? 'Never' : `${p.daysSinceLastSubmission} days`}
                          </span>
                        </TableCell>
                        <TableCell>
                          {p.submissionCount === 0 ? (
                            <Badge variant="destructive">No submission</Badge>
                          ) : p.daysSinceLastSubmission >= 5 ? (
                            <Badge variant="destructive">Critical</Badge>
                          ) : (
                            <Badge className="bg-orange-500">Warning</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
