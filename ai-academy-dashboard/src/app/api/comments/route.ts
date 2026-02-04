import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import { requireAuth } from '@/lib/api-auth';
import { z } from 'zod';

// Validation schemas
const createCommentSchema = z.object({
  submission_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
  parent_id: z.string().uuid().nullable().optional(),
});

const updateCommentSchema = z.object({
  comment_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

// GET - Fetch comments for a submission
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const submissionId = searchParams.get('submission_id');

    if (!submissionId) {
      return NextResponse.json(
        { error: 'submission_id is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();

    // Fetch all comments for the submission
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:participants!author_id(id, name, github_username, avatar_url, role)
      `)
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Comments fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Build threaded structure
    const commentMap = new Map();
    const rootComments: typeof comments = [];

    // First pass: create map
    comments?.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree
    comments?.forEach((comment) => {
      const mappedComment = commentMap.get(comment.id);
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(mappedComment);
        }
      } else {
        rootComments.push(mappedComment);
      }
    });

    return NextResponse.json({
      comments: rootComments,
      total_count: comments?.length ?? 0,
    });
  } catch (error) {
    console.error('Comments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    // User must have a participant record
    if (!authResult.user.participantId) {
      return NextResponse.json(
        { error: 'User account not fully set up' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = createCommentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { submission_id, content, parent_id } = validation.data;
    // Use authenticated user's participant ID - NEVER trust client-supplied author_id
    const author_id = authResult.user.participantId;

    const supabase = createServiceSupabaseClient();

    // Create the comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        submission_id,
        author_id,
        parent_id: parent_id || null,
        content: content.trim(),
        is_edited: false,
      })
      .select(`
        *,
        author:participants!author_id(id, name, github_username, avatar_url, role)
      `)
      .single();

    if (error) {
      console.error('Create comment error:', error);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    // Extract @mentions
    const mentionPattern = /@(\w+)/g;
    const mentions = [...content.matchAll(mentionPattern)].map((m) => m[1]);

    // Get author name for notifications
    const { data: author } = await supabase
      .from('participants')
      .select('name')
      .eq('id', author_id)
      .single();

    // Notify mentioned users
    if (mentions.length > 0) {
      const { data: mentionedUsers } = await supabase
        .from('participants')
        .select('email, name, github_username')
        .in('github_username', mentions);

      if (mentionedUsers) {
        for (const user of mentionedUsers) {
          if (user.email) {
            const emailContent = getMentionNotificationEmail({
              mentionedName: user.name,
              authorName: author?.name || 'Someone',
              commentPreview: content.slice(0, 100),
              submissionId: submission_id,
            });

            sendEmail({
              to: user.email,
              subject: emailContent.subject,
              html: emailContent.html,
            }).catch((err) => console.error('Failed to send mention email:', err));
          }
        }
      }
    }

    // If this is a reply, notify the parent comment author
    if (parent_id) {
      const { data: parentComment } = await supabase
        .from('comments')
        .select('author_id')
        .eq('id', parent_id)
        .single();

      if (parentComment && parentComment.author_id !== author_id) {
        const { data: parentAuthor } = await supabase
          .from('participants')
          .select('email, name')
          .eq('id', parentComment.author_id)
          .single();

        if (parentAuthor?.email) {
          const emailContent = getReplyNotificationEmail({
            recipientName: parentAuthor.name,
            authorName: author?.name || 'Someone',
            commentPreview: content.slice(0, 100),
            submissionId: submission_id,
          });

          sendEmail({
            to: parentAuthor.email,
            subject: emailContent.subject,
            html: emailContent.html,
          }).catch((err) => console.error('Failed to send reply email:', err));
        }
      }
    }

    // Log activity
    await supabase.from('activity_log').insert({
      participant_id: author_id,
      action: 'comment',
      details: {
        submission_id,
        comment_id: comment.id,
        is_reply: !!parent_id,
      },
    });

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error('Comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update a comment
export async function PATCH(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    if (!authResult.user.participantId) {
      return NextResponse.json(
        { error: 'User account not fully set up' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = updateCommentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { comment_id, content } = validation.data;
    // Use authenticated user's participant ID for authorization
    const author_id = authResult.user.participantId;

    const supabase = createServiceSupabaseClient();

    // Verify ownership using authenticated user's ID
    const { data: existing } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', comment_id)
      .single();

    if (!existing || existing.author_id !== author_id) {
      return NextResponse.json(
        { error: 'Not authorized to edit this comment' },
        { status: 403 }
      );
    }

    // Update the comment
    const { data: comment, error } = await supabase
      .from('comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
        is_edited: true,
      })
      .eq('id', comment_id)
      .select(`
        *,
        author:participants!author_id(id, name, github_username, avatar_url, role)
      `)
      .single();

    if (error) {
      console.error('Update comment error:', error);
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error('Comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    if (!authResult.user.participantId) {
      return NextResponse.json(
        { error: 'User account not fully set up' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const commentId = searchParams.get('comment_id');

    if (!commentId) {
      return NextResponse.json(
        { error: 'comment_id is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment_id format' },
        { status: 400 }
      );
    }

    // Use authenticated user's participant ID for authorization
    const authorId = authResult.user.participantId;

    const supabase = createServiceSupabaseClient();

    // Verify ownership using authenticated user's ID
    const { data: existing } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', commentId)
      .single();

    // Allow deletion if user is author OR is admin
    if (!existing || (existing.author_id !== authorId && !authResult.user.isAdmin)) {
      return NextResponse.json(
        { error: 'Not authorized to delete this comment' },
        { status: 403 }
      );
    }

    // Delete the comment (cascades to replies)
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Delete comment error:', error);
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Escape HTML entities to prevent XSS in email content.
 * Converts special characters to their HTML entity equivalents.
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Email templates
function getMentionNotificationEmail(params: {
  mentionedName: string;
  authorName: string;
  commentPreview: string;
  submissionId: string;
}) {
  // Security: Escape all dynamic content to prevent XSS
  const safeMentionedName = escapeHtml(params.mentionedName);
  const safeAuthorName = escapeHtml(params.authorName);
  const safePreview = escapeHtml(params.commentPreview);

  return {
    subject: `${safeAuthorName} mentioned you in a comment`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0062FF;">AI Academy Dashboard</h2>
        <p>Hi ${safeMentionedName},</p>
        <p><strong>${safeAuthorName}</strong> mentioned you in a comment:</p>
        <blockquote style="border-left: 3px solid #0062FF; padding-left: 16px; margin: 16px 0; color: #666;">
          "${safePreview}${params.commentPreview.length >= 100 ? '...' : ''}"
        </blockquote>
        <p style="margin-top: 24px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin"
             style="background: #0062FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View comment
          </a>
        </p>
      </div>
    `,
  };
}

function getReplyNotificationEmail(params: {
  recipientName: string;
  authorName: string;
  commentPreview: string;
  submissionId: string;
}) {
  // Security: Escape all dynamic content to prevent XSS
  const safeRecipientName = escapeHtml(params.recipientName);
  const safeAuthorName = escapeHtml(params.authorName);
  const safePreview = escapeHtml(params.commentPreview);

  return {
    subject: `${safeAuthorName} replied to your comment`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0062FF;">AI Academy Dashboard</h2>
        <p>Hi ${safeRecipientName},</p>
        <p><strong>${safeAuthorName}</strong> replied to your comment:</p>
        <blockquote style="border-left: 3px solid #0062FF; padding-left: 16px; margin: 16px 0; color: #666;">
          "${safePreview}${params.commentPreview.length >= 100 ? '...' : ''}"
        </blockquote>
        <p style="margin-top: 24px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin"
             style="background: #0062FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View discussion
          </a>
        </p>
      </div>
    `,
  };
}
