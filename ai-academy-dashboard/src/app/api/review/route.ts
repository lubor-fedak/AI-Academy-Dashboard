import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import {
  sendEmail,
  getReviewNotificationEmail,
  getAchievementNotificationEmail,
} from '@/lib/email';
import { ACHIEVEMENT_ICONS } from '@/lib/types';
import { requireAdminOrMentor, getCorrelationId } from '@/lib/api-auth';
import { reviewSchema, validateInput, formatValidationErrors } from '@/lib/validation';
import { logger, logApiRequest } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = getCorrelationId(request);

  try {
    // Authentication check
    const authResult = await requireAdminOrMentor(request);
    if (!authResult.authenticated) {
      logApiRequest('POST', '/api/review', 401, Date.now() - startTime, { correlationId });
      return authResult.response;
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = validateInput(reviewSchema, body);
    if (!validation.success) {
      logger.warn('Review validation failed', {
        correlationId,
        errors: validation.errors,
        userId: authResult.user.id,
      });
      logApiRequest('POST', '/api/review', 400, Date.now() - startTime, { correlationId });
      return NextResponse.json(
        { error: 'Validation failed', details: formatValidationErrors(validation.errors) },
        { status: 400 }
      );
    }

    const { submission_id, mentor_rating, mentor_notes } = validation.data;

    const supabase = createServiceSupabaseClient();

    // Update submission with review and get participant + assignment info for email
    const { data: submission, error } = await supabase
      .from('submissions')
      .update({
        mentor_rating,
        mentor_notes: mentor_notes || null,
        status: 'reviewed',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submission_id)
      .select('participant_id, assignment_id')
      .single();

    if (error) {
      logger.error('Failed to save review', { correlationId, submission_id }, error as Error);
      logApiRequest('POST', '/api/review', 500, Date.now() - startTime, { correlationId });
      return NextResponse.json(
        { error: 'Failed to save review' },
        { status: 500 }
      );
    }

    // Get participant details for email
    const { data: participant } = await supabase
      .from('participants')
      .select('name, email')
      .eq('id', submission.participant_id)
      .single();

    // Get assignment details for email
    const { data: assignment } = await supabase
      .from('assignments')
      .select('title, day')
      .eq('id', submission.assignment_id)
      .single();

    // Log activity
    await supabase.from('activity_log').insert({
      participant_id: submission.participant_id,
      action: 'review',
      details: {
        submission_id,
        mentor_rating,
        reviewed_by: authResult.user.id,
      },
    });

    logger.info('Review submitted', {
      correlationId,
      submission_id,
      mentor_rating,
      reviewedBy: authResult.user.id,
    });

    // Send review notification email
    if (participant?.email && assignment) {
      const emailContent = getReviewNotificationEmail({
        participantName: participant.name,
        assignmentTitle: `Day ${assignment.day}: ${assignment.title}`,
        mentorRating: mentor_rating,
        mentorNotes: mentor_notes || undefined,
      });

      // Send email asynchronously (don't block the response)
      sendEmail({
        to: participant.email,
        subject: emailContent.subject,
        html: emailContent.html,
      }).catch((err) => logger.error('Failed to send review email', { correlationId }, err as Error));
    }

    // Check for mentor_favorite achievement (5/5 rating)
    if (mentor_rating === 5) {
      const { data: achievement } = await supabase
        .from('achievements')
        .select('id, name, description, icon, points_bonus')
        .eq('code', 'mentor_favorite')
        .single();

      if (achievement) {
        const { data: existingAchievement } = await supabase
          .from('participant_achievements')
          .select('id')
          .eq('participant_id', submission.participant_id)
          .eq('achievement_id', achievement.id)
          .single();

        if (!existingAchievement) {
          await supabase.from('participant_achievements').insert({
            participant_id: submission.participant_id,
            achievement_id: achievement.id,
          });

          await supabase.from('activity_log').insert({
            participant_id: submission.participant_id,
            action: 'achievement',
            details: { achievement_code: 'mentor_favorite' },
          });

          logger.info('Achievement awarded', {
            correlationId,
            participantId: submission.participant_id,
            achievement: 'mentor_favorite',
          });

          // Send achievement notification email
          if (participant?.email) {
            const achievementEmail = getAchievementNotificationEmail({
              participantName: participant.name,
              achievementName: achievement.name,
              achievementDescription: achievement.description || undefined,
              achievementIcon: ACHIEVEMENT_ICONS['mentor_favorite'] || '🌟',
              bonusPoints: achievement.points_bonus,
            });

            sendEmail({
              to: participant.email,
              subject: achievementEmail.subject,
              html: achievementEmail.html,
            }).catch((err) => logger.error('Failed to send achievement email', { correlationId }, err as Error));
          }
        }
      }
    }

    logApiRequest('POST', '/api/review', 200, Date.now() - startTime, { correlationId });
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logger.error('Review error', { correlationId }, error as Error);
    logApiRequest('POST', '/api/review', 500, Date.now() - startTime, { correlationId });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
