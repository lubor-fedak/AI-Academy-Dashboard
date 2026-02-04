import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import crypto from 'crypto';

// Verify GitHub webhook signature
function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[GitHub Webhook] GITHUB_WEBHOOK_SECRET not configured');
    return false;
  }
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  try {
    // Pad to same length for timing-safe comparison
    const maxLen = Math.max(digest.length, signature.length);
    const paddedDigest = digest.padEnd(maxLen, '\0');
    const paddedSignature = signature.padEnd(maxLen, '\0');
    return crypto.timingSafeEqual(Buffer.from(paddedDigest), Buffer.from(paddedSignature));
  } catch {
    return false;
  }
}

// Parse self-rating from README content
function parseSelfRating(content: string): number | null {
  const match = content.match(/\*\*Overall rating:\*\* (\d)\/5/);
  return match ? parseInt(match[1]) : null;
}

// Detect folder from changed files
function detectSubmissionFolder(files: string[]): string | null {
  const submissionFolders = [
    'day-01-agent-foundations',
    'day-02-agentic-framework',
    'day-03-multi-agent',
    'day-04-team-challenge',
    'day-05-mvp',
    'homework/day-01',
    'homework/day-02',
    'homework/day-03',
  ];

  for (const file of files) {
    for (const folder of submissionFolders) {
      if (file.startsWith(folder + '/')) {
        return folder;
      }
    }
  }
  return null;
}

// Check and award achievements
async function checkAchievements(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  participantId: string
) {
  const { data: submissions } = await supabase
    .from('submissions')
    .select('submitted_at, assignment_id')
    .eq('participant_id', participantId);

  if (!submissions) return;

  const { data: existingAchievements } = await supabase
    .from('participant_achievements')
    .select('achievement_id, achievements(code)')
    .eq('participant_id', participantId);

  const earned = new Set(
    existingAchievements?.map((a) => {
      const item = a as unknown as { achievements: { code: string } | null };
      return item.achievements?.code;
    }) || []
  );

  const achievementsToAward: string[] = [];

  // First Blood
  if (submissions.length === 1 && !earned.has('first_blood')) {
    achievementsToAward.push('first_blood');
  }

  // Streak
  if (submissions.length >= 3 && !earned.has('streak_3')) {
    achievementsToAward.push('streak_3');
  }
  if (submissions.length >= 5 && !earned.has('streak_5')) {
    achievementsToAward.push('streak_5');
  }

  // Early Bird / Night Owl
  const lastSubmission = new Date(submissions[submissions.length - 1].submitted_at);
  const hour = lastSubmission.getHours();
  if (hour < 9 && !earned.has('early_bird')) {
    achievementsToAward.push('early_bird');
  }
  if (hour >= 22 && !earned.has('night_owl')) {
    achievementsToAward.push('night_owl');
  }

  // Award achievements
  for (const code of achievementsToAward) {
    const { data: achievement } = await supabase
      .from('achievements')
      .select('id, points_bonus')
      .eq('code', code)
      .single();

    if (achievement) {
      await supabase.from('participant_achievements').insert({
        participant_id: participantId,
        achievement_id: achievement.id,
      });

      // Log activity
      await supabase.from('activity_log').insert({
        participant_id: participantId,
        action: 'achievement',
        details: { achievement_code: code },
      });
    }
  }
}

export async function POST(request: NextRequest) {
  // Security: Fail closed if webhook secret is not configured
  if (!process.env.GITHUB_WEBHOOK_SECRET) {
    console.error('[GitHub Webhook] GITHUB_WEBHOOK_SECRET not configured - rejecting request');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const payload = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  // Verify signature
  if (!signature || !verifySignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = request.headers.get('x-github-event');
  const data = JSON.parse(payload);

  // Only process push events
  if (event !== 'push') {
    return NextResponse.json({ message: 'Ignored event' }, { status: 200 });
  }

  const supabase = createServiceSupabaseClient();

  // Extract info
  const githubUsername = data.repository?.owner?.login;
  const commitSha = data.head_commit?.id;
  const commitMessage = data.head_commit?.message;
  const commitUrl = data.head_commit?.url;

  if (!githubUsername || !commitSha) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  // Get participant
  const { data: participant, error: pError } = await supabase
    .from('participants')
    .select('id')
    .eq('github_username', githubUsername)
    .single();

  if (pError || !participant) {
    console.log(`Unknown participant: ${githubUsername}`);
    return NextResponse.json({ message: 'Unknown participant' }, { status: 200 });
  }

  // Detect which folder was updated
  const modifiedFiles = data.head_commit?.modified || [];
  const addedFiles = data.head_commit?.added || [];
  const allFiles = [...modifiedFiles, ...addedFiles];

  const folder = detectSubmissionFolder(allFiles);
  if (!folder) {
    return NextResponse.json(
      { message: 'No submission folder detected' },
      { status: 200 }
    );
  }

  // Get assignment by folder
  const { data: assignment, error: aError } = await supabase
    .from('assignments')
    .select('id, day, type')
    .eq('folder_name', folder)
    .single();

  if (aError || !assignment) {
    console.log(`Unknown assignment folder: ${folder}`);
    return NextResponse.json({ message: 'Unknown assignment' }, { status: 200 });
  }

  // Try to fetch README content from the repo
  let readmeContent = '';
  let selfRating = null;

  try {
    const readmeUrl = `https://raw.githubusercontent.com/${githubUsername}/ai-academy-2026/${data.ref?.replace('refs/heads/', '')}/${folder}/README.md`;
    const readmeResponse = await fetch(readmeUrl);
    if (readmeResponse.ok) {
      readmeContent = await readmeResponse.text();
      selfRating = parseSelfRating(readmeContent);
    }
  } catch {
    console.log('Could not fetch README');
  }

  // Calculate points (base + on-time bonus)
  const now = new Date();
  const { data: assignmentFull } = await supabase
    .from('assignments')
    .select('max_points, due_at')
    .eq('id', assignment.id)
    .single();

  let points = assignmentFull?.max_points || 15;
  if (assignmentFull?.due_at && new Date(assignmentFull.due_at) < now) {
    points = Math.floor(points * 0.5); // 50% for late
  }

  // Upsert submission
  const { data: submission, error: sError } = await supabase
    .from('submissions')
    .upsert(
      {
        participant_id: participant.id,
        assignment_id: assignment.id,
        commit_sha: commitSha,
        commit_message: commitMessage,
        commit_url: commitUrl,
        readme_content: readmeContent,
        self_rating: selfRating,
        points_earned: points,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      },
      {
        onConflict: 'participant_id,assignment_id',
      }
    )
    .select()
    .single();

  if (sError) {
    console.error('Submission error:', sError);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Log activity
  await supabase.from('activity_log').insert({
    participant_id: participant.id,
    action: 'submission',
    details: {
      assignment_id: assignment.id,
      commit_sha: commitSha,
      folder: folder,
    },
  });

  // Check for achievements
  await checkAchievements(supabase, participant.id);

  return NextResponse.json({
    success: true,
    submission_id: submission.id,
    points_earned: points,
  });
}
