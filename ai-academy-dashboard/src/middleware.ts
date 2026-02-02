import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { logSecurityEvent, generateCorrelationId } from '@/lib/logger';

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Rate limits for different endpoint types
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Public registration - strict limit
  '/api/register': { windowMs: 60 * 1000, maxRequests: 5 }, // 5 per minute
  // Review endpoints - moderate limit
  '/api/review': { windowMs: 60 * 1000, maxRequests: 30 }, // 30 per minute
  '/api/bulk-review': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
  // Content endpoints - generous limit
  '/api/content': { windowMs: 60 * 1000, maxRequests: 60 }, // 60 per minute
  // Default for other API routes
  default: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute
};

// ============================================================================
// In-Memory Rate Limit Store
// NOTE: In production with multiple instances, use Redis instead
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Map: IP -> endpoint -> rate limit data
const rateLimitStore = new Map<string, Map<string, RateLimitEntry>>();

// Clean up expired entries periodically
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [ip, endpoints] of rateLimitStore.entries()) {
    for (const [endpoint, entry] of endpoints.entries()) {
      if (entry.resetTime < now) {
        endpoints.delete(endpoint);
      }
    }
    if (endpoints.size === 0) {
      rateLimitStore.delete(ip);
    }
  }
}

// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 60 * 1000);
}

function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Check for exact match first
  if (RATE_LIMITS[pathname]) {
    return RATE_LIMITS[pathname];
  }
  // Check for prefix match
  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (pattern !== 'default' && pathname.startsWith(pattern)) {
      return config;
    }
  }
  return RATE_LIMITS.default;
}

function checkRateLimit(ip: string, endpoint: string): { allowed: boolean; remaining: number; resetTime: number } {
  const config = getRateLimitConfig(endpoint);
  const now = Date.now();

  // Get or create IP entry
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, new Map());
  }
  const ipStore = rateLimitStore.get(ip)!;

  // Get or create endpoint entry
  let entry = ipStore.get(endpoint);
  if (!entry || entry.resetTime < now) {
    entry = { count: 0, resetTime: now + config.windowMs };
    ipStore.set(endpoint, entry);
  }

  // Increment count
  entry.count++;

  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return { allowed, remaining, resetTime: entry.resetTime };
}

// ============================================================================
// Client IP Extraction
// ============================================================================

function getClientIp(request: NextRequest): string {
  // Check Vercel/Cloudflare headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback
  return '127.0.0.1';
}

// ============================================================================
// Security Headers
// ============================================================================

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent XSS attacks
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

// ============================================================================
// Supabase Session Refresh
// ============================================================================

async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Create a response that we'll modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing, just continue without session refresh
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update request cookies
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Create new response with updated request
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          // Set cookies on the response
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This refreshes the session if expired - REQUIRED for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  await supabase.auth.getUser();

  return response;
}

// ============================================================================
// Middleware Function
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware completely for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Generate correlation ID for request tracing
  const correlationId = generateCorrelationId();

  // IMPORTANT: Refresh Supabase session for ALL routes (pages and API)
  // This ensures the session cookie is refreshed before it expires
  let response = await updateSession(request);

  // Get client IP for rate limiting
  const clientIp = getClientIp(request);

  // Apply rate limiting only to API routes (not pages)
  if (pathname.startsWith('/api')) {
    // Skip rate limiting for cron jobs (they have their own auth)
    if (pathname.startsWith('/api/cron')) {
      response.headers.set('X-Correlation-Id', correlationId);
      return addSecurityHeaders(response);
    }

    const { allowed, remaining, resetTime } = checkRateLimit(clientIp, pathname);

    if (!allowed) {
      logSecurityEvent('rate_limited', {
        ip: clientIp,
        path: pathname,
        correlationId,
      });

      const errorResponse = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Please wait before making more requests',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        },
        { status: 429 }
      );

      errorResponse.headers.set('Retry-After', String(Math.ceil((resetTime - Date.now()) / 1000)));
      errorResponse.headers.set('X-RateLimit-Remaining', '0');
      errorResponse.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
      errorResponse.headers.set('X-Correlation-Id', correlationId);

      return addSecurityHeaders(errorResponse);
    }

    // Add rate limit headers to successful API responses
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
  }

  // Add correlation ID and security headers to all responses
  response.headers.set('X-Correlation-Id', correlationId);
  return addSecurityHeaders(response);
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
