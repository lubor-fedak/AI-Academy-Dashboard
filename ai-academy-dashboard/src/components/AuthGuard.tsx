'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Loader2 } from 'lucide-react';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/auth/callback',
  '/offline',
  '/help',
  '/register',
];

// Routes that are public but checked by prefix
const PUBLIC_PREFIXES = [
  '/presentations',
];

// Routes that only require authentication (not approval)
const AUTH_ONLY_ROUTES = [
  '/pending',
  '/onboarding',
];

// Routes that require admin access
const ADMIN_ROUTES = [
  '/admin',
];

// Check sessionStorage for auth hint
function hasStoredAuth(): boolean {
  if (typeof window === 'undefined') return false;
  return !!sessionStorage.getItem('ai-academy-auth');
}

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, isAdmin, userStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [waitCount, setWaitCount] = useState(0);

  // Calculate route types
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some(route => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  // Wait counter for redirect delay
  useEffect(() => {
    if (!isPublicRoute && !isLoading && !user) {
      // If we have stored auth, wait longer (session might be loading)
      const maxWait = hasStoredAuth() ? 5 : 3;

      if (waitCount < maxWait) {
        const timer = setTimeout(() => setWaitCount(w => w + 1), 1000);
        return () => clearTimeout(timer);
      }
    } else {
      setWaitCount(0);
    }
  }, [isPublicRoute, isLoading, user, waitCount]);

  // Handle redirects
  useEffect(() => {
    // Public routes - no redirect
    if (isPublicRoute) return;

    // Still loading - wait
    if (isLoading) return;

    // User exists - handle status redirects
    if (user) {
      if (isAdminRoute && !isAdmin) {
        router.push('/');
        return;
      }

      if (isAdmin) {
        if (pathname === '/pending') router.push('/admin/users');
        return;
      }

      if (userStatus === 'no_profile' && pathname !== '/onboarding') {
        router.push('/onboarding');
        return;
      }

      if (userStatus === 'pending' && pathname !== '/pending' && !isAuthOnlyRoute) {
        router.push('/pending');
        return;
      }

      if (userStatus === 'rejected' && pathname !== '/pending') {
        router.push('/pending');
        return;
      }

      if (userStatus === 'approved' && (pathname === '/login' || pathname === '/pending')) {
        router.push('/my-dashboard');
      }
      return;
    }

    // No user - check if we should redirect
    const maxWait = hasStoredAuth() ? 5 : 3;
    if (waitCount >= maxWait) {
      console.log('[AuthGuard] Redirecting to login after waiting', waitCount, 'seconds');
      router.push('/login');
    }
  }, [user, isLoading, isAdmin, userStatus, pathname, router, isPublicRoute, isAuthOnlyRoute, isAdminRoute, waitCount]);

  // === RENDER ===

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    if (isAdminRoute && !isAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
        </div>
      );
    }

    if (!isAdmin && (userStatus === 'pending' || userStatus === 'rejected' || userStatus === 'no_profile')) {
      if (!isAuthOnlyRoute) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
              <p className="text-muted-foreground">
                {userStatus === 'no_profile' ? 'Setting up profile...' : 'Checking status...'}
              </p>
            </div>
          </div>
        );
      }
    }

    return <>{children}</>;
  }

  // No user yet - waiting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
        <p className="text-muted-foreground">
          {hasStoredAuth() ? 'Restoring session...' : 'Checking authentication...'}
        </p>
      </div>
    </div>
  );
}
