'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import {
  LayoutDashboard,
  Trophy,
  User,
  Grid3X3,
  BarChart3,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/leaderboard', label: 'Rank', icon: Trophy },
  { href: '/my-dashboard', label: 'Me', icon: User, requiresAuth: true },
  { href: '/progress', label: 'Matrix', icon: Grid3X3 },
  { href: '/analytics', label: 'Stats', icon: BarChart3 },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, participant, isLoading } = useAuth();

  // Hide for unauthenticated users on public pages
  const isPublicPage = pathname === '/' || pathname === '/login';
  if (!user && !isLoading && isPublicPage) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          // Show "Môj" only if participant exists, otherwise skip
          if (item.requiresAuth && !participant) {
            return null;
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors active:scale-95',
                isActive
                  ? 'text-[#0062FF]'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5 mb-1', isActive && 'stroke-[2.5]')} />
              <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-12 h-0.5 bg-[#0062FF] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
