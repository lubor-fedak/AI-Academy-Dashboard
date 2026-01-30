'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Trophy,
  Grid3X3,
  Users,
  ShieldCheck,
  UserPlus,
  User,
  LogIn,
  LogOut,
  Settings,
  Loader2,
  BarChart3,
  Menu,
  UsersRound,
} from 'lucide-react';
import { CommandPalette } from '@/components/CommandPalette';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  requiresAuth?: boolean;
  requiresApproval?: boolean;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/my-dashboard', label: 'Môj Progress', icon: User, requiresAuth: true, requiresApproval: true },
  { href: '/peer-reviews', label: 'Peer Reviews', icon: UsersRound, requiresAuth: true, requiresApproval: true },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, requiresAuth: true, requiresApproval: true },
  { href: '/progress', label: 'Progress Matrix', icon: Grid3X3, requiresAuth: true, requiresApproval: true },
  { href: '/teams', label: 'Teams', icon: Users, requiresAuth: true, requiresApproval: true },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, requiresAuth: true, requiresApproval: true },
  { href: '/admin', label: 'Submissions', icon: ShieldCheck, adminOnly: true },
  { href: '/admin/users', label: 'Používatelia', icon: Users, adminOnly: true },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, participant, isLoading, isAdmin, userStatus, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Filter nav items based on user access
  const filteredNavItems = navItems.filter((item) => {
    // Admin-only items
    if (item.adminOnly) {
      return isAdmin;
    }
    // Items requiring approval
    if (item.requiresApproval) {
      return isAdmin || userStatus === 'approved';
    }
    // Items requiring auth
    if (item.requiresAuth) {
      return !!user;
    }
    // Public items
    return true;
  });

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0062FF]">
              <span className="text-lg font-bold text-white">AI</span>
            </div>
            <span className="text-base sm:text-lg font-semibold hidden xs:inline">
              Academy
            </span>
            <span className="text-base sm:text-lg font-semibold hidden sm:inline">
              Dashboard
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#0062FF] text-white'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    item.adminOnly && 'text-orange-500 hover:text-orange-600'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side - Search, Auth & Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* Command Palette / Search */}
            <CommandPalette />

            {/* Auth Section - Always visible */}
            <div className="flex items-center">
              {isLoading ? (
                <Button variant="ghost" size="sm" disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url}
                          alt={participant?.name || user.user_metadata?.user_name}
                        />
                        <AvatarFallback>
                          {(participant?.name || user.user_metadata?.user_name || '?')
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {participant?.name || user.user_metadata?.name || 'Používateľ'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{user.user_metadata?.user_name}
                        </p>
                        {participant && (
                          <div className="flex gap-1 mt-1">
                            <span className="text-xs bg-accent px-1.5 py-0.5 rounded">
                              {participant.role}
                            </span>
                            <span className="text-xs bg-accent px-1.5 py-0.5 rounded">
                              Team {participant.team}
                            </span>
                          </div>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/my-dashboard" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Môj Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {participant && (
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/participant/${participant.github_username}`}
                          className="cursor-pointer"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Verejný profil
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {!participant && !isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/onboarding?from=github" className="cursor-pointer">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Dokončiť registráciu
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-orange-500">
                          Admin
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/users" className="cursor-pointer">
                            <Users className="mr-2 h-4 w-4" />
                            Správa používateľov
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Submissions
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="cursor-pointer text-red-500 focus:text-red-500"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Odhlásiť sa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/onboarding">
                    <Button variant="ghost" size="sm">
                      <UserPlus className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Začať</span>
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="sm" className="bg-[#0062FF] hover:bg-[#0052D9]">
                      <LogIn className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Prihlásiť</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0062FF]">
                      <span className="text-lg font-bold text-white">AI</span>
                    </div>
                    Academy Dashboard
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 flex flex-col gap-1">
                  {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobileMenu}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors active:scale-[0.98]',
                          isActive
                            ? 'bg-[#0062FF] text-white'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                          item.adminOnly && !isActive && 'text-orange-500'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                <Separator className="my-4" />

                {/* Mobile Auth Section */}
                {!user && (
                  <div className="flex flex-col gap-2">
                    <Link href="/onboarding" onClick={closeMobileMenu}>
                      <Button variant="outline" className="w-full justify-start" size="lg">
                        <UserPlus className="mr-3 h-5 w-5" />
                        Začať
                      </Button>
                    </Link>
                    <Link href="/login" onClick={closeMobileMenu}>
                      <Button className="w-full justify-start bg-[#0062FF] hover:bg-[#0052D9]" size="lg">
                        <LogIn className="mr-3 h-5 w-5" />
                        Prihlásiť sa
                      </Button>
                    </Link>
                  </div>
                )}

                {user && (
                  <div className="space-y-4">
                    {/* User Info */}
                    <div className="flex items-center gap-3 px-2">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url}
                          alt={participant?.name || user.user_metadata?.user_name}
                        />
                        <AvatarFallback>
                          {(participant?.name || user.user_metadata?.user_name || '?')
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {participant?.name || user.user_metadata?.name || 'Používateľ'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          @{user.user_metadata?.user_name}
                        </p>
                        {participant && (
                          <div className="flex gap-1 mt-1">
                            <span className="text-xs bg-accent px-1.5 py-0.5 rounded">
                              {participant.role}
                            </span>
                            <span className="text-xs bg-accent px-1.5 py-0.5 rounded">
                              {participant.team}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Link
                        href="/my-dashboard"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground active:scale-[0.98]"
                      >
                        <User className="h-5 w-5" />
                        Môj Dashboard
                      </Link>
                      {participant && (
                        <Link
                          href={`/participant/${participant.github_username}`}
                          onClick={closeMobileMenu}
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground active:scale-[0.98]"
                        >
                          <Settings className="h-5 w-5" />
                          Verejný profil
                        </Link>
                      )}
                      {!participant && (
                        <Link
                          href="/onboarding?from=github"
                          onClick={closeMobileMenu}
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground active:scale-[0.98]"
                        >
                          <UserPlus className="h-5 w-5" />
                          Dokončiť registráciu
                        </Link>
                      )}
                    </div>

                    <Separator />

                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-500 hover:text-red-500 hover:bg-red-500/10"
                      size="lg"
                      onClick={() => {
                        signOut();
                        closeMobileMenu();
                      }}
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      Odhlásiť sa
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
