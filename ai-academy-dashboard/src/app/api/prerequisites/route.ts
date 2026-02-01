import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';

// Validation schema for updating prerequisite status
const updatePrerequisiteSchema = z.object({
  participant_id: z.string().uuid(),
  prerequisite_id: z.number().int().positive(),
  is_completed: z.boolean(),
  notes: z.string().optional().nullable(),
});

// Batch update schema
const batchUpdateSchema = z.object({
  participant_id: z.string().uuid(),
  updates: z.array(z.object({
    prerequisite_id: z.number().int().positive(),
    is_completed: z.boolean(),
  })),
});

/**
 * GET /api/prerequisites
 * Get prerequisites for a participant or all stats for admin
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');
    const viewType = searchParams.get('view'); // 'items', 'stats', 'summary'

    const supabase = createServiceSupabaseClient();

    // Get all prerequisite items
    if (viewType === 'items' || !participantId) {
      const { data: items, error } = await supabase
        .from('prerequisite_items')
        .select('*')
        .order('display_order');

      if (error) {
        console.error('Failed to fetch prerequisite items:', error);
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
      }

      return NextResponse.json({ items });
    }

    // Get admin stats view
    if (viewType === 'stats') {
      const { data: stats, error: statsError } = await supabase
        .from('prerequisite_stats')
        .select('*');

      if (statsError) {
        console.error('Failed to fetch prerequisite stats:', statsError);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
      }

      // Get participant summary
      const { data: summary, error: summaryError } = await supabase
        .from('participant_prerequisites_summary')
        .select('*');

      if (summaryError) {
        console.error('Failed to fetch participant summary:', summaryError);
        return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
      }

      // Calculate overall stats
      const totalParticipants = summary?.length || 0;
      const fullyReady = summary?.filter(p => p.required_completion_pct === 100).length || 0;
      const partiallyReady = summary?.filter(p =>
        p.required_completion_pct !== null &&
        p.required_completion_pct > 0 &&
        p.required_completion_pct < 100
      ).length || 0;
      const notStarted = summary?.filter(p =>
        p.required_completion_pct === null || p.required_completion_pct === 0
      ).length || 0;

      return NextResponse.json({
        stats,
        summary,
        overview: {
          total_participants: totalParticipants,
          fully_ready: fullyReady,
          partially_ready: partiallyReady,
          not_started: notStarted,
          readiness_pct: totalParticipants > 0
            ? Math.round((fullyReady / totalParticipants) * 100)
            : 0,
        },
      });
    }

    // Get prerequisites for specific participant
    if (participantId) {
      // Get all items with participant's completion status
      const { data: items, error: itemsError } = await supabase
        .from('prerequisite_items')
        .select('*')
        .order('display_order');

      if (itemsError) {
        console.error('Failed to fetch prerequisite items:', itemsError);
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
      }

      const { data: completions, error: completionsError } = await supabase
        .from('participant_prerequisites')
        .select('*')
        .eq('participant_id', participantId);

      if (completionsError) {
        console.error('Failed to fetch participant prerequisites:', completionsError);
        return NextResponse.json({ error: 'Failed to fetch completions' }, { status: 500 });
      }

      // Merge items with completion status
      const completionMap = new Map(
        completions?.map(c => [c.prerequisite_id, c]) || []
      );

      const prerequisitesWithStatus = items?.map(item => ({
        ...item,
        is_completed: completionMap.get(item.id)?.is_completed || false,
        completed_at: completionMap.get(item.id)?.completed_at || null,
        notes: completionMap.get(item.id)?.notes || null,
      })) || [];

      // Calculate summary
      const requiredItems = prerequisitesWithStatus.filter(p => p.is_required);
      const requiredCompleted = requiredItems.filter(p => p.is_completed).length;
      const totalCompleted = prerequisitesWithStatus.filter(p => p.is_completed).length;

      return NextResponse.json({
        prerequisites: prerequisitesWithStatus,
        summary: {
          required_total: requiredItems.length,
          required_completed: requiredCompleted,
          required_completion_pct: requiredItems.length > 0
            ? Math.round((requiredCompleted / requiredItems.length) * 100)
            : 0,
          total_items: prerequisitesWithStatus.length,
          total_completed: totalCompleted,
          total_completion_pct: prerequisitesWithStatus.length > 0
            ? Math.round((totalCompleted / prerequisitesWithStatus.length) * 100)
            : 0,
          is_ready: requiredCompleted === requiredItems.length,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  } catch (error) {
    console.error('Prerequisites fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/prerequisites
 * Update a prerequisite completion status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'single', ...data } = body;

    const supabase = createServiceSupabaseClient();

    if (type === 'batch') {
      // Batch update
      const validation = batchUpdateSchema.safeParse(data);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.flatten() },
          { status: 400 }
        );
      }

      const { participant_id, updates } = validation.data;

      // Upsert all updates
      const upsertData = updates.map(update => ({
        participant_id,
        prerequisite_id: update.prerequisite_id,
        is_completed: update.is_completed,
        completed_at: update.is_completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('participant_prerequisites')
        .upsert(upsertData, {
          onConflict: 'participant_id,prerequisite_id',
        });

      if (error) {
        console.error('Failed to batch update prerequisites:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
      }

      return NextResponse.json({ success: true, updated: updates.length });

    } else {
      // Single update
      const validation = updatePrerequisiteSchema.safeParse(data);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.flatten() },
          { status: 400 }
        );
      }

      const { participant_id, prerequisite_id, is_completed, notes } = validation.data;

      const { data: result, error } = await supabase
        .from('participant_prerequisites')
        .upsert({
          participant_id,
          prerequisite_id,
          is_completed,
          completed_at: is_completed ? new Date().toISOString() : null,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'participant_id,prerequisite_id',
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to update prerequisite:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
      }

      return NextResponse.json({ success: true, prerequisite: result });
    }

  } catch (error) {
    console.error('Prerequisites update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
