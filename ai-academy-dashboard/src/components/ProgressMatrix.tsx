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
import { Grid3X3, Download, CheckCircle, XCircle, FileText, Users } from 'lucide-react';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
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

const ROLES: RoleType[] = ['FDE', 'AI-SE', 'AI-PM', 'AI-DA', 'AI-DS', 'AI-SEC', 'AI-FE', 'AI-DX'];
const DAYS = [1, 2, 3, 4, 5];
const TYPES: AssignmentType[] = ['in_class', 'homework'];

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

  // Create a lookup map for quick access
  const matrixMap = useMemo(() => {
    const map = new Map<string, ProgressMatrixType>();
    data.forEach((item) => {
      const key = `${item.role}-${item.day}-${item.type}`;
      map.set(key, item);
    });
    return map;
  }, [data]);

  // Create assignment lookup
  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment>();
    assignments.forEach((a) => {
      const key = `${a.day}-${a.type}`;
      map.set(key, a);
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

  const handleCellClick = (role: RoleType, day: number, type: AssignmentType) => {
    const assignment = assignmentMap.get(`${day}-${type}`);
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

  // Export to PDF (using print)
  const handleExportPDF = () => {
    const printContent = document.getElementById('progress-matrix-print');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Progress Matrix - AI Academy</title>
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
                <h1>Progress Matrix - AI Academy</h1>
                <p>Generated: ${format(new Date(), 'd. MMMM yyyy HH:mm', { locale: sk })}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    ${DAYS.map((day) => `<th colspan="2">Day ${day}</th>`).join('')}
                  </tr>
                  <tr>
                    <th></th>
                    ${DAYS.map(() => '<th>IC</th><th>HW</th>').join('')}
                  </tr>
                </thead>
                <tbody>
                  ${ROLES.map((role) => `
                    <tr>
                      <td><strong>${role}</strong></td>
                      ${DAYS.map((day) =>
                        TYPES.map((type) => {
                          if ((day === 4 || day === 5) && type === 'homework') {
                            return '<td>-</td>';
                          }
                          const cell = getCell(role, day, type);
                          const pct = cell?.completion_pct ?? 0;
                          const bgClass = pct === 0 ? 'bg-0' : pct < 50 ? 'bg-red' : pct < 80 ? 'bg-yellow' : 'bg-green';
                          return `<td class="${bgClass}">${pct}%</td>`;
                        }).join('')
                      ).join('')}
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
      ['Meno', 'GitHub', 'Tím', 'Status', 'Odovzdané'].join(','),
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5 text-[#0062FF]" />
            Progress Matrix
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto" id="progress-matrix-print">
            <TooltipProvider>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left font-medium text-muted-foreground">Role</th>
                    {DAYS.map((day) => (
                      <th key={day} colSpan={2} className="p-2 text-center font-medium">
                        Day {day}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="p-2"></th>
                    {DAYS.map((day) => (
                      <th key={`${day}-headers`} colSpan={2} className="p-0">
                        <div className="flex">
                          <span className="flex-1 p-1 text-center text-xs text-muted-foreground">IC</span>
                          <span className="flex-1 p-1 text-center text-xs text-muted-foreground">HW</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROLES.map((role) => (
                    <tr key={role} className="border-t border-border">
                      <td className="p-2">
                        <Badge variant="outline">{role}</Badge>
                      </td>
                      {DAYS.map((day) => (
                        <td key={`${day}-cells`} colSpan={2} className="p-0">
                          <div className="flex">
                            {TYPES.map((type) => {
                              const cell = getCell(role, day, type);
                              const pct = cell?.completion_pct ?? 0;
                              const submitted = cell?.submitted ?? 0;
                              const total = cell?.total ?? 0;

                              // Skip homework for day 4 and 5
                              if ((day === 4 || day === 5) && type === 'homework') {
                                return (
                                  <div
                                    key={`${day}-${type}`}
                                    className="flex-1 p-1"
                                  >
                                    <div className="w-full h-8 bg-muted/30 rounded flex items-center justify-center text-xs text-muted-foreground">
                                      -
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={`${day}-${type}`}
                                  className="flex-1 p-1"
                                >
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => handleCellClick(role, day, type)}
                                        className={`w-full h-8 rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-all hover:scale-105 hover:ring-2 hover:ring-[#0062FF] ${getCompletionColor(pct)} ${getCompletionTextColor(pct)}`}
                                      >
                                        {pct}%
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-medium">
                                        {role} - Day {day} {type === 'in_class' ? 'In-Class' : 'Homework'}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {submitted} / {total} submitted ({pct}%)
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Click for details
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      ))}
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
              {drillDown?.role} - Day {drillDown?.day}{' '}
              {drillDown?.type === 'in_class' ? 'In-Class' : 'Homework'}
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
                Chýbajúce ({drillDown?.notSubmitted.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="submitted" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Odovzdané ({drillDown?.submitted.length ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="missing" className="flex-1 overflow-auto mt-4">
              {drillDown?.notSubmitted.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                  <p>Všetci študenti odovzdali!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Študent</TableHead>
                      <TableHead>Tím</TableHead>
                      <TableHead>Akcia</TableHead>
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
                              Profil
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
                  <p>Nikto ešte neodovzdal</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Študent</TableHead>
                      <TableHead>Tím</TableHead>
                      <TableHead>Odovzdané</TableHead>
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
                          {format(new Date(p.submission.submitted_at), 'd. MMM HH:mm', {
                            locale: sk,
                          })}
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
