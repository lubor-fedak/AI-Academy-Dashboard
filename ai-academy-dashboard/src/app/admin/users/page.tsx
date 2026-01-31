'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  Github,
  Mail,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Participant, UserStatus } from '@/lib/types';

export default function AdminUsersPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  // Action dialog
  const [selectedUser, setSelectedUser] = useState<Participant | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchParticipants = async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setParticipants(data as Participant[]);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchParticipants();
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('participants')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success(
        newStatus === 'approved'
          ? 'User has been approved'
          : 'User has been rejected'
      );

      // Update local state
      setParticipants((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, status: newStatus } : p))
      );

      setSelectedUser(null);
      setActionType(null);
    } catch {
      toast.error('Failed to change user status');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter participants
  const filteredParticipants = participants.filter((p) => {
    // Status filter
    if (activeTab !== 'all' && p.status !== activeTab) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        p.name?.toLowerCase().includes(query) ||
        p.github_username?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Stats
  const pendingCount = participants.filter((p) => p.status === 'pending').length;
  const approvedCount = participants.filter((p) => p.status === 'approved').length;
  const rejectedCount = participants.filter((p) => p.status === 'rejected').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Approve registrations</p>
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
            <Users className="h-8 w-8 text-[#0062FF]" />
            User Management
          </h1>
          <p className="text-muted-foreground">Approve and manage registrations</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{participants.length}</div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-orange-500/20 text-orange-500">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejected
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users Table */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            {filteredParticipants.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No users found</p>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'Try changing your search query.'
                    : activeTab === 'pending'
                    ? 'No pending registrations.'
                    : 'No users in this category.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>GitHub</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url ?? undefined} />
                            <AvatarFallback>
                              {user.name
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('') || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            {user.email && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://github.com/${user.github_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#0062FF] hover:underline"
                        >
                          <Github className="h-4 w-4" />
                          @{user.github_username}
                        </a>
                      </TableCell>
                      <TableCell>
                        {user.team ? (
                          <Badge variant="outline">{user.team}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.role ? (
                          <Badge variant="secondary">{user.role}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.status === 'approved' && (
                          <Badge className="bg-green-500">Approved</Badge>
                        )}
                        {user.status === 'pending' && (
                          <Badge className="bg-orange-500">Pending</Badge>
                        )}
                        {user.status === 'rejected' && (
                          <Badge variant="destructive">Rejected</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.created_at
                          ? formatDistanceToNow(new Date(user.created_at), {
                              addSuffix: true,
                            })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.status !== 'approved' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                              onClick={() => {
                                setSelectedUser(user);
                                setActionType('approve');
                              }}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          {user.status !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={() => {
                                setSelectedUser(user);
                                setActionType('reject');
                              }}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={!!selectedUser && !!actionType}
        onOpenChange={() => {
          setSelectedUser(null);
          setActionType(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve User' : 'Reject User'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'The user will get access to the dashboard.'
                : 'The user will be rejected and will not have access.'}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-accent/50 my-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedUser.avatar_url ?? undefined} />
                <AvatarFallback>
                  {selectedUser.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('') || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedUser.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Github className="h-3 w-3" />
                  @{selectedUser.github_username}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedUser(null);
                setActionType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedUser &&
                handleStatusChange(
                  selectedUser.id,
                  actionType === 'approve' ? 'approved' : 'rejected'
                )
              }
              disabled={isSubmitting}
              className={
                actionType === 'approve'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              }
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
