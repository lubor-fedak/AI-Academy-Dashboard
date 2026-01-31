'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Send,
  CornerDownRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  AtSign,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { CommentWithAuthor, Participant } from '@/lib/types';

interface SubmissionCommentsProps {
  submissionId: string;
  currentUserId?: string;
  participants?: Participant[];
  trigger?: React.ReactNode;
}

export function SubmissionComments({
  submissionId,
  currentUserId,
  participants = [],
  trigger,
}: SubmissionCommentsProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/comments?submission_id=${submissionId}`);
      const data = await response.json();

      if (response.ok) {
        setComments(data.comments);
        setTotalCount(data.total_count);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, fetchComments]);

  const handleSubmitComment = async (parentId?: string) => {
    const content = parentId ? editContent : newComment;
    if (!content.trim() || !currentUserId) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          author_id: currentUserId,
          content: content.trim(),
          parent_id: parentId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit comment');
      }

      toast.success(parentId ? 'Reply added' : 'Comment added');

      if (parentId) {
        setReplyingTo(null);
        setEditContent('');
      } else {
        setNewComment('');
      }

      fetchComments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim() || !currentUserId) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_id: commentId,
          author_id: currentUserId,
          content: editContent.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to edit comment');
      }

      toast.success('Comment edited');
      setEditingId(null);
      setEditContent('');
      fetchComments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to edit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId) return;

    try {
      const response = await fetch(
        `/api/comments?comment_id=${commentId}&author_id=${currentUserId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete comment');
      }

      toast.success('Comment deleted');
      fetchComments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete comment');
    }
  };

  const handleMentionSelect = (username: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const currentValue = replyingTo ? editContent : newComment;
    const cursorPos = textarea.selectionStart;

    // Find the @ symbol position before cursor
    const beforeCursor = currentValue.slice(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const newValue =
        currentValue.slice(0, atIndex) +
        `@${username} ` +
        currentValue.slice(cursorPos);

      if (replyingTo) {
        setEditContent(newValue);
      } else {
        setNewComment(newValue);
      }
    }

    setShowMentions(false);
    setMentionQuery('');
    textarea.focus();
  };

  const handleTextChange = (value: string, isReply: boolean) => {
    if (isReply) {
      setEditContent(value);
    } else {
      setNewComment(value);
    }

    // Check for @mention trigger
    const cursorPos = textareaRef.current?.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const filteredMentions = participants.filter(
    (p) =>
      p.github_username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering for bold, italic, code, and mentions
    const html = content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(
        /@(\w+)/g,
        '<span class="text-[#0062FF] font-medium cursor-pointer hover:underline">@$1</span>'
      )
      .replace(/\n/g, '<br />');

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const CommentItem = ({
    comment,
    depth = 0,
  }: {
    comment: CommentWithAuthor;
    depth?: number;
  }) => {
    const isOwner = comment.author_id === currentUserId;
    const isEditing = editingId === comment.id;

    return (
      <div className={`${depth > 0 ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
        <div className="flex items-start gap-3 py-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={comment.author?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">
              {comment.author?.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {comment.author?.name || 'Unknown'}
              </span>
              <span className="text-xs text-muted-foreground">
                @{comment.author?.github_username}
              </span>
              {comment.author?.role && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  {comment.author.role}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                })}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-muted-foreground italic">
                  (edited)
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => handleTextChange(e.target.value, true)}
                  rows={2}
                  className="resize-none"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditComment(comment.id)}
                    disabled={isSubmitting || !editContent.trim()}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(null);
                      setEditContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-1 text-sm">{renderMarkdown(comment.content)}</div>
            )}

            {!isEditing && currentUserId && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setReplyingTo(comment.id);
                    setEditContent('');
                    setTimeout(() => textareaRef.current?.focus(), 100);
                  }}
                >
                  <CornerDownRight className="mr-1 h-3 w-3" />
                  Reply
                </Button>

                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditContent(comment.content);
                        }}
                      >
                        <Pencil className="mr-2 h-3 w-3" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}

            {/* Reply form */}
            {replyingTo === comment.id && (
              <div className="mt-3 space-y-2">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => handleTextChange(e.target.value, true)}
                    placeholder={`Reply to @${comment.author?.github_username}...`}
                    rows={2}
                    className="resize-none pr-10"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => {
                      setReplyingTo(null);
                      setEditContent('');
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Mentions dropdown */}
                {showMentions && filteredMentions.length > 0 && (
                  <Card className="absolute z-10 w-64 shadow-lg">
                    <CardContent className="p-1">
                      {filteredMentions.slice(0, 5).map((p) => (
                        <button
                          key={p.id}
                          className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded text-left"
                          onClick={() => handleMentionSelect(p.github_username)}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={p.avatar_url ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {p.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              @{p.github_username}
                            </p>
                          </div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitComment(comment.id)}
                    disabled={isSubmitting || !editContent.trim()}
                    className="bg-[#0062FF] hover:bg-[#0052D9]"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    <Send className="mr-1 h-3 w-3" />
                    Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-1">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const dialogContent = (
    <div className="space-y-4">
      {/* New comment form */}
      {currentUserId ? (
        <div className="space-y-2">
          <div className="relative">
            <Textarea
              ref={!replyingTo ? textareaRef : undefined}
              value={newComment}
              onChange={(e) => handleTextChange(e.target.value, false)}
              placeholder="Write a comment... Use @name to mention"
              rows={3}
              className="resize-none"
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => {
                  setNewComment((prev) => prev + '@');
                  textareaRef.current?.focus();
                }}
              >
                <AtSign className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Mentions dropdown for main input */}
          {showMentions && !replyingTo && filteredMentions.length > 0 && (
            <Card className="shadow-lg">
              <CardContent className="p-1">
                {filteredMentions.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    className="flex items-center gap-2 w-full p-2 hover:bg-accent rounded text-left"
                    onClick={() => handleMentionSelect(p.github_username)}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={p.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {p.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        @{p.github_username}
                      </p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Podporuje **bold**, *italic*, `code` a @mentions
            </p>
            <Button
              onClick={() => handleSubmitComment()}
              disabled={isSubmitting || !newComment.trim()}
              className="bg-[#0062FF] hover:bg-[#0052D9]"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </div>
        </div>
      ) : (
        <Card className="bg-muted/50">
          <CardContent className="py-4 text-center text-muted-foreground">
            You must be logged in to add a comment
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No comments yet</p>
          <p className="text-sm">Be the first to add a comment!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#0062FF]" />
              Discussion ({totalCount})
            </DialogTitle>
          </DialogHeader>
          {dialogContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-[#0062FF]" />
          Discussion ({totalCount})
        </CardTitle>
      </CardHeader>
      <CardContent>{dialogContent}</CardContent>
    </Card>
  );
}
