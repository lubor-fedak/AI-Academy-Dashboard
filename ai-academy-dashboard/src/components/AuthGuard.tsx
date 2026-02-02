'use client';

import { useEffect } from 'react';
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
  '/admin/users',
];

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, isAdmin, userStatus, participant } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname) ||
      PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
    const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some(route => pathname.startsWith(route));
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

    // Not logged in
    if (!user) {
      if (!isPublicRoute) {
        router.push('/login');
      }
      return;
    }

    // Logged in but checking status...

    // Admin routes - require admin status
    if (isAdminRoute && !isAdmin) {
      router.push('/');
      return;
    }

    // User is admin - allow everywhere
    if (isAdmin) {
      // If admin is on pending page, redirect to admin panel
      if (pathname === '/pending') {
        router.push('/admin/users');
      }
      return;
    }

    // User has no profile yet - send to onboarding
    if (userStatus === 'no_profile') {
      if (pathname !== '/onboarding' && !isPublicRoute) {
        router.push('/onboarding');
      }
      return;
    }

    // User is pending approval
    if (userStatus === 'pending') {
      if (pathname !== '/pending' && !isPublicRoute && !isAuthOnlyRoute) {
        router.push('/pending');
      }
      return;
    }

    // User is rejected
    if (userStatus === 'rejected') {
      if (pathname !== '/pending' && !isPublicRoute) {
        router.push('/pending');
      }
      return;
    }

    // User is approved - if on login/pending page, redirect to dashboard
    if (userStatus === 'approved') {
      if (pathname === '/login' || pathname === '/pending') {
        router.push('/my-dashboard');
      }
      return;
    }
  }, [user, isLoading, isAdmin, userStatus, pathname, router, participant]);

  // Show loading state
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

  // Check access
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some(route => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  // Not logged in - only show public routes
  if (!user && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
      </div>
    );
  }

  // Admin routes require admin
  if (isAdminRoute && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
      </div>
    );
  }

  // Pending/rejected users can only access auth-only and public routes
  if (user && !isAdmin && (userStatus === 'pending' || userStatus === 'rejected' || userStatus === 'no_profile')) {
    if (!isPublicRoute && !isAuthOnlyRoute) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
        </div>
      );
    }
  }

  return <>{children}</>;
}
