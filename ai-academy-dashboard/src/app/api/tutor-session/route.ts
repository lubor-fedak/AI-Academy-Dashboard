import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';

// Validation schema for tutor session
const tutorSessionSchema = z.object({
  participant_id: z.string().uuid(),
  day_number: z.number().int().min(1).max(25),
  role_context: z.string().optional().nullable(),
  message_count: z.number().int().min(0).optional(),
  question_count: z.number().int().min(0).optional(),
  session_duration_minutes: z.number().int().min(0).optional(),
  depth_score: z.number().int().min(1).max(5).optional(),
  iteration_count: z.number().int().min(0).optional(),
  topic: z.string().optional(),
  insights_captured: z.array(z.string()).optional(),
  tutor_model: z.string().optional(),
});

// Validation schema for role expo interaction
const roleExpoInteractionSchema = z.object({
  participant_id: z.string().uuid(),
  role_code: z.enum(['AI-PM', 'FDE', 'AI-SE', 'AI-DA', 'AI-DS', 'AI-SEC', 'AI-FE']),
  interaction_type: z.enum(['mini_challenge', 'ai_tutor', 'reflection']),
  notes: z.string().optional(),
});

/**
 * POST /api/tutor-session
 * Log an AI Tutor session for a participant
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'session', ...data } = body;

    const supabase = createServiceSupabaseClient();

    // Handle different types of tracking
    if (type === 'role_expo') {
      // Track Role Expo interaction (Day 4)
      const validation = roleExpoInteractionSchema.safeParse(data);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.flatten() },
          { status: 400 }
        );
      }

      const { data: interaction, error } = await supabase
        .from('role_expo_interactions')
        .upsert({
          participant_id: validation.data.participant_id,
          role_code: validation.data.role_code,
          interaction_type: validation.data.interaction_type,
          notes: validation.data.notes || null,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'participant_id,role_code,interaction_type',
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to log role expo interaction:', error);
        return NextResponse.json(
          { error: 'Failed to log interaction' },
          { status: 500 }
        );
      }

      // Check how many roles this participant has now explored
      const { data: roleCount } = await supabase
        .from('role_expo_interactions')
        .select('role_code')
        .eq('participant_id', validation.data.participant_id);

      const uniqueRoles = new Set(roleCount?.map(r => r.role_code) || []);

      return NextResponse.json({
        success: true,
        interaction,
        roles_explored: uniqueRoles.size,
        all_roles_complete: uniqueRoles.size >= 8,
      });

    } else {
      // Track regular tutor session
      const validation = tutorSessionSchema.safeParse(data);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.flatten() },
          { status: 400 }
        );
      }

      const { data: session, error } = await supabase
        .from('tutor_sessions')
        .upsert({
          participant_id: validation.data.participant_id,
          session_date: new Date().toISOString().split('T')[0],
          day_number: validation.data.day_number,
          role_context: validation.data.role_context || null,
          message_count: validation.data.message_count || 0,
          question_count: validation.data.question_count || 0,
          session_duration_minutes: validation.data.session_duration_minutes,
          depth_score: validation.data.depth_score,
          iteration_count: validation.data.iteration_count || 0,
          topic: validation.data.topic,
          insights_captured: validation.data.insights_captured || [],
          tutor_model: validation.data.tutor_model,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'participant_id,session_date,day_number,role_context',
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to log tutor session:', error);
        return NextResponse.json(
          { error: 'Failed to log session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        session,
      });
    }

  } catch (error) {
    console.error('Tutor session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tutor-session?participant_id=xxx
 * Get tutor session history for a participant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');
    const dayNumber = searchParams.get('day');

    if (!participantId) {
      return NextResponse.json(
        { error: 'participant_id is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();

    // Build query
    let query = supabase
      .from('tutor_sessions')
      .select('*')
      .eq('participant_id', participantId)
      .order('session_date', { ascending: false });

    if (dayNumber) {
      query = query.eq('day_number', parseInt(dayNumber));
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Failed to fetch tutor sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    // Also get role expo interactions
    const { data: roleInteractions } = await supabase
      .from('role_expo_interactions')
      .select('*')
      .eq('participant_id', participantId)
      .order('completed_at', { ascending: false });

    // Calculate summary stats
    const totalSessions = sessions?.length || 0;
    const totalMessages = sessions?.reduce((sum, s) => sum + (s.message_count || 0), 0) || 0;
    const totalQuestions = sessions?.reduce((sum, s) => sum + (s.question_count || 0), 0) || 0;
    const avgDepthScore = sessions?.length
      ? sessions.reduce((sum, s) => sum + (s.depth_score || 0), 0) / sessions.filter(s => s.depth_score).length
      : 0;

    return NextResponse.json({
      sessions,
      role_interactions: roleInteractions || [],
      summary: {
        total_sessions: totalSessions,
        total_messages: totalMessages,
        total_questions: totalQuestions,
        avg_depth_score: avgDepthScore.toFixed(2),
        roles_explored: new Set(roleInteractions?.map(r => r.role_code) || []).size,
      },
    });

  } catch (error) {
    console.error('Fetch tutor sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
