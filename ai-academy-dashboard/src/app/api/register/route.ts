import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import { registerSchema, validateInput, formatValidationErrors } from '@/lib/validation';
import { logger, logApiRequest } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = request.headers.get('x-correlation-id') || undefined;

  try {
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

    const { github_username, name, email, role, team, stream, avatar_url } = validation.data;

    const supabase = createServiceSupabaseClient();

    // Check if username or email already exists
    const { data: existing } = await supabase
      .from('participants')
      .select('id')
      .or(`github_username.eq.${github_username},email.eq.${email}`)
      .single();

    if (existing) {
      logger.info('Registration attempt with existing credentials', {
        correlationId,
        github_username,
        email,
      });
      logApiRequest('POST', '/api/register', 409, Date.now() - startTime, { correlationId });
      return NextResponse.json(
        { error: 'Username or email already registered' },
        { status: 409 }
      );
    }

    // Use provided avatar_url or fetch from GitHub
    let avatarUrl = avatar_url || null;
    if (!avatarUrl) {
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

    // Insert participant
    const { data: participant, error } = await supabase
      .from('participants')
      .insert({
        github_username,
        name,
        email,
        role,
        team,
        stream,
        avatar_url: avatarUrl,
        repo_url: `https://github.com/${github_username}/ai-academy-2026`,
      })
      .select()
      .single();

    if (error) {
      logger.error('Registration failed', { correlationId, github_username }, error as Error);
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
      github_username,
      role,
      team,
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
