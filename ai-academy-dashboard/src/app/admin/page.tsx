'use client';

import { useEffect, useState, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { ReviewForm } from '@/components/ReviewForm';
import { SubmissionComments } from '@/components/SubmissionComments';
import { useAuth } from '@/components/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { sk } from 'date-fns/locale';
import {
  ShieldCheck,
  Clock,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  X,
  AlertCircle,
  Star,
  CheckSquare,
  Download,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { SubmissionWithDetails, TeamType, RoleType, SubmissionStatus } from '@/lib/types';

const TEAMS: TeamType[] = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
const ROLES: RoleType[] = ['FDE', 'AI-SE', 'AI-PM', 'AI-DA', 'AI-DS', 'AI-SEC', 'AI-FE', 'AI-DX'];
const DAYS = [1, 2, 3, 4, 5];
const STATUSES: { value: SubmissionStatus; label: string }[] = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'approved', label: 'Approved' },
  { value: 'needs_revision', label: 'Needs Revision' },
];

export default function AdminPage() {
  const { participant } = useAuth();
  const [allSubmissions, setAllSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [participants, setParticipants] = useState<{ id: string; name: string; github_username: string; avatar_url: string | null; role: RoleType }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkRating, setBulkRating] = useState<string>('');
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  const fetchAllSubmissions = async () => {
    const supabase = getSupabaseClient();

    const [submissionsResult, participantsResult] = await Promise.all([
      supabase
        .from('submissions')
        .select('*, participants(name, github_username, avatar_url, role, team), assignments(title, day, type)')
        .order('submitted_at', { ascending: false }),
      supabase
        .from('participants')
        .select('id, name, github_username, avatar_url, role')
        .order('name'),
    ]);

    if (!submissionsResult.error && submissionsResult.data) {
      setAllSubmissions(submissionsResult.data as SubmissionWithDetails[]);
    }
    if (!participantsResult.error && participantsResult.data) {
      setParticipants(participantsResult.data as typeof participants);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchAllSubmissions();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setSelectedIds(new Set());
    fetchAllSubmissions();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTeamFilter('all');
    setRoleFilter('all');
    setDayFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchQuery || teamFilter !== 'all' || roleFilter !== 'all' || dayFilter !== 'all' || statusFilter !== 'all';

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = [...allSubmissions];

    // Tab filter
    if (activeTab === 'pending') {
      filtered = filtered.filter((s) => s.status === 'submitted' && !s.mentor_rating);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.participants?.name?.toLowerCase().includes(query) ||
          s.participants?.github_username?.toLowerCase().includes(query)
      );
    }

    // Team filter
    if (teamFilter !== 'all') {
      filtered = filtered.filter((s) => s.participants?.team === teamFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((s) => s.participants?.role === roleFilter);
    }

    // Day filter
    if (dayFilter !== 'all') {
      filtered = filtered.filter((s) => s.assignments?.day === parseInt(dayFilter));
    }

    // Status filter (only for "all" tab)
    if (activeTab === 'all' && statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    return filtered;
  }, [allSubmissions, activeTab, searchQuery, teamFilter, roleFilter, dayFilter, statusFilter]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab, searchQuery, teamFilter, roleFilter, dayFilter, statusFilter]);

  // Stats
  const pendingCount = allSubmissions.filter((s) => s.status === 'submitted' && !s.mentor_rating).length;
  const reviewedCount = allSubmissions.filter((s) => s.mentor_rating !== null).length;
  const approvedCount = allSubmissions.filter((s) => s.status === 'approved').length;
  const needsRevisionCount = allSubmissions.filter((s) => s.status === 'needs_revision').length;

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredSubmissions.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const isAllSelected = filteredSubmissions.length > 0 && selectedIds.size === filteredSubmissions.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredSubmissions.length;

  // Bulk review handler
  const handleBulkReview = async () => {
    if (!bulkRating && !bulkStatus) {
      toast.error('Vyber rating alebo status');
      return;
    }

    setIsBulkSubmitting(true);

    try {
      const response = await fetch('/api/bulk-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_ids: Array.from(selectedIds),
          mentor_rating: bulkRating ? parseInt(bulkRating) : undefined,
          mentor_notes: bulkNotes || undefined,
          status: bulkStatus || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Hromadné hodnotenie zlyhalo');
      }

      toast.success(`Úspešne ohodnotených ${result.updated_count} submisií`);
      setIsBulkDialogOpen(false);
      setBulkRating('');
      setBulkStatus('');
      setBulkNotes('');
      setSelectedIds(new Set());
      fetchAllSubmissions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Hromadné hodnotenie zlyhalo');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Export selected
  const handleExportSelected = () => {
    const selectedSubmissions = filteredSubmissions.filter((s) => selectedIds.has(s.id));

    const csvContent = [
      ['Meno', 'GitHub', 'Tím', 'Rola', 'Deň', 'Úloha', 'Typ', 'Self Rating', 'Mentor Rating', 'Status', 'Dátum'].join(','),
      ...selectedSubmissions.map((s) =>
        [
          `"${s.participants?.name || ''}"`,
          s.participants?.github_username || '',
          s.participants?.team || '',
          s.participants?.role || '',
          s.assignments?.day || '',
          `"${s.assignments?.title || ''}"`,
          s.assignments?.type === 'in_class' ? 'In-Class' : 'Homework',
          s.self_rating || '',
          s.mentor_rating || '',
          s.status,
          format(new Date(s.submitted_at), 'yyyy-MM-dd HH:mm'),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exportovaných ${selectedSubmissions.length} submisií`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Review and manage submissions</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-[#0062FF]" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">Review and manage submissions</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4" />
              Reviewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{reviewedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Needs Revision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{needsRevisionCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <Card className="border-[#0062FF] bg-[#0062FF]/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CheckSquare className="h-5 w-5 text-[#0062FF]" />
                <span className="font-medium">
                  {selectedIds.size} {selectedIds.size === 1 ? 'položka vybraná' : selectedIds.size < 5 ? 'položky vybrané' : 'položiek vybraných'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportSelected}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  size="sm"
                  className="bg-[#0062FF] hover:bg-[#0052D9]"
                  onClick={() => setIsBulkDialogOpen(true)}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Hromadné hodnotenie
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'all')}>
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Reviews
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            All Submissions
            <Badge variant="secondary" className="ml-1">
              {allSubmissions.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Hľadať podľa mena alebo username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Team Filter */}
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všetky tímy</SelectItem>
                  {TEAMS.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všetky role</SelectItem>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Day Filter */}
              <Select value={dayFilter} onValueChange={setDayFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Deň" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všetky dni</SelectItem>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      Day {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter (only for All tab) */}
              {activeTab === 'all' && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Stav" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všetky stavy</SelectItem>
                    {STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Vyčistiť filtre
                </Button>
              )}
            </div>

            {/* Active filters display */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-muted-foreground">Aktívne filtre:</span>
                {searchQuery && (
                  <Badge variant="secondary">
                    Hľadanie: &quot;{searchQuery}&quot;
                  </Badge>
                )}
                {teamFilter !== 'all' && (
                  <Badge variant="secondary">Team: {teamFilter}</Badge>
                )}
                {roleFilter !== 'all' && (
                  <Badge variant="secondary">Role: {roleFilter}</Badge>
                )}
                {dayFilter !== 'all' && (
                  <Badge variant="secondary">Day {dayFilter}</Badge>
                )}
                {activeTab === 'all' && statusFilter !== 'all' && (
                  <Badge variant="secondary">
                    Status: {STATUSES.find((s) => s.value === statusFilter)?.label}
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground ml-2">
                  ({filteredSubmissions.length} výsledkov)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tab Content */}
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Čakajúce na recenziu
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-lg font-medium">Žiadne čakajúce recenzie!</p>
                  <p className="text-muted-foreground">
                    {hasActiveFilters
                      ? 'Skúste zmeniť filtre.'
                      : 'Všetky submisie boli skontrolované.'}
                  </p>
                </div>
              ) : (
                <SubmissionsTable
                  submissions={filteredSubmissions}
                  onReviewComplete={fetchAllSubmissions}
                  showStatus={false}
                  selectedIds={selectedIds}
                  onSelectAll={handleSelectAll}
                  onSelectOne={handleSelectOne}
                  isAllSelected={isAllSelected}
                  isSomeSelected={isSomeSelected}
                  participants={participants}
                  currentUserId={participant?.id}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Tab Content */}
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-[#0062FF]" />
                Všetky submisie
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Žiadne submisie</p>
                  <p className="text-muted-foreground">
                    {hasActiveFilters
                      ? 'Skúste zmeniť filtre.'
                      : 'Zatiaľ neboli odoslané žiadne submisie.'}
                  </p>
                </div>
              ) : (
                <SubmissionsTable
                  submissions={filteredSubmissions}
                  onReviewComplete={fetchAllSubmissions}
                  showStatus={true}
                  selectedIds={selectedIds}
                  onSelectAll={handleSelectAll}
                  onSelectOne={handleSelectOne}
                  isAllSelected={isAllSelected}
                  isSomeSelected={isSomeSelected}
                  participants={participants}
                  currentUserId={participant?.id}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Review Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hromadné hodnotenie</DialogTitle>
            <DialogDescription>
              Ohodnoť {selectedIds.size} {selectedIds.size === 1 ? 'submisiu' : selectedIds.size < 5 ? 'submisie' : 'submisií'} naraz
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rating (voliteľné)</Label>
              <Select value={bulkRating} onValueChange={setBulkRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyber rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Bez zmeny</SelectItem>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <SelectItem key={r} value={r.toString()}>
                      {'⭐'.repeat(r)} ({r}/5)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status (voliteľné)</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyber status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Bez zmeny</SelectItem>
                  {STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Poznámka (voliteľné)</Label>
              <Input
                placeholder="Spoločná poznámka pre všetky submisie..."
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
              Zrušiť
            </Button>
            <Button
              onClick={handleBulkReview}
              disabled={isBulkSubmitting || (!bulkRating && !bulkStatus)}
              className="bg-[#0062FF] hover:bg-[#0052D9]"
            >
              {isBulkSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ohodnotiť {selectedIds.size} {selectedIds.size === 1 ? 'submisiu' : selectedIds.size < 5 ? 'submisie' : 'submisií'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Extracted table component with checkbox support
function SubmissionsTable({
  submissions,
  onReviewComplete,
  showStatus,
  selectedIds,
  onSelectAll,
  onSelectOne,
  isAllSelected,
  isSomeSelected,
  participants,
  currentUserId,
}: {
  submissions: SubmissionWithDetails[];
  onReviewComplete: () => void;
  showStatus: boolean;
  selectedIds: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  participants: { id: string; name: string; github_username: string; avatar_url: string | null; role: RoleType }[];
  currentUserId?: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={isAllSelected}
              ref={(el) => {
                if (el) {
                  (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = isSomeSelected;
                }
              }}
              onCheckedChange={onSelectAll}
            />
          </TableHead>
          <TableHead>Participant</TableHead>
          <TableHead>Assignment</TableHead>
          <TableHead>Self Rating</TableHead>
          {showStatus && <TableHead>Mentor Rating</TableHead>}
          {showStatus && <TableHead>Status</TableHead>}
          <TableHead>Submitted</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map((sub) => (
          <TableRow key={sub.id} className={selectedIds.has(sub.id) ? 'bg-accent/50' : ''}>
            <TableCell>
              <Checkbox
                checked={selectedIds.has(sub.id)}
                onCheckedChange={(checked) => onSelectOne(sub.id, checked as boolean)}
              />
            </TableCell>
            <TableCell>
              <Link
                href={`/participant/${sub.participants?.github_username}`}
                className="flex items-center gap-3 hover:underline"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={sub.participants?.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {sub.participants?.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('') || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{sub.participants?.name}</p>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {sub.participants?.role}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {sub.participants?.team}
                    </Badge>
                  </div>
                </div>
              </Link>
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">
                  Day {sub.assignments?.day}: {sub.assignments?.title}
                </p>
                <Badge variant="outline" className="text-xs">
                  {sub.assignments?.type === 'in_class' ? 'In-Class' : 'Homework'}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              {sub.self_rating ? (
                <span>{'⭐'.repeat(sub.self_rating)} ({sub.self_rating}/5)</span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            {showStatus && (
              <TableCell>
                {sub.mentor_rating ? (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {sub.mentor_rating}/5
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            )}
            {showStatus && (
              <TableCell>
                {sub.status === 'approved' && (
                  <Badge className="bg-green-500">Approved</Badge>
                )}
                {sub.status === 'needs_revision' && (
                  <Badge variant="destructive">Needs Revision</Badge>
                )}
                {sub.status === 'reviewed' && (
                  <Badge className="bg-blue-500">Reviewed</Badge>
                )}
                {sub.status === 'submitted' && (
                  <Badge variant="secondary">Submitted</Badge>
                )}
              </TableCell>
            )}
            <TableCell className="text-muted-foreground">
              {formatDistanceToNow(new Date(sub.submitted_at), {
                addSuffix: true,
                locale: sk,
              })}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <ReviewForm
                  submissionId={sub.id}
                  participantName={sub.participants?.name || 'Unknown'}
                  assignmentTitle={`Day ${sub.assignments?.day}: ${sub.assignments?.title}`}
                  onReviewComplete={onReviewComplete}
                  existingRating={sub.mentor_rating ?? undefined}
                  existingNotes={sub.mentor_notes ?? undefined}
                />
                <SubmissionComments
                  submissionId={sub.id}
                  currentUserId={currentUserId}
                  participants={participants as never}
                  trigger={
                    <Button size="sm" variant="ghost">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  }
                />
                {sub.commit_url && (
                  <a
                    href={sub.commit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
