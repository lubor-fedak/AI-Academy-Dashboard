import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { logSecurityEvent } from '@/lib/logger';

/**
 * API Authentication Utilities
 * Provides authentication and authorization checks for API routes
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  isAdmin: boolean;
  participantId?: string;
}

export interface AuthResult {
  authenticated: true;
  user: AuthenticatedUser;
}

export interface AuthError {
  authenticated: false;
  response: NextResponse;
}

/**
 * Verify that the request is from an authenticated user
 * Returns the user information if authenticated, or an error response
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthResult | AuthError> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      logSecurityEvent('auth_failure', {
        path: request.nextUrl.pathname,
        reason: error?.message || 'No user session',
      });

      return {
        authenticated: false,
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      };
    }

    // Get participant details
    const { data: participant } = await supabase
      .from('participants')
      .select('id, is_admin')
      .eq('email', user.email)
      .single();

    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email || '',
      isAdmin: participant?.is_admin || false,
      participantId: participant?.id,
    };

    logSecurityEvent('auth_success', {
      userId: user.id,
      path: request.nextUrl.pathname,
    });

    return {
      authenticated: true,
      user: authUser,
    };
  } catch (err) {
    logSecurityEvent('auth_failure', {
      path: request.nextUrl.pathname,
      reason: err instanceof Error ? err.message : 'Unknown error',
    });

    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Verify that the request is from an admin user
 * Returns the user information if admin, or an error response
 */
export async function requireAdmin(
  request: NextRequest
): Promise<AuthResult | AuthError> {
  const authResult = await requireAuth(request);

  if (!authResult.authenticated) {
    return authResult;
  }

  if (!authResult.user.isAdmin) {
    logSecurityEvent('forbidden', {
      userId: authResult.user.id,
      path: request.nextUrl.pathname,
      reason: 'Admin access required',
    });

    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Verify that the request is from an admin or mentor
 * Mentors have special permissions for reviews
 */
export async function requireAdminOrMentor(
  request: NextRequest
): Promise<AuthResult | AuthError> {
  const authResult = await requireAuth(request);

  if (!authResult.authenticated) {
    return authResult;
  }

  // For now, all authenticated users with participant records can review
  // In production, you'd want a separate mentor role
  if (!authResult.user.participantId && !authResult.user.isAdmin) {
    logSecurityEvent('forbidden', {
      userId: authResult.user.id,
      path: request.nextUrl.pathname,
      reason: 'Mentor or admin access required',
    });

    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Mentor or admin access required' },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Get correlation ID from request headers
 */
export function getCorrelationId(request: NextRequest): string | undefined {
  return request.headers.get('x-correlation-id') || undefined;
}
