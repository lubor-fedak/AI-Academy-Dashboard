import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { registerSchema, validateInput, formatValidationErrors } from '@/lib/validation';
import { logger, logApiRequest, logSecurityEvent } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = request.headers.get('x-correlation-id') || undefined;

  try {
    // Security: Require authentication for registration
    // Users must first authenticate via OAuth (GitHub) before registering as participants
    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      logSecurityEvent('registration_unauthenticated', {
        correlationId,
        reason: authError?.message || 'No authenticated session',
      });
      logApiRequest('POST', '/api/register', 401, Date.now() - startTime, { correlationId });
      return NextResponse.json(
        { error: 'Authentication required. Please sign in first.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = validateInput(registerSchema, body);
    if (!validation.success) {
      logger.warn('Registration validation failed', {
        correlationId,
        errors: validation.errors,
      });
      logApiRequest('POST', '/api/register', 400, Date.now() - startTime, { correlationId });
      return NextResponse.json(
        { error: 'Validation failed', details: formatValidationErrors(validation.errors) },
        { status: 400 }
      );
    }

    const { github_username, name, nickname, email, role, team, stream, avatar_url, auth_user_id } = validation.data;

    // Security: If auth_user_id is provided, it MUST match the authenticated user
    // This prevents users from registering on behalf of others
    if (auth_user_id && auth_user_id !== user.id) {
      logSecurityEvent('registration_id_mismatch', {
        correlationId,
        providedId: auth_user_id,
        actualId: user.id,
      });
      logApiRequest('POST', '/api/register', 403, Date.now() - startTime, { correlationId });
      return NextResponse.json(
        { error: 'auth_user_id does not match authenticated user' },
        { status: 403 }
      );
    }

    // Security: Email must match authenticated user's email (if available)
    if (user.email && email !== user.email) {
      logSecurityEvent('registration_email_mismatch', {
        correlationId,
        providedEmail: email,
        actualEmail: user.email,
      });
      logApiRequest('POST', '/api/register', 403, Date.now() - startTime, { correlationId });
      return NextResponse.json(
        { error: 'Email must match your authenticated account email' },
        { status: 403 }
      );
    }

    const supabase = createServiceSupabaseClient();

    // Build duplicate check query - only check github if provided
    let duplicateQuery = supabase
      .from('participants')
      .select('id')
      .eq('email', email);

    if (github_username) {
      duplicateQuery = supabase
        .from('participants')
        .select('id')
        .or(`github_username.eq.${github_username},email.eq.${email}`);
    }

    const { data: existing } = await duplicateQuery.single();

    if (existing) {
      logger.info('Registration attempt with existing credentials', {
        correlationId,
        github_username,
        email,
      });
      logApiRequest('POST', '/api/register', 409, Date.now() - startTime, { correlationId });
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Use provided avatar_url or fetch from GitHub if github_username provided
    let avatarUrl = avatar_url || null;
    if (!avatarUrl && github_username) {
      try {
        const ghResponse = await fetch(`https://api.github.com/users/${github_username}`);
        if (ghResponse.ok) {
          const ghData = await ghResponse.json();
          avatarUrl = ghData.avatar_url;
        }
      } catch {
        // Ignore avatar fetch errors
      }
    }

    // Generate default avatar if none provided (using nickname initials)
    if (!avatarUrl) {
      // Use UI Avatars service for default avatar based on name
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
      avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&size=200`;
    }

    // Build insert object
    // Role, team, stream are NULL during registration - users set them later from profile
    const insertData: Record<string, unknown> = {
      github_username: github_username || null,
      name,
      email,
      role: role || null,  // NULL = not yet assigned
      team: team || null,  // NULL = not yet joined a team
      stream: stream || null,  // NULL = not yet selected
      avatar_url: avatarUrl,
      repo_url: github_username ? `https://github.com/${github_username}/ai-academy-2026` : null,
      status: 'approved',  // Immediate access - no admin approval needed
    };

    // Add new fields if provided (they may fail if columns don't exist yet)
    if (nickname) insertData.nickname = nickname;
    // Always use the authenticated user's ID for auth_user_id
    insertData.auth_user_id = user.id;

    // Insert participant
    const { data: participant, error } = await supabase
      .from('participants')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      logger.error('Registration failed', { correlationId, email }, error as Error);
      logApiRequest('POST', '/api/register', 500, Date.now() - startTime, { correlationId });
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 500 }
      );
    }

    // Initialize leaderboard entry
    await supabase.from('leaderboard').insert({
      participant_id: participant.id,
      total_points: 0,
      total_submissions: 0,
      on_time_submissions: 0,
      current_streak: 0,
      rank: null,
    });

    // Initialize participant mastery
    await supabase.from('participant_mastery').insert({
      participant_id: participant.id,
      mastery_level: 1,
      clearance: 'RECRUIT',
      days_completed: 0,
      artifacts_submitted: 0,
      ai_tutor_sessions: 0,
      peer_assists_given: 0,
    });

    logger.info('New participant registered', {
      correlationId,
      participantId: participant.id,
      nickname,
      email,
      role: role || 'unassigned',
      team: team || 'unassigned',
      hasGitHub: !!github_username,
    });

    logApiRequest('POST', '/api/register', 200, Date.now() - startTime, { correlationId });
    return NextResponse.json({
      success: true,
      participant_id: participant.id,
    });
  } catch (error) {
    logger.error('Registration error', { correlationId }, error as Error);
    logApiRequest('POST', '/api/register', 500, Date.now() - startTime, { correlationId });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
