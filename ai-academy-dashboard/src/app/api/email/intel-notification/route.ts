import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, getIntelDropNotificationEmail } from '@/lib/email';
import { requireAdmin } from '@/lib/api-auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

interface IntelDrop {
  id: string;
  title: string;
  content: string;
  classification: 'INFO' | 'ALERT' | 'URGENT' | 'CLASSIFIED';
  day: number;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  email_notifications: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint can only be called by admins or from internal cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Check if this is an internal cron call
    let isInternalCall = false;
    if (cronSecret && authHeader) {
      const expectedAuth = `Bearer ${cronSecret}`;
      if (authHeader.length === expectedAuth.length &&
          crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))) {
        isInternalCall = true;
      }
    }

    // If not internal call, require admin authentication
    if (!isInternalCall) {
      const authResult = await requireAdmin(request);
      if (!authResult.authenticated) {
        return authResult.response;
      }
    }

    const { intelDropId } = await request.json();

    if (!intelDropId) {
      return NextResponse.json({ error: 'Intel Drop ID is required' }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(intelDropId)) {
      return NextResponse.json({ error: 'Invalid Intel Drop ID format' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Fetch the Intel Drop
    const { data: intelDrop, error: intelError } = await supabase
      .from('intel_drops')
      .select('id, title, content, classification, day')
      .eq('id', intelDropId)
      .single();

    if (intelError || !intelDrop) {
      return NextResponse.json({ error: 'Intel Drop not found' }, { status: 404 });
    }

    const intel = intelDrop as IntelDrop;

    // Get all participants who have email notifications enabled
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('id, name, email, email_notifications')
      .eq('email_notifications', true)
      .not('email', 'is', null);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
    }

    const results = {
      total: participants?.length ?? 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send email to each participant
    for (const participant of (participants as Participant[]) || []) {
      if (!participant.email) continue;

      try {
        const emailContent = getIntelDropNotificationEmail({
          participantName: participant.name,
          intelTitle: intel.title,
          intelClassification: intel.classification,
          intelPreview: intel.content.substring(0, 150) + (intel.content.length > 150 ? '...' : ''),
        });

        const result = await sendEmail({
          to: participant.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });

        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`${participant.email}: ${result.error}`);
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`${participant.email}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    console.log(`Intel notification sent: ${results.sent}/${results.total} successful`);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Intel notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to trigger notification for all unreleased intel drops that should be released
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security - FAIL CLOSED
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Security: ALWAYS require CRON_SECRET - fail closed if not configured
    if (!cronSecret) {
      console.error('[Intel Notification] CRON_SECRET not configured - rejecting request');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Use timing-safe comparison to prevent timing attacks
    const expectedAuth = `Bearer ${cronSecret}`;
    if (!authHeader || authHeader.length !== expectedAuth.length ||
        !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Find intel drops that were just released and haven't had notifications sent
    // We'll use a metadata field to track if notification was sent
    const { data: recentlyReleased, error: fetchError } = await supabase
      .from('intel_drops')
      .select('id, title, classification, released_at, notification_sent')
      .eq('is_released', true)
      .eq('notification_sent', false)
      .not('released_at', 'is', null);

    if (fetchError) {
      console.error('Error fetching released intel:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch intel drops' }, { status: 500 });
    }

    if (!recentlyReleased || recentlyReleased.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new intel drops to notify about',
        processed: 0,
      });
    }

    const results = [];

    for (const intel of recentlyReleased) {
      // Send notifications for this intel drop
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/intel-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intelDropId: intel.id }),
      });

      const result = await response.json();

      // Mark as notification sent
      await supabase
        .from('intel_drops')
        .update({ notification_sent: true })
        .eq('id', intel.id);

      results.push({
        intelId: intel.id,
        title: intel.title,
        ...result,
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Intel notification cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
