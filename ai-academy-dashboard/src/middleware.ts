import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
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
// ============================================================================
// WARNING: This in-memory store does NOT share state across multiple instances.
// In production environments with multiple Vercel/server instances, rate limits
// won't be enforced globally - each instance maintains its own counters.
//
// For production deployments, consider:
// 1. Redis (Upstash, Redis Labs) - recommended for Vercel
// 2. Vercel Edge Config for simple use cases
// 3. Cloudflare Rate Limiting if using Cloudflare proxy
// 4. External rate limiting service (e.g., Rate Limit as a Service)
//
// The current implementation provides basic protection against single-source
// attacks but won't prevent distributed attacks across multiple instances.
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

  // HSTS - enforce HTTPS
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Content Security Policy - critical for XSS prevention
  //
  // NOTE ON 'unsafe-inline' and 'unsafe-eval':
  // These directives are required due to framework limitations:
  // - Next.js uses inline scripts for hydration and dynamic imports
  // - Clerk authentication SDK requires eval for certain operations
  // - Tailwind CSS and component libraries use inline styles
  //
  // FUTURE IMPROVEMENT: Migrate to nonce-based CSP when Next.js fully supports it:
  // 1. Generate nonce per request: const nonce = crypto.randomUUID()
  // 2. Use script-src 'nonce-${nonce}' 'strict-dynamic'
  // 3. Pass nonce to _document.tsx for script tags
  // See: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
  //
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev https://*.clerk.com https://*.kyndrylai.online https://accounts.google.com https://vercel.live https://*.vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://clerk.com https://*.clerk.accounts.dev https://*.clerk.com https://*.kyndrylai.online https://api.github.com https://accounts.google.com https://*.googleapis.com https://vercel.live https://*.vercel.live",
    "frame-src 'self' https://clerk.com https://*.clerk.accounts.dev https://*.clerk.com https://*.kyndrylai.online https://accounts.google.com https://vercel.live",
    "frame-ancestors 'none'",
    "form-action 'self' https://accounts.google.com https://*.clerk.com https://*.kyndrylai.online",
    "base-uri 'self'",
    "object-src 'none'",
  ];
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

// ============================================================================
// Public Routes Configuration
// ============================================================================

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/offline',
  '/help',
  '/register',
  '/presentations(.*)',
  // Leaderboard, progress, teams, participant - public for transparency (data is public in DB)
  '/leaderboard',
  '/progress',
  '/teams',
  '/participant(.*)',
  '/team(.*)',
  '/api/register',
  '/api/cron(.*)',
  '/api/webhook(.*)',  // GitHub webhooks - no Clerk session
  '/api/participant',  // Participant lookup (checks Clerk auth internally)
  '/api/content(.*)',  // Mission content for offline caching
]);

// ============================================================================
// Clerk Middleware with Rate Limiting and Security Headers
// ============================================================================

export default clerkMiddleware(async (auth, request) => {
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

  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Create response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
});

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
