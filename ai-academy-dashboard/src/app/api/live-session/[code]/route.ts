import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/live-session/[code] - Get session state
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabaseClient();

    // Security: Require authentication to view session details
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: session, error } = await supabase
      .from('live_sessions')
      .select(`
        *,
        mission_days(id, day, title, subtitle, briefing_content, resources_content, tech_skills_focus),
        participants:instructor_id(name, avatar_url)
      `)
      .eq('join_code', code.toUpperCase())
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get participant count
    const { count } = await supabase
      .from('live_session_participants')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id)
      .eq('is_active', true);

    return NextResponse.json({
      session: {
        id: session.id,
        join_code: session.join_code,
        current_step: session.current_step,
        current_section: session.current_section,
        is_active: session.is_active,
        started_at: session.started_at,
        ended_at: session.ended_at,
        mission_day: session.mission_days,
        instructor: session.participants,
        participant_count: count || 0,
      },
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/live-session/[code] - Update session (step/section)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get participant
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Get session and verify instructor
    const { data: session } = await supabase
      .from('live_sessions')
      .select('id, instructor_id, is_active')
      .eq('join_code', code.toUpperCase())
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.instructor_id !== participant.id) {
      return NextResponse.json({ error: 'Only the instructor can control the session' }, { status: 403 });
    }

    if (!session.is_active) {
      return NextResponse.json({ error: 'Session has ended' }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { step, section, action } = body;

    const updates: Record<string, unknown> = {};

    if (step !== undefined) {
      updates.current_step = step;
    }

    if (section !== undefined) {
      const validSections = ['briefing', 'resources', 'lab', 'debrief'];
      if (!validSections.includes(section)) {
        return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
      }
      updates.current_section = section;
    }

    // Handle special actions
    if (action === 'next_step') {
      const { data: currentSession } = await supabase
        .from('live_sessions')
        .select('current_step')
        .eq('id', session.id)
        .single();
      updates.current_step = (currentSession?.current_step || 0) + 1;
    } else if (action === 'prev_step') {
      const { data: currentSession } = await supabase
        .from('live_sessions')
        .select('current_step')
        .eq('id', session.id)
        .single();
      updates.current_step = Math.max(1, (currentSession?.current_step || 1) - 1);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    // Update session
    const { data: updatedSession, error } = await supabase
      .from('live_sessions')
      .update(updates)
      .eq('id', session.id)
      .select()
      .single();

    if (error) {
      console.error('Update session error:', error);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      session: {
        current_step: updatedSession.current_step,
        current_section: updatedSession.current_section,
      },
    });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/live-session/[code] - End session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get participant
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Get session and verify instructor
    const { data: session } = await supabase
      .from('live_sessions')
      .select('id, instructor_id')
      .eq('join_code', code.toUpperCase())
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.instructor_id !== participant.id) {
      return NextResponse.json({ error: 'Only the instructor can end the session' }, { status: 403 });
    }

    // End session
    const { error } = await supabase
      .from('live_sessions')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (error) {
      console.error('End session error:', error);
      return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
    }

    // Mark all participants as inactive
    await supabase
      .from('live_session_participants')
      .update({ is_active: false, left_at: new Date().toISOString() })
      .eq('session_id', session.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('End session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
