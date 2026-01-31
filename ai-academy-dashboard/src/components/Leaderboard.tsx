'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award, Flame } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { LeaderboardView, RoleType, TeamType, StreamType } from '@/lib/types';

const ROLES: RoleType[] = ['FDE', 'AI-SE', 'AI-PM', 'AI-DA', 'AI-DS', 'AI-SEC', 'AI-FE'];
const TEAMS: TeamType[] = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
const STREAMS: StreamType[] = ['Tech', 'Business'];

interface LeaderboardProps {
  initialData: LeaderboardView[];
}

export function Leaderboard({ initialData }: LeaderboardProps) {
  const [data, setData] = useState<LeaderboardView[]>(initialData);
  const [filteredData, setFilteredData] = useState<LeaderboardView[]>(initialData);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [streamFilter, setStreamFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'points' | 'submissions' | 'rating'>('points');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
const [isLoading, setIsLoading] = useState(false);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...data];

    if (roleFilter !== 'all') {
      filtered = filtered.filter((p) => p.role === roleFilter);
    }
    if (teamFilter !== 'all') {
      filtered = filtered.filter((p) => p.team === teamFilter);
    }
    if (streamFilter !== 'all') {
      filtered = filtered.filter((p) => p.stream === streamFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'submissions':
          return b.total_submissions - a.total_submissions;
        case 'rating':
          return (b.avg_mentor_rating ?? 0) - (a.avg_mentor_rating ?? 0);
        default:
          return b.total_points - a.total_points;
      }
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilteredData(filtered);
  }, [data, roleFilter, teamFilter, streamFilter, sortBy]);

  // Subscribe to real-time updates
  useEffect(() => {
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboard',
        },
        async () => {
          // Refetch leaderboard data
          const { data: newData, error } = await supabase
            .from('leaderboard_view')
            .select('*')
            .order('rank');

          if (!error && newData) {
            setData(newData as LeaderboardView[]);
            toast.success('Leaderboard updated!', {
              description: 'New submission received',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 2:
        return 'bg-gray-400/10 border-gray-400/30';
      case 3:
        return 'bg-amber-600/10 border-amber-600/30';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {TEAMS.map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={streamFilter} onValueChange={setStreamFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Stream" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                {STREAMS.map((stream) => (
                  <SelectItem key={stream} value={stream}>
                    {stream}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="points">Points</SelectItem>
                <SelectItem value="submissions">Submissions</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#0062FF]" />
            Leaderboard
            <Badge variant="secondary" className="ml-2">
              {filteredData.length} participants
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Submissions</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="text-right">Streak</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((entry, index) => (
                <TableRow
                  key={entry.github_username}
                  className={`${getRankBg(entry.rank)} transition-colors`}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/participant/${entry.github_username}`}
                      className="flex items-center gap-3 hover:underline"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.avatar_url ?? undefined} />
                        <AvatarFallback>
                          {entry.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">
                          @{entry.github_username}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{entry.team}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-[#0062FF]">
                    {entry.total_points}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.total_submissions}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.avg_mentor_rating?.toFixed(1) ?? '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.current_streak > 0 && (
                      <span className="flex items-center justify-end gap-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        {entry.current_streak}
                      </span>
                    )}
                    {entry.current_streak === 0 && '-'}
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No participants found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
