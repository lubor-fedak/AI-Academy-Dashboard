'use client';

import { useEffect, useState, useRef } from 'react';
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

// Routes that are public but checked by prefix (not exact match)
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

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, isAdmin, userStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Track if we should redirect - with delay to avoid flash redirects
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate route types
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some(route => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  // Handle redirects with delay
  useEffect(() => {
    // Clear any pending redirect timer
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    // Reset redirect state on pathname change
    setShouldRedirect(false);

    // Public routes - no redirect needed
    if (isPublicRoute) return;

    // Still loading - wait
    if (isLoading) return;

    // User is logged in - handle status-based redirects
    if (user) {
      // Admin routes require admin
      if (isAdminRoute && !isAdmin) {
        router.push('/');
        return;
      }

      // Admin can access everything
      if (isAdmin) {
        if (pathname === '/pending') {
          router.push('/admin/users');
        }
        return;
      }

      // User has no profile - send to onboarding
      if (userStatus === 'no_profile') {
        if (pathname !== '/onboarding') {
          router.push('/onboarding');
        }
        return;
      }

      // User is pending approval
      if (userStatus === 'pending') {
        if (pathname !== '/pending' && !isAuthOnlyRoute) {
          router.push('/pending');
        }
        return;
      }

      // User is rejected
      if (userStatus === 'rejected') {
        if (pathname !== '/pending') {
          router.push('/pending');
        }
        return;
      }

      // User is approved - redirect away from login/pending
      if (userStatus === 'approved') {
        if (pathname === '/login' || pathname === '/pending') {
          router.push('/my-dashboard');
        }
      }
      return;
    }

    // Not logged in - but wait 2 seconds before redirecting
    // This gives time for session to be restored after page navigation
    redirectTimerRef.current = setTimeout(() => {
      setShouldRedirect(true);
    }, 2000);

    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, [user, isLoading, isAdmin, userStatus, pathname, router, isPublicRoute, isAuthOnlyRoute, isAdminRoute]);

  // Actually redirect when shouldRedirect becomes true
  useEffect(() => {
    if (shouldRedirect && !user && !isLoading && !isPublicRoute) {
      console.log('Redirecting to login - no user after timeout');
      router.push('/login');
    }
  }, [shouldRedirect, user, isLoading, isPublicRoute, router]);

  // === RENDER LOGIC ===

  // Public routes render immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Loading state
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

  // User is logged in - render based on status
  if (user) {
    // Admin routes require admin status
    if (isAdminRoute && !isAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
            <p className="text-muted-foreground">Checking permissions...</p>
          </div>
        </div>
      );
    }

    // Users without proper status can only access auth-only routes
    if (!isAdmin && (userStatus === 'pending' || userStatus === 'rejected' || userStatus === 'no_profile')) {
      if (!isAuthOnlyRoute) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
              <p className="text-muted-foreground">
                {userStatus === 'no_profile' ? 'Setting up your profile...' : 'Checking status...'}
              </p>
            </div>
          </div>
        );
      }
    }

    // All checks passed - render content
    return <>{children}</>;
  }

  // Not logged in - show waiting state (redirect will happen after 2s timeout)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    </div>
  );
}
