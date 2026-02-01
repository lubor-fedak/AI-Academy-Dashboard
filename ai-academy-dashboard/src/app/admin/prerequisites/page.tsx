'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Download,
  BarChart3,
  List,
  RefreshCw,
  ArrowLeft,
  Rocket,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  PrerequisiteStats,
  ParticipantPrerequisitesSummary,
  PrerequisiteCategory,
  PREREQUISITE_CATEGORY_NAMES,
  PREREQUISITE_CATEGORY_ICONS,
  RoleType,
  ROLE_COLORS,
} from '@/lib/types';

interface OverviewStats {
  total_participants: number;
  fully_ready: number;
  partially_ready: number;
  not_started: number;
  readiness_pct: number;
}

export default function AdminPrerequisitesPage() {
  const [stats, setStats] = useState<PrerequisiteStats[]>([]);
  const [summary, setSummary] = useState<ParticipantPrerequisitesSummary[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/prerequisites?view=stats');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setStats(data.stats || []);
      setSummary(data.summary || []);
      setOverview(data.overview || null);
    } catch (error) {
      console.error('Error fetching prerequisites stats:', error);
      toast.error('Failed to load prerequisites data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group stats by category
  const groupedStats = stats.reduce((acc, stat) => {
    const category = stat.category as PrerequisiteCategory;
    if (!acc[category]) acc[category] = [];
    acc[category].push(stat);
    return acc;
  }, {} as Record<PrerequisiteCategory, PrerequisiteStats[]>);

  // Filter summary
  const filteredSummary = summary.filter(p => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || p.role === roleFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'ready' && p.required_completion_pct === 100) ||
      (statusFilter === 'partial' && p.required_completion_pct > 0 && p.required_completion_pct < 100) ||
      (statusFilter === 'not_started' && (p.required_completion_pct === 0 || p.required_completion_pct === null));

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Team', 'Required Completed', 'Required Total', 'Completion %'];
    const rows = filteredSummary.map(p => [
      p.name,
      p.email,
      p.role || 'N/A',
      p.team || 'N/A',
      p.required_completed,
      p.required_total,
      `${p.required_completion_pct || 0}%`,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prerequisites-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Rocket className="h-6 w-6 text-blue-500" />
              Prerequisites Overview
            </h1>
            <p className="text-muted-foreground">
              Monitor participant readiness for the AI Academy
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-500" />
              <span className="text-3xl font-bold">{overview?.total_participants || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fully Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <span className="text-3xl font-bold text-green-600">{overview?.fully_ready || 0}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {overview?.readiness_pct || 0}% of participants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Partially Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <span className="text-3xl font-bold text-orange-600">{overview?.partially_ready || 0}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Not Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <span className="text-3xl font-bold text-red-600">{overview?.not_started || 0}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Tool Stats
          </TabsTrigger>
          <TabsTrigger value="participants" className="gap-2">
            <List className="h-4 w-4" />
            Participants
          </TabsTrigger>
        </TabsList>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          {Object.entries(groupedStats).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{PREREQUISITE_CATEGORY_ICONS[category as PrerequisiteCategory]}</span>
                  {PREREQUISITE_CATEGORY_NAMES[category as PrerequisiteCategory]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          {item.is_required && (
                            <Badge variant="outline" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {item.completed_count} / {item.total_participants}
                          </span>
                          <span className="text-sm font-semibold w-12 text-right">
                            {item.completion_pct}%
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={item.completion_pct}
                        className={`h-2 ${
                          item.completion_pct >= 80
                            ? '[&>div]:bg-green-500'
                            : item.completion_pct >= 50
                            ? '[&>div]:bg-yellow-500'
                            : '[&>div]:bg-red-500'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle>Participant Readiness</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="FDE">FDE</SelectItem>
                      <SelectItem value="AI-SE">AI-SE</SelectItem>
                      <SelectItem value="AI-PM">AI-PM</SelectItem>
                      <SelectItem value="AI-DA">AI-DA</SelectItem>
                      <SelectItem value="AI-DS">AI-DS</SelectItem>
                      <SelectItem value="AI-SEC">AI-SEC</SelectItem>
                      <SelectItem value="AI-FE">AI-FE</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="partial">In Progress</SelectItem>
                      <SelectItem value="not_started">Not Started</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <CardDescription>
                Showing {filteredSummary.length} of {summary.length} participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-center">Required</TableHead>
                    <TableHead className="text-center">Optional</TableHead>
                    <TableHead className="text-center">Progress</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No participants found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSummary.map(participant => (
                      <TableRow key={participant.participant_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{participant.name}</div>
                            <div className="text-sm text-muted-foreground">{participant.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {participant.role ? (
                            <Badge className={`${ROLE_COLORS[participant.role as RoleType]} text-white`}>
                              {participant.role}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {participant.team || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={
                            participant.required_completed === participant.required_total
                              ? 'text-green-600 font-medium'
                              : 'text-muted-foreground'
                          }>
                            {participant.required_completed} / {participant.required_total}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-muted-foreground">
                            {participant.completed_count - participant.required_completed} / {participant.total_items - participant.required_total}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <Progress
                              value={participant.required_completion_pct || 0}
                              className="w-20 h-2"
                            />
                            <span className="text-sm w-10">
                              {participant.required_completion_pct || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {participant.required_completion_pct === 100 ? (
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Ready
                            </Badge>
                          ) : participant.required_completion_pct > 0 ? (
                            <Badge variant="outline" className="border-orange-500 text-orange-600">
                              In Progress
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-500 text-red-600">
                              Not Started
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
