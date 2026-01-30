'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { sk } from 'date-fns/locale';
import {
  ShieldCheck,
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
          ? 'Používateľ bol schválený'
          : 'Používateľ bol zamietnutý'
      );

      // Update local state
      setParticipants((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, status: newStatus } : p))
      );

      setSelectedUser(null);
      setActionType(null);
    } catch (error) {
      toast.error('Nepodarilo sa zmeniť stav používateľa');
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
          <h1 className="text-3xl font-bold">Správa používateľov</h1>
          <p className="text-muted-foreground">Schvaľovanie registrácií</p>
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
            Správa používateľov
          </h1>
          <p className="text-muted-foreground">Schvaľovanie a správa registrácií</p>
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
              Celkom
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
              Čakajúci
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
              Schválení
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
              Zamietnutí
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
              Čakajúci
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-orange-500/20 text-orange-500">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Schválení
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Zamietnutí
            </TabsTrigger>
            <TabsTrigger value="all">Všetci</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hľadať..."
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
                <p className="text-lg font-medium">Žiadni používatelia</p>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'Skúste zmeniť vyhľadávanie.'
                    : activeTab === 'pending'
                    ? 'Žiadne čakajúce registrácie.'
                    : 'Žiadni používatelia v tejto kategórii.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Používateľ</TableHead>
                    <TableHead>GitHub</TableHead>
                    <TableHead>Tím</TableHead>
                    <TableHead>Rola</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead>Registrácia</TableHead>
                    <TableHead>Akcie</TableHead>
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
                          <Badge className="bg-green-500">Schválený</Badge>
                        )}
                        {user.status === 'pending' && (
                          <Badge className="bg-orange-500">Čakajúci</Badge>
                        )}
                        {user.status === 'rejected' && (
                          <Badge variant="destructive">Zamietnutý</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.created_at
                          ? formatDistanceToNow(new Date(user.created_at), {
                              addSuffix: true,
                              locale: sk,
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
              {actionType === 'approve' ? 'Schváliť používateľa' : 'Zamietnuť používateľa'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'Používateľ získa prístup k dashboardu.'
                : 'Používateľ bude zamietnutý a nebude mať prístup.'}
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
              Zrušiť
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
              {actionType === 'approve' ? 'Schváliť' : 'Zamietnuť'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
