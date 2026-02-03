'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import {
  LayoutDashboard,
  Trophy,
  Grid3X3,
  Users,
  ShieldCheck,
  User,
  BarChart3,
  Search,
  Rocket,
  LogIn,
  FileText,
  Settings,
  Calculator,
  UsersRound,
} from 'lucide-react';
import type { Participant } from '@/lib/types';

const PAGES = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, keywords: ['home', 'main'] },
  { name: 'My Progress', href: '/my-dashboard', icon: User, keywords: ['my', 'profile', 'progress'] },
  { name: 'Peer Reviews', href: '/peer-reviews', icon: UsersRound, keywords: ['peer', 'review', 'rating'] },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy, keywords: ['rank', 'ranking', 'points'] },
  { name: 'Progress Matrix', href: '/progress', icon: Grid3X3, keywords: ['matrix', 'overview', 'tasks'] },
  { name: 'Teams', href: '/teams', icon: Users, keywords: ['teams', 'groups'] },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, keywords: ['statistics', 'graphs', 'analysis'] },
  { name: 'Admin Panel', href: '/admin', icon: ShieldCheck, keywords: ['admin', 'review', 'manage'] },
  { name: 'Onboarding', href: '/onboarding', icon: Rocket, keywords: ['register', 'start', 'new'] },
  { name: 'Sign In', href: '/login', icon: LogIn, keywords: ['login', 'sign in'] },
];

const QUICK_ACTIONS = [
  { name: 'New Submission', action: 'new-submission', icon: FileText, description: 'Submit new assignment' },
  { name: 'Settings', action: 'settings', icon: Settings, description: 'Edit settings' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, isAdmin, userStatus } = useAuth();

  // Only show for authenticated and approved users
  const canShowSearch = user && (isAdmin || userStatus === 'approved');

  // Keyboard shortcut listener
  useEffect(() => {
    if (!canShowSearch) return;

    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [canShowSearch]);

  // Fetch participants when dialog opens
  useEffect(() => {
    if (open && participants.length === 0) {
      fetchParticipants();
    }
  }, [open, participants.length]);

  const fetchParticipants = async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('public_participants')
        .select('id, name, nickname, github_username, avatar_url, role, team')
        .order('name');

      if (!error && data) {
        setParticipants(data as Participant[]);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const handlePageSelect = (href: string) => {
    runCommand(() => router.push(href));
  };

  const handleParticipantSelect = (identifier: string) => {
    runCommand(() => router.push(`/participant/${identifier}`));
  };

  const handleQuickAction = (action: string) => {
    runCommand(() => {
      switch (action) {
        case 'new-submission':
          window.open('https://github.com', '_blank');
          break;
        case 'settings':
          router.push('/my-dashboard');
          break;
        default:
          break;
      }
    });
  };

  // Don't render anything for unauthenticated users
  if (!canShowSearch) {
    return null;
  }

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-md border border-border transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search participants, pages, actions..." />
        <CommandList>
          <CommandEmpty>
            {isLoading ? 'Loading...' : 'No results found.'}
          </CommandEmpty>

          {/* Pages */}
          <CommandGroup heading="Pages">
            {PAGES.map((page) => {
              const Icon = page.icon;
              return (
                <CommandItem
                  key={page.href}
                  value={`${page.name} ${page.keywords.join(' ')}`}
                  onSelect={() => handlePageSelect(page.href)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{page.name}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          {/* Participants */}
          {participants.length > 0 && (
            <CommandGroup heading="Participants">
              {participants.slice(0, 10).map((participant) => (
                <CommandItem
                  key={participant.id}
                  value={`${participant.name} ${participant.nickname || ''} ${participant.github_username || ''} ${participant.role} ${participant.team}`}
                  onSelect={() => handleParticipantSelect(participant.nickname || participant.id)}
                  className="flex items-center gap-3"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={participant.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {participant.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{participant.name}</span>
                    <span className="text-muted-foreground ml-2">
                      @{participant.nickname || participant.github_username || 'no-username'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {participant.role}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      {participant.team}
                    </Badge>
                  </div>
                </CommandItem>
              ))}
              {participants.length > 10 && (
                <CommandItem
                  value="show-all-participants"
                  onSelect={() => handlePageSelect('/leaderboard')}
                  className="text-muted-foreground"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  <span>Show all {participants.length} participants...</span>
                </CommandItem>
              )}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* Quick Actions */}
          <CommandGroup heading="Actions">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <CommandItem
                  key={action.action}
                  value={`${action.name} ${action.description}`}
                  onSelect={() => handleQuickAction(action.action)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{action.name}</span>
                  <CommandShortcut>{action.description}</CommandShortcut>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
              ↑↓
            </kbd>
            <span>navigate</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
              ↵
            </kbd>
            <span>select</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
              esc
            </kbd>
            <span>close</span>
          </div>
        </div>
      </CommandDialog>
    </>
  );
}
