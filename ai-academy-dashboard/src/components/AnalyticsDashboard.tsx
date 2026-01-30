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
import { format, parseISO, differenceInDays, startOfDay, getHours } from 'date-fns';
import { sk } from 'date-fns/locale';
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

export function AnalyticsDashboard({
  participants,
  assignments,
  submissions,
  leaderboard,
  teamProgress,
  activityLog,
}: AnalyticsDashboardProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

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
        displayDate: format(parseISO(date), 'd. MMM', { locale: sk }),
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

  // Assignment completion rates
  const assignmentStats = useMemo(() => {
    return assignments.map((a) => {
      const subs = submissions.filter((s) => s.assignment_id === a.id);
      const avgRating = subs.filter((s) => s.mentor_rating).reduce((sum, s) => sum + (s.mentor_rating || 0), 0) / (subs.filter((s) => s.mentor_rating).length || 1);
      const completionRate = Math.round((subs.length / totalParticipants) * 100);

      return {
        id: a.id,
        name: `Day ${a.day}: ${a.title}`,
        type: a.type,
        submissions: subs.length,
        completionRate,
        avgRating: Math.round(avgRating * 10) / 10 || null,
        maxPoints: a.max_points,
      };
    });
  }, [assignments, submissions, totalParticipants]);

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
    const headers = ['Meno', 'GitHub', 'Tím', 'Rola', 'Body', 'Submisie', 'Rank', 'Posledná submisia'];
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
              Účastníci
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-muted-foreground">
              {teamProgress.length} tímov
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Submisie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              z {totalPossibleSubmissions} možných
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
              celková dokončenosť
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Rizikoví študenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{riskStudents.length}</div>
            <p className="text-xs text-muted-foreground">
              neaktívni 2+ dní
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
          <TabsTrigger value="overview">Prehľad</TabsTrigger>
          <TabsTrigger value="teams">Tímy</TabsTrigger>
          <TabsTrigger value="assignments">Úlohy</TabsTrigger>
          <TabsTrigger value="risk">Rizikoví študenti</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Submissions Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#0062FF]" />
                  Submisie v čase
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
                  Aktivita podľa hodiny
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
                  Stav submisií
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
                  Problémové úlohy
                </CardTitle>
              </CardHeader>
              <CardContent>
                {problemAssignments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Žiadne problémové úlohy
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
                            <span className="text-orange-500 font-bold">{a.completionRate}%</span> dokončenosť
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
                Porovnanie tímov
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
                      <span className="text-muted-foreground">Body:</span>
                      <span className="font-bold" style={{ color: TEAM_COLORS[team.team] }}>
                        {team.points}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg submisie:</span>
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
            <CardHeader>
              <CardTitle>Štatistiky úloh</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Úloha</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead className="text-right">Submisie</TableHead>
                    <TableHead className="text-right">Dokončenosť</TableHead>
                    <TableHead className="text-right">Avg Rating</TableHead>
                    <TableHead className="text-right">Max Body</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignmentStats.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
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
                Rizikoví študenti ({riskStudents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {riskStudents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Žiadni rizikoví študenti - všetci sú aktívni!
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meno</TableHead>
                      <TableHead>Tím</TableHead>
                      <TableHead>Rola</TableHead>
                      <TableHead className="text-right">Submisie</TableHead>
                      <TableHead className="text-right">Body</TableHead>
                      <TableHead className="text-right">Dni neaktívny</TableHead>
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
                            {p.daysSinceLastSubmission === 999 ? 'Nikdy' : `${p.daysSinceLastSubmission} dní`}
                          </span>
                        </TableCell>
                        <TableCell>
                          {p.submissionCount === 0 ? (
                            <Badge variant="destructive">Žiadna submisia</Badge>
                          ) : p.daysSinceLastSubmission >= 5 ? (
                            <Badge variant="destructive">Kritický</Badge>
                          ) : (
                            <Badge className="bg-orange-500">Varovanie</Badge>
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
