import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import {
  sendEmail,
  getReviewNotificationEmail,
  getAchievementNotificationEmail,
} from '@/lib/email';
import { ACHIEVEMENT_ICONS } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submission_id, mentor_rating, mentor_notes } = body;

    // Validate required fields
    if (!submission_id || !mentor_rating) {
      return NextResponse.json(
        { error: 'submission_id and mentor_rating are required' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (mentor_rating < 1 || mentor_rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

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
      console.error('Review error:', error);
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
      },
    });

    // Send review notification email
    if (participant?.email && assignment) {
      const emailContent = getReviewNotificationEmail({
        participantName: participant.name,
        assignmentTitle: `Day ${assignment.day}: ${assignment.title}`,
        mentorRating: mentor_rating,
        mentorNotes: mentor_notes,
      });

      // Send email asynchronously (don't block the response)
      sendEmail({
        to: participant.email,
        subject: emailContent.subject,
        html: emailContent.html,
      }).catch((err) => console.error('Failed to send review email:', err));
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
            }).catch((err) => console.error('Failed to send achievement email:', err));
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
