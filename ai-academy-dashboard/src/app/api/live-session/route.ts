import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import crypto from 'crypto';

// POST /api/live-session - Create a new live session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is instructor/admin
    const { data: participant } = await supabase
      .from('participants')
      .select('id, is_admin')
      .eq('email', user.email)
      .single();

    if (!participant?.is_admin) {
      return NextResponse.json({ error: 'Only instructors can start sessions' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { mission_day_id } = body;

    if (!mission_day_id) {
      return NextResponse.json({ error: 'mission_day_id is required' }, { status: 400 });
    }

    // Validate mission_day_id is a positive integer
    const parsedDayId = parseInt(mission_day_id, 10);
    if (isNaN(parsedDayId) || parsedDayId <= 0) {
      return NextResponse.json({ error: 'mission_day_id must be a positive integer' }, { status: 400 });
    }

    // Verify the mission_day exists in the database
    const { data: missionDay, error: missionDayError } = await supabase
      .from('mission_days')
      .select('id')
      .eq('id', parsedDayId)
      .single();

    if (missionDayError || !missionDay) {
      return NextResponse.json({ error: 'Invalid mission_day_id - mission day not found' }, { status: 400 });
    }

    // Generate unique join code using cryptographically secure random
    const joinCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Create session
    const { data: session, error } = await supabase
      .from('live_sessions')
      .insert({
        instructor_id: participant.id,
        mission_day_id: parsedDayId,
        join_code: joinCode,
        current_step: 1,
        current_section: 'briefing',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create session:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        join_code: session.join_code,
        mission_day_id: session.mission_day_id,
        current_step: session.current_step,
        current_section: session.current_section,
      },
    });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
