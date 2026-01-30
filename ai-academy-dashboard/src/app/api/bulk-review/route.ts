import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import {
  sendEmail,
  getReviewNotificationEmail,
  getAchievementNotificationEmail,
} from '@/lib/email';
import { ACHIEVEMENT_ICONS } from '@/lib/types';
import type { SubmissionStatus } from '@/lib/types';

interface BulkReviewRequest {
  submission_ids: string[];
  mentor_rating?: number;
  mentor_notes?: string;
  status?: SubmissionStatus;
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkReviewRequest = await request.json();
    const { submission_ids, mentor_rating, mentor_notes, status } = body;

    // Validate required fields
    if (!submission_ids || !Array.isArray(submission_ids) || submission_ids.length === 0) {
      return NextResponse.json(
        { error: 'submission_ids array is required' },
        { status: 400 }
      );
    }

    // Must have at least rating or status
    if (!mentor_rating && !status) {
      return NextResponse.json(
        { error: 'Either mentor_rating or status is required' },
        { status: 400 }
      );
    }

    // Validate rating range if provided
    if (mentor_rating && (mentor_rating < 1 || mentor_rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();

    // Build update object
    const updateData: Record<string, unknown> = {
      reviewed_at: new Date().toISOString(),
    };

    if (mentor_rating) {
      updateData.mentor_rating = mentor_rating;
      updateData.status = status || 'reviewed';
    }

    if (status) {
      updateData.status = status;
    }

    if (mentor_notes !== undefined) {
      updateData.mentor_notes = mentor_notes || null;
    }

    // Update all submissions and get full details for emails
    const { data: submissions, error } = await supabase
      .from('submissions')
      .update(updateData)
      .in('id', submission_ids)
      .select('id, participant_id, assignment_id');

    if (error) {
      console.error('Bulk review error:', error);
      return NextResponse.json(
        { error: 'Failed to save bulk review' },
        { status: 500 }
      );
    }

    // Get participant details for emails
    const participantIds = [...new Set(submissions?.map((s) => s.participant_id) || [])];
    const { data: participants } = await supabase
      .from('participants')
      .select('id, name, email')
      .in('id', participantIds);

    const participantMap = new Map(participants?.map((p) => [p.id, p]) || []);

    // Get assignment details for emails
    const assignmentIds = [...new Set(submissions?.map((s) => s.assignment_id) || [])];
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, title, day')
      .in('id', assignmentIds);

    const assignmentMap = new Map(assignments?.map((a) => [a.id, a]) || []);

    // Log activity for each submission
    if (submissions) {
      const activityLogs = submissions.map((sub) => ({
        participant_id: sub.participant_id,
        action: 'bulk_review',
        details: {
          submission_id: sub.id,
          mentor_rating,
          status,
        },
      }));

      await supabase.from('activity_log').insert(activityLogs);

      // Send email notifications for each submission (if rating was given)
      if (mentor_rating) {
        for (const sub of submissions) {
          const participant = participantMap.get(sub.participant_id);
          const assignment = assignmentMap.get(sub.assignment_id);

          if (participant?.email && assignment) {
            const emailContent = getReviewNotificationEmail({
              participantName: participant.name,
              assignmentTitle: `Day ${assignment.day}: ${assignment.title}`,
              mentorRating: mentor_rating,
              mentorNotes: mentor_notes,
            });

            // Send asynchronously
            sendEmail({
              to: participant.email,
              subject: emailContent.subject,
              html: emailContent.html,
            }).catch((err) => console.error('Failed to send bulk review email:', err));
          }
        }
      }

      // Check for mentor_favorite achievement (5/5 rating) for each participant
      if (mentor_rating === 5) {
        const { data: achievement } = await supabase
          .from('achievements')
          .select('id, name, description, points_bonus')
          .eq('code', 'mentor_favorite')
          .single();

        if (achievement) {
          for (const participantId of participantIds) {
            const { data: existingAchievement } = await supabase
              .from('participant_achievements')
              .select('id')
              .eq('participant_id', participantId)
              .eq('achievement_id', achievement.id)
              .single();

            if (!existingAchievement) {
              await supabase.from('participant_achievements').insert({
                participant_id: participantId,
                achievement_id: achievement.id,
              });

              await supabase.from('activity_log').insert({
                participant_id: participantId,
                action: 'achievement',
                details: { achievement_code: 'mentor_favorite' },
              });

              // Send achievement notification email
              const participant = participantMap.get(participantId);
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
      }
    }

    return NextResponse.json({
      success: true,
      updated_count: submissions?.length || 0,
    });
  } catch (error) {
    console.error('Bulk review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
