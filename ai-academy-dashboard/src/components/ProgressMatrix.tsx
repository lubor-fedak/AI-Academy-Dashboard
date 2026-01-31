'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Grid3X3, Download, CheckCircle, XCircle, FileText, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import type {
  ProgressMatrix as ProgressMatrixType,
  RoleType,
  AssignmentType,
  Participant,
  Assignment,
  Submission,
} from '@/lib/types';

interface ProgressMatrixProps {
  data: ProgressMatrixType[];
  participants: Participant[];
  assignments: Assignment[];
  submissions: Pick<Submission, 'participant_id' | 'assignment_id' | 'status' | 'submitted_at'>[];
}

const ROLES: RoleType[] = ['FDE', 'AI-SE', 'AI-PM', 'AI-DA', 'AI-DS', 'AI-SEC', 'AI-FE'];

// Organized by week for cleaner display
const WEEKS = [
  { week: 1, label: 'Week 1', sublabel: 'Foundations', days: [1, 2, 3, 4, 5], color: 'bg-blue-500' },
  { week: 2, label: 'Week 2', sublabel: 'Deep Dive', days: [6, 7, 8, 9, 10], color: 'bg-green-500' },
  { week: 4, label: 'Week 4', sublabel: 'Team Build', days: [11, 12, 13, 14, 15], color: 'bg-purple-500' },
  { week: 5, label: 'Week 5', sublabel: 'Polish', days: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25], color: 'bg-orange-500' },
];

function getCompletionColor(pct: number): string {
  if (pct === 0) return 'bg-muted';
  if (pct < 50) return 'bg-red-500/70';
  if (pct < 80) return 'bg-yellow-500/70';
  return 'bg-green-500/70';
}

function getCompletionTextColor(pct: number): string {
  if (pct === 0) return 'text-muted-foreground';
  return 'text-white';
}

interface DrillDownData {
  role: RoleType;
  day: number;
  type: AssignmentType;
  assignment: Assignment | undefined;
  submitted: ParticipantWithSubmission[];
  notSubmitted: Participant[];
}

interface ParticipantWithSubmission extends Participant {
  submission: Pick<Submission, 'participant_id' | 'assignment_id' | 'status' | 'submitted_at'>;
}

export function ProgressMatrix({ data, participants, assignments, submissions }: ProgressMatrixProps) {
  const [drillDown, setDrillDown] = useState<DrillDownData | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>('1');

  const currentWeek = WEEKS.find(w => w.week.toString() === selectedWeek) || WEEKS[0];

  // Create a lookup map for quick access
  const matrixMap = useMemo(() => {
    const map = new Map<string, ProgressMatrixType>();
    data.forEach((item) => {
      const key = `${item.role}-${item.day}-${item.type}`;
      map.set(key, item);
    });
    return map;
  }, [data]);

  // Create assignment lookup - now handles role-specific assignments
  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment>();
    assignments.forEach((a) => {
      // For role-specific assignments, create keys for each target role
      if (a.target_roles && a.target_roles.length > 0) {
        a.target_roles.forEach(role => {
          const key = `${a.day}-${a.type}-${role}`;
          map.set(key, a);
        });
      } else {
        // Common assignment - create key for all roles
        ROLES.forEach(role => {
          const key = `${a.day}-${a.type}-${role}`;
          map.set(key, a);
        });
      }
    });
    return map;
  }, [assignments]);

  // Create submission lookup by participant and assignment
  const submissionMap = useMemo(() => {
    const map = new Map<string, Pick<Submission, 'participant_id' | 'assignment_id' | 'status' | 'submitted_at'>>();
    submissions.forEach((s) => {
      const key = `${s.participant_id}-${s.assignment_id}`;
      map.set(key, s);
    });
    return map;
  }, [submissions]);

  const getCell = (role: RoleType, day: number, type: AssignmentType) => {
    const key = `${role}-${day}-${type}`;
    return matrixMap.get(key);
  };

  const getAssignment = (role: RoleType, day: number, type: AssignmentType) => {
    return assignmentMap.get(`${day}-${type}-${role}`);
  };

  const handleCellClick = (role: RoleType, day: number, type: AssignmentType) => {
    const assignment = getAssignment(role, day, type);
    const roleParticipants = participants.filter((p) => p.role === role);

    const submitted: ParticipantWithSubmission[] = [];
    const notSubmitted: Participant[] = [];

    roleParticipants.forEach((p) => {
      if (assignment) {
        const submission = submissionMap.get(`${p.id}-${assignment.id}`);
        if (submission) {
          submitted.push({ ...p, submission });
        } else {
          notSubmitted.push(p);
        }
      } else {
        notSubmitted.push(p);
      }
    });

    setDrillDown({
      role,
      day,
      type,
      assignment,
      submitted,
      notSubmitted,
    });
  };

  // Calculate week stats
  const weekStats = useMemo(() => {
    return WEEKS.map(week => {
      let totalCells = 0;
      let completedCells = 0;

      week.days.forEach(day => {
        ROLES.forEach(role => {
          const cell = getCell(role, day, 'in_class');
          if (cell && cell.total > 0) {
            totalCells++;
            if (cell.completion_pct >= 80) completedCells++;
          }
        });
      });

      return {
        ...week,
        completionRate: totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Export to PDF (using print)
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Progress Matrix - AI Academy - ${currentWeek.label}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
              th { background: #f5f5f5; }
              .header { margin-bottom: 20px; }
              .header h1 { margin: 0; font-size: 24px; }
              .header p { margin: 5px 0 0; color: #666; }
              .legend { display: flex; gap: 20px; margin-top: 20px; justify-content: center; }
              .legend-item { display: flex; align-items: center; gap: 5px; }
              .legend-color { width: 16px; height: 16px; border-radius: 4px; }
              .bg-0 { background: #e5e5e5; }
              .bg-red { background: rgba(239, 68, 68, 0.7); color: white; }
              .bg-yellow { background: rgba(234, 179, 8, 0.7); color: white; }
              .bg-green { background: rgba(34, 197, 94, 0.7); color: white; }
              @media print {
                body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Progress Matrix - AI Academy - ${currentWeek.label}</h1>
              <p>Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  ${currentWeek.days.map((day) => `<th>Day ${day}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${ROLES.map((role) => `
                  <tr>
                    <td><strong>${role}</strong></td>
                    ${currentWeek.days.map((day) => {
                      const cell = getCell(role, day, 'in_class');
                      const pct = cell?.completion_pct ?? 0;
                      const bgClass = pct === 0 ? 'bg-0' : pct < 50 ? 'bg-red' : pct < 80 ? 'bg-yellow' : 'bg-green';
                      return `<td class="${bgClass}">${pct}%</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="legend">
              <div class="legend-item"><div class="legend-color bg-0"></div> 0%</div>
              <div class="legend-item"><div class="legend-color bg-red"></div> &lt;50%</div>
              <div class="legend-item"><div class="legend-color bg-yellow"></div> 50-80%</div>
              <div class="legend-item"><div class="legend-color bg-green"></div> &gt;80%</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Export drill-down to CSV
  const handleExportDrillDownCSV = () => {
    if (!drillDown) return;

    const allParticipants = [
      ...drillDown.submitted.map((p) => ({
        name: p.name,
        github: p.github_username,
        team: p.team,
        status: 'Submitted',
        submitted_at: p.submission.submitted_at
          ? format(new Date(p.submission.submitted_at), 'yyyy-MM-dd HH:mm')
          : '',
      })),
      ...drillDown.notSubmitted.map((p) => ({
        name: p.name,
        github: p.github_username,
        team: p.team,
        status: 'Not Submitted',
        submitted_at: '',
      })),
    ];

    const csvContent = [
      ['Name', 'GitHub', 'Team', 'Status', 'Submitted'].join(','),
      ...allParticipants.map((p) =>
        [`"${p.name}"`, p.github, p.team, p.status, p.submitted_at].join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progress-${drillDown.role}-day${drillDown.day}-${drillDown.type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5 text-[#0062FF]" />
            Progress Matrix
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {WEEKS.map((week) => (
                  <SelectItem key={week.week} value={week.week.toString()}>
                    {week.label}: {week.sublabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {weekStats.map((week) => (
              <button
                key={week.week}
                onClick={() => setSelectedWeek(week.week.toString())}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedWeek === week.week.toString()
                    ? 'border-[#0062FF] bg-[#0062FF]/5'
                    : 'border-border hover:border-[#0062FF]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className={week.color}>{week.label}</Badge>
                  <span className={`text-lg font-bold ${
                    week.completionRate >= 80 ? 'text-green-500' :
                    week.completionRate >= 50 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {week.completionRate}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{week.sublabel}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Days {week.days[0]}-{week.days[week.days.length - 1]}
                </p>
              </button>
            ))}
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto" id="progress-matrix-print">
            <TooltipProvider>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left font-medium text-muted-foreground sticky left-0 bg-background z-10">
                      Role
                    </th>
                    {currentWeek.days.map((day) => (
                      <th key={day} className="p-2 text-center font-medium min-w-[80px]">
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-muted-foreground">Day</span>
                          <span className="text-lg">{day}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROLES.map((role) => (
                    <tr key={role} className="border-t border-border">
                      <td className="p-2 sticky left-0 bg-background z-10">
                        <Badge variant="outline">{role}</Badge>
                      </td>
                      {currentWeek.days.map((day) => {
                        const cell = getCell(role, day, 'in_class');
                        const assignment = getAssignment(role, day, 'in_class');
                        const pct = cell?.completion_pct ?? 0;
                        const submitted = cell?.submitted ?? 0;
                        const total = cell?.total ?? 0;

                        // Check if this role has an assignment for this day
                        const hasAssignment = !!assignment;

                        if (!hasAssignment) {
                          return (
                            <td key={day} className="p-1">
                              <div className="w-full h-12 bg-muted/30 rounded flex items-center justify-center text-xs text-muted-foreground">
                                -
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={day} className="p-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleCellClick(role, day, 'in_class')}
                                  className={`w-full h-12 rounded flex flex-col items-center justify-center text-xs font-medium cursor-pointer transition-all hover:scale-105 hover:ring-2 hover:ring-[#0062FF] ${getCompletionColor(pct)} ${getCompletionTextColor(pct)}`}
                                >
                                  <span className="text-lg font-bold">{pct}%</span>
                                  <span className="text-[10px] opacity-80">{submitted}/{total}</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-medium">
                                  {role} - Day {day}
                                </p>
                                <p className="text-sm font-normal">{assignment?.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {submitted} / {total} submitted ({pct}%)
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Click for details
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TooltipProvider>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-6 justify-center flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted"></div>
              <span className="text-xs text-muted-foreground">0%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/70"></div>
              <span className="text-xs text-muted-foreground">&lt;50%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500/70"></div>
              <span className="text-xs text-muted-foreground">50-80%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/70"></div>
              <span className="text-xs text-muted-foreground">&gt;80%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drill-down Dialog */}
      <Dialog open={!!drillDown} onOpenChange={() => setDrillDown(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#0062FF]" />
              {drillDown?.role} - Day {drillDown?.day}
            </DialogTitle>
            <DialogDescription>
              {drillDown?.assignment?.title || 'Assignment details'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-green-500/10 text-green-600">
                <CheckCircle className="mr-1 h-3 w-3" />
                {drillDown?.submitted.length ?? 0} submitted
              </Badge>
              <Badge variant="outline" className="bg-red-500/10 text-red-600">
                <XCircle className="mr-1 h-3 w-3" />
                {drillDown?.notSubmitted.length ?? 0} missing
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportDrillDownCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <Tabs defaultValue="missing" className="flex-1 overflow-hidden flex flex-col">
            <TabsList>
              <TabsTrigger value="missing" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Missing ({drillDown?.notSubmitted.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="submitted" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Submitted ({drillDown?.submitted.length ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="missing" className="flex-1 overflow-auto mt-4">
              {drillDown?.notSubmitted.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                  <p>All students submitted!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drillDown?.notSubmitted.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={p.avatar_url ?? undefined} />
                              <AvatarFallback>
                                {p.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">@{p.github_username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{p.team}</Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/participant/${p.github_username}`}>
                            <Button variant="ghost" size="sm">
                              Profile
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="submitted" className="flex-1 overflow-auto mt-4">
              {drillDown?.submitted.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <XCircle className="h-12 w-12 mx-auto text-red-500 mb-2" />
                  <p>No one has submitted yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drillDown?.submitted.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link
                            href={`/participant/${p.github_username}`}
                            className="flex items-center gap-3 hover:underline"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={p.avatar_url ?? undefined} />
                              <AvatarFallback>
                                {p.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">@{p.github_username}</p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{p.team}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(p.submission.submitted_at), 'MMM d HH:mm')}
                        </TableCell>
                        <TableCell>
                          {p.submission.status === 'approved' && (
                            <Badge className="bg-green-500">Approved</Badge>
                          )}
                          {p.submission.status === 'needs_revision' && (
                            <Badge variant="destructive">Needs Revision</Badge>
                          )}
                          {p.submission.status === 'reviewed' && (
                            <Badge className="bg-blue-500">Reviewed</Badge>
                          )}
                          {p.submission.status === 'submitted' && (
                            <Badge variant="secondary">Submitted</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
