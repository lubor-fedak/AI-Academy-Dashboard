import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import { sendEmail, getDeadlineReminderEmail } from '@/lib/email';
import { differenceInHours } from 'date-fns';

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
// Recommended schedule: Once daily at 8:00 AM

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In production, require a cron secret to be configured and matched
  if (!cronSecret && process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Server misconfiguration: CRON_SECRET is not set' },
      { status: 500 }
    );
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServiceSupabaseClient();
    const now = new Date();

    // Get all assignments with deadlines
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id, day, type, title, due_at')
      .not('due_at', 'is', null);

    if (assignmentsError) {
      throw assignmentsError;
    }

    // Filter assignments with deadlines in the next 72 hours
    const upcomingAssignments = (assignments || []).filter((a) => {
      if (!a.due_at) return false;
      const hoursRemaining = differenceInHours(new Date(a.due_at), now);
      return hoursRemaining > 0 && hoursRemaining <= 72;
    });

    if (upcomingAssignments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No upcoming deadlines',
        emailsSent: 0,
      });
    }

    // Get all participants
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('id, name, email');

    if (participantsError) {
      throw participantsError;
    }

    // Get all submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('participant_id, assignment_id');

    if (submissionsError) {
      throw submissionsError;
    }

    // Create a set of submitted assignment IDs per participant
    const submittedMap = new Map<string, Set<string>>();
    (submissions || []).forEach((s) => {
      if (!submittedMap.has(s.participant_id)) {
        submittedMap.set(s.participant_id, new Set());
      }
      submittedMap.get(s.participant_id)!.add(s.assignment_id);
    });

    let emailsSent = 0;
    const errors: string[] = [];

    // For each participant, check which upcoming assignments they haven't submitted
    for (const participant of participants || []) {
      if (!participant.email) continue;

      const participantSubmissions = submittedMap.get(participant.id) || new Set();

      const missingAssignments = upcomingAssignments
        .filter((a) => !participantSubmissions.has(a.id))
        .map((a) => ({
          title: a.title,
          day: a.day,
          type: a.type,
          hoursRemaining: differenceInHours(new Date(a.due_at!), now),
        }))
        .sort((a, b) => a.hoursRemaining - b.hoursRemaining);

      if (missingAssignments.length === 0) continue;

      // Send reminder email
      const emailContent = getDeadlineReminderEmail({
        participantName: participant.name,
        assignments: missingAssignments,
      });

      const result = await sendEmail({
        to: participant.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      if (result.success) {
        emailsSent++;
      } else {
        errors.push(`Failed to send to ${participant.email}: ${result.error}`);
      }
    }

    // Log the cron run
    await supabase.from('activity_log').insert({
      participant_id: null,
      action: 'cron_deadline_reminders',
      details: {
        emailsSent,
        upcomingDeadlines: upcomingAssignments.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      emailsSent,
      upcomingDeadlines: upcomingAssignments.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Deadline reminder cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
