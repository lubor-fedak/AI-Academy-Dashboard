import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Lazy initialization of Supabase admin client (bypasses RLS)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// Program start date
const PROGRAM_START = new Date('2026-02-02');

// Calculate current program day
function getCurrentProgramDay(): number {
  const today = new Date();
  const daysSinceStart = Math.floor((today.getTime() - PROGRAM_START.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceStart < 0) return 0; // Program hasn't started

  // Account for spring break (week 3: days 11-15 of calendar, but we skip)
  // Week 1: Days 1-5 (calendar days 0-4)
  // Week 2: Days 6-10 (calendar days 5-9)
  // Week 3: Spring break (calendar days 10-16)
  // Week 4: Days 11-15 (calendar days 17-21)
  // Week 5: Days 16-25 (calendar days 22-31)

  if (daysSinceStart < 5) {
    return daysSinceStart + 1; // Days 1-5
  } else if (daysSinceStart < 10) {
    return daysSinceStart + 1; // Days 6-10
  } else if (daysSinceStart < 17) {
    return 10; // Spring break - stay on day 10
  } else if (daysSinceStart < 22) {
    return daysSinceStart - 6; // Days 11-15
  } else {
    return Math.min(daysSinceStart - 6, 25); // Days 16-25
  }
}

// Parse trigger time (HH:MM format) and check if it's passed
function isTriggerTimePassed(triggerTime: string | null): boolean {
  if (!triggerTime) return true; // No trigger time means release immediately

  const [hours, minutes] = triggerTime.split(':').map(Number);
  const now = new Date();
  const triggerDate = new Date();
  triggerDate.setHours(hours, minutes, 0, 0);

  return now >= triggerDate;
}

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel cron jobs include this header) - FAIL CLOSED
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Security: ALWAYS require CRON_SECRET - fail closed if not configured
  if (!cronSecret) {
    console.error('[Intel Release Cron] CRON_SECRET not configured - rejecting request');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Use timing-safe comparison to prevent timing attacks
  // Pad both strings to same length to avoid leaking length information
  const expectedAuth = `Bearer ${cronSecret}`;
  const maxLen = Math.max(authHeader?.length || 0, expectedAuth.length);
  const paddedAuth = (authHeader || '').padEnd(maxLen, '\0');
  const paddedExpected = expectedAuth.padEnd(maxLen, '\0');

  if (!authHeader || !crypto.timingSafeEqual(Buffer.from(paddedAuth), Buffer.from(paddedExpected))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const currentDay = getCurrentProgramDay();
    const now = new Date();

    console.log(`[Intel Release Cron] Running at ${now.toISOString()}, current program day: ${currentDay}`);

    if (currentDay === 0) {
      return NextResponse.json({
        success: true,
        message: 'Program has not started yet',
        released: 0,
      });
    }

    // Find intel drops that should be released
    const { data: pendingDrops, error: fetchError } = await getSupabaseAdmin()
      .from('intel_drops')
      .select('*')
      .eq('is_released', false)
      .lte('day', currentDay);

    if (fetchError) {
      console.error('[Intel Release Cron] Fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch intel drops' }, { status: 500 });
    }

    if (!pendingDrops || pendingDrops.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No intel drops to release',
        released: 0,
      });
    }

    // Filter by trigger time
    const dropsToRelease = pendingDrops.filter((drop) => isTriggerTimePassed(drop.trigger_time));

    if (dropsToRelease.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No intel drops ready for release (trigger time not reached)',
        released: 0,
      });
    }

    // Release the drops
    const releaseIds = dropsToRelease.map((d) => d.id);
    const { error: updateError } = await getSupabaseAdmin()
      .from('intel_drops')
      .update({
        is_released: true,
        released_at: now.toISOString(),
      })
      .in('id', releaseIds);

    if (updateError) {
      console.error('[Intel Release Cron] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to release intel drops' }, { status: 500 });
    }

    // Log the releases
    const releaseLog = dropsToRelease.map((drop) => ({
      id: drop.id,
      day: drop.day,
      title: drop.title,
      classification: drop.classification,
      affected_task_forces: drop.affected_task_forces,
    }));

    console.log(`[Intel Release Cron] Released ${dropsToRelease.length} intel drops:`, releaseLog);

    // Send realtime notification via Supabase channel
    // This will be picked up by subscribed clients
    const channel = getSupabaseAdmin().channel('intel-releases');
    await channel.send({
      type: 'broadcast',
      event: 'new_intel',
      payload: {
        released: releaseLog,
        timestamp: now.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Released ${dropsToRelease.length} intel drops`,
      released: dropsToRelease.length,
      drops: releaseLog,
    });
  } catch (error) {
    console.error('[Intel Release Cron] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
