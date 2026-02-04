import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/live-session/[code]/participants - Get list of participants
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabaseClient();

    // Security: Require authentication to view participant list
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get session
    const { data: session } = await supabase
      .from('live_sessions')
      .select('id')
      .eq('join_code', code.toUpperCase())
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get participants
    const { data: participants, error } = await supabase
      .from('live_session_participants')
      .select(`
        id,
        is_active,
        joined_at,
        participants(id, name, avatar_url, role)
      `)
      .eq('session_id', session.id)
      .eq('is_active', true)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Get participants error:', error);
      return NextResponse.json({ error: 'Failed to get participants' }, { status: 500 });
    }

    return NextResponse.json({
      participants: participants?.map((p) => {
        // Type assertion for the participant relation (single object from foreign key)
        const participant = p.participants as unknown as { id: string; name: string; avatar_url: string | null; role: string } | null;
        return {
          id: p.id,
          participant_id: participant?.id,
          name: participant?.name || 'Unknown',
          avatar_url: participant?.avatar_url,
          role: participant?.role,
          joined_at: p.joined_at,
          is_active: p.is_active,
        };
      }) || [],
    });
  } catch (error) {
    console.error('Get participants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/live-session/[code]/participants - Join session
export async function POST(
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
      .select('id, name')
      .eq('email', user.email)
      .single();

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Get session
    const { data: session } = await supabase
      .from('live_sessions')
      .select('id, is_active')
      .eq('join_code', code.toUpperCase())
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!session.is_active) {
      return NextResponse.json({ error: 'Session has ended' }, { status: 400 });
    }

    // Check if already joined
    const { data: existing } = await supabase
      .from('live_session_participants')
      .select('id, is_active')
      .eq('session_id', session.id)
      .eq('participant_id', participant.id)
      .single();

    if (existing) {
      // Re-activate if previously left
      if (!existing.is_active) {
        await supabase
          .from('live_session_participants')
          .update({ is_active: true, left_at: null })
          .eq('id', existing.id);
      }
      return NextResponse.json({ success: true, message: 'Already joined' });
    }

    // Join session
    const { error } = await supabase
      .from('live_session_participants')
      .insert({
        session_id: session.id,
        participant_id: participant.id,
        is_active: true,
      });

    if (error) {
      console.error('Join session error:', error);
      return NextResponse.json({ error: 'Failed to join session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Join session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/live-session/[code]/participants - Leave session
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

    // Get session
    const { data: session } = await supabase
      .from('live_sessions')
      .select('id')
      .eq('join_code', code.toUpperCase())
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Leave session
    const { error } = await supabase
      .from('live_session_participants')
      .update({
        is_active: false,
        left_at: new Date().toISOString(),
      })
      .eq('session_id', session.id)
      .eq('participant_id', participant.id);

    if (error) {
      console.error('Leave session error:', error);
      return NextResponse.json({ error: 'Failed to leave session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Leave session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
