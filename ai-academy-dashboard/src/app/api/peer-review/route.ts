import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import { sendEmail, getAchievementNotificationEmail } from '@/lib/email';
import { ACHIEVEMENT_ICONS } from '@/lib/types';
import { requireAdminOrMentor, requireAuth } from '@/lib/api-auth';

const BONUS_POINTS_PER_REVIEW = 2;

// GET - Fetch peer reviews for a participant
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const reviewerId = searchParams.get('reviewer_id');
    const submissionId = searchParams.get('submission_id');
    const status = searchParams.get('status');

    const supabase = createServiceSupabaseClient();

    let query = supabase
      .from('peer_reviews')
      .select(`
        *,
        submissions(
          id,
          commit_message,
          readme_content,
          commit_url,
          participants(name, github_username, avatar_url, role, team),
          assignments(title, day, type)
        )
      `)
      .order('assigned_at', { ascending: false });

    // If a reviewer_id filter is provided, restrict non-admin users to their own reviews
    if (reviewerId) {
      if (
        !authResult.user.isAdmin &&
        authResult.user.participantId &&
        authResult.user.participantId !== reviewerId
      ) {
        return NextResponse.json(
          { error: 'Not authorized to view these peer reviews' },
          { status: 403 }
        );
      }
      query = query.eq('reviewer_id', reviewerId);
    }
    if (submissionId) {
      query = query.eq('submission_id', submissionId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Peer review fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch peer reviews' },
        { status: 500 }
      );
    }

    return NextResponse.json({ peer_reviews: data });
  } catch (error) {
    console.error('Peer review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Submit a peer review or assign new peer reviews
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminOrMentor(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'assign') {
      // Only admins/mentors can assign reviews; enforced by requireAdminOrMentor
      return handleAssignReviews(body);
    } else if (action === 'submit') {
      return handleSubmitReview(body, authResult.user.participantId);
    } else if (action === 'skip') {
      return handleSkipReview(body, authResult.user.participantId);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "assign", "submit", or "skip"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Peer review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Assign peer reviews for a submission
async function handleAssignReviews(body: {
  submission_id: string;
  count?: number;
}) {
  const { submission_id, count = 2 } = body;

  if (!submission_id) {
    return NextResponse.json(
      { error: 'submission_id is required' },
      { status: 400 }
    );
  }

  const supabase = createServiceSupabaseClient();

  // Get the submission to find the participant
  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .select('participant_id')
    .eq('id', submission_id)
    .single();

  if (subError || !submission) {
    return NextResponse.json(
      { error: 'Submission not found' },
      { status: 404 }
    );
  }

  // Get all participants except the submission author
  const { data: participants, error: partError } = await supabase
    .from('participants')
    .select('id')
    .neq('id', submission.participant_id);

  if (partError || !participants || participants.length === 0) {
    return NextResponse.json(
      { error: 'No available reviewers' },
      { status: 400 }
    );
  }

  // Check who already has this submission assigned
  const { data: existingReviews } = await supabase
    .from('peer_reviews')
    .select('reviewer_id')
    .eq('submission_id', submission_id);

  const existingReviewerIds = new Set(
    existingReviews?.map((r) => r.reviewer_id) ?? []
  );

  // Filter out existing reviewers
  const availableReviewers = participants.filter(
    (p) => !existingReviewerIds.has(p.id)
  );

  if (availableReviewers.length === 0) {
    return NextResponse.json(
      { error: 'All participants already assigned this review' },
      { status: 400 }
    );
  }

  // Randomly select reviewers
  const shuffled = availableReviewers.sort(() => Math.random() - 0.5);
  const selectedReviewers = shuffled.slice(0, Math.min(count, shuffled.length));

  // Create peer review assignments
  const newReviews = selectedReviewers.map((reviewer) => ({
    submission_id,
    reviewer_id: reviewer.id,
    is_anonymous: true,
    status: 'pending',
    bonus_points_earned: 0,
  }));

  const { data: created, error: createError } = await supabase
    .from('peer_reviews')
    .insert(newReviews)
    .select();

  if (createError) {
    console.error('Failed to assign peer reviews:', createError);
    return NextResponse.json(
      { error: 'Failed to assign peer reviews' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    assigned: created?.length ?? 0,
    peer_reviews: created,
  });
}

// Submit a peer review
async function handleSubmitReview(
  body: {
    peer_review_id: string;
    rating: number;
    feedback?: string;
  },
  reviewerParticipantId?: string
) {
  const { peer_review_id, rating, feedback } = body;

  if (!peer_review_id || !rating) {
    return NextResponse.json(
      { error: 'peer_review_id and rating are required' },
      { status: 400 }
    );
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: 'Rating must be between 1 and 5' },
      { status: 400 }
    );
  }

  if (!reviewerParticipantId) {
    return NextResponse.json(
      { error: 'Participant profile required to submit reviews' },
      { status: 403 }
    );
  }

  const supabase = createServiceSupabaseClient();

  // Update the peer review
  const { data: peerReview, error } = await supabase
    .from('peer_reviews')
    .update({
      rating,
      feedback: feedback || null,
      status: 'completed',
      completed_at: new Date().toISOString(),
      bonus_points_earned: BONUS_POINTS_PER_REVIEW,
    })
    .eq('id', peer_review_id)
    .eq('reviewer_id', reviewerParticipantId)
    .eq('status', 'pending')
    .select('reviewer_id, submission_id')
    .single();

  if (error) {
    console.error('Submit peer review error:', error);
    return NextResponse.json(
      { error: 'Failed to submit peer review' },
      { status: 500 }
    );
  }

  // Update the reviewer's bonus points in leaderboard
  await supabase.rpc('increment_bonus_points', {
    p_participant_id: peerReview.reviewer_id,
    p_points: BONUS_POINTS_PER_REVIEW,
  });

  // Log activity
  await supabase.from('activity_log').insert({
    participant_id: peerReview.reviewer_id,
    action: 'peer_review',
    details: {
      peer_review_id,
      rating,
      bonus_points: BONUS_POINTS_PER_REVIEW,
    },
  });

  // Check for peer_reviewer achievement (complete 5 reviews)
  const { count } = await supabase
    .from('peer_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('reviewer_id', peerReview.reviewer_id)
    .eq('status', 'completed');

  if (count && count >= 5) {
    await checkAndAwardAchievement(supabase, peerReview.reviewer_id, 'team_player');
  }

  return NextResponse.json({
    success: true,
    bonus_points_earned: BONUS_POINTS_PER_REVIEW,
  });
}

// Skip a peer review (no bonus points)
async function handleSkipReview(
  body: { peer_review_id: string },
  reviewerParticipantId?: string
) {
  const { peer_review_id } = body;

  if (!peer_review_id) {
    return NextResponse.json(
      { error: 'peer_review_id is required' },
      { status: 400 }
    );
  }

  if (!reviewerParticipantId) {
    return NextResponse.json(
      { error: 'Participant profile required to skip reviews' },
      { status: 403 }
    );
  }

  const supabase = createServiceSupabaseClient();

  const { error } = await supabase
    .from('peer_reviews')
    .update({
      status: 'skipped',
      completed_at: new Date().toISOString(),
    })
    .eq('id', peer_review_id)
    .eq('reviewer_id', reviewerParticipantId)
    .eq('status', 'pending');

  if (error) {
    console.error('Skip peer review error:', error);
    return NextResponse.json(
      { error: 'Failed to skip peer review' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

// Helper to check and award achievement
async function checkAndAwardAchievement(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  participantId: string,
  achievementCode: string
) {
  const { data: achievement } = await supabase
    .from('achievements')
    .select('id, name, description, points_bonus')
    .eq('code', achievementCode)
    .single();

  if (!achievement) return;

  const { data: existing } = await supabase
    .from('participant_achievements')
    .select('id')
    .eq('participant_id', participantId)
    .eq('achievement_id', achievement.id)
    .single();

  if (existing) return;

  await supabase.from('participant_achievements').insert({
    participant_id: participantId,
    achievement_id: achievement.id,
  });

  await supabase.from('activity_log').insert({
    participant_id: participantId,
    action: 'achievement',
    details: { achievement_code: achievementCode },
  });

  // Get participant email for notification
  const { data: participant } = await supabase
    .from('participants')
    .select('name, email')
    .eq('id', participantId)
    .single();

  if (participant?.email) {
    const achievementEmail = getAchievementNotificationEmail({
      participantName: participant.name,
      achievementName: achievement.name,
      achievementDescription: achievement.description || undefined,
      achievementIcon: ACHIEVEMENT_ICONS[achievementCode] || '🏆',
      bonusPoints: achievement.points_bonus,
    });

    sendEmail({
      to: participant.email,
      subject: achievementEmail.subject,
      html: achievementEmail.html,
    }).catch((err) => console.error('Failed to send achievement email:', err));
  }
}
