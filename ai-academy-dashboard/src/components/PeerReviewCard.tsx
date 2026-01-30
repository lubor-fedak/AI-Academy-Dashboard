'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Star,
  Loader2,
  Eye,
  ExternalLink,
  UserCircle,
  Clock,
  CheckCircle,
  SkipForward,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { sk } from 'date-fns/locale';
import type { PeerReviewWithDetails } from '@/lib/types';

interface PeerReviewCardProps {
  peerReview: PeerReviewWithDetails;
  onComplete: () => void;
  isReviewer?: boolean;
}

export function PeerReviewCard({
  peerReview,
  onComplete,
  isReviewer = true,
}: PeerReviewCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');

  const submission = peerReview.submissions;
  const assignment = submission?.assignments;
  const author = submission?.participants;

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error('Prosím vyber hodnotenie');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/peer-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          peer_review_id: peerReview.id,
          rating,
          feedback: feedback.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      toast.success(`Recenzia odoslaná! +${data.bonus_points_earned} bonus bodov`);
      setIsViewOpen(false);
      onComplete();
    } catch (error) {
      toast.error('Nepodarilo sa odoslať recenziu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipReview = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/peer-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'skip',
          peer_review_id: peerReview.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to skip review');
      }

      toast.info('Recenzia preskočená');
      setIsViewOpen(false);
      onComplete();
    } catch (error) {
      toast.error('Nepodarilo sa preskočiť recenziu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = peerReview.status === 'pending';
  const isCompleted = peerReview.status === 'completed';
  const isSkipped = peerReview.status === 'skipped';

  return (
    <Card
      className={`${
        isPending
          ? 'border-[#0062FF]/30'
          : isCompleted
          ? 'border-green-500/30'
          : 'border-muted'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={
                  isPending ? 'default' : isCompleted ? 'secondary' : 'outline'
                }
                className={isPending ? 'bg-[#0062FF]' : ''}
              >
                {isPending && <Clock className="mr-1 h-3 w-3" />}
                {isCompleted && <CheckCircle className="mr-1 h-3 w-3" />}
                {isSkipped && <SkipForward className="mr-1 h-3 w-3" />}
                {isPending ? 'Čaká na recenziu' : isCompleted ? 'Dokončené' : 'Preskočené'}
              </Badge>
              {isCompleted && peerReview.bonus_points_earned > 0 && (
                <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                  <Gift className="mr-1 h-3 w-3" />
                  +{peerReview.bonus_points_earned} bodov
                </Badge>
              )}
            </div>

            <h4 className="font-medium mt-2">
              Day {assignment?.day}: {assignment?.title}
            </h4>

            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {peerReview.is_anonymous && isReviewer ? (
                <div className="flex items-center gap-1">
                  <UserCircle className="h-4 w-4" />
                  <span>Anonymný autor</span>
                </div>
              ) : (
                author && (
                  <div className="flex items-center gap-1">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px]">
                        {author.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{author.name}</span>
                  </div>
                )
              )}
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(peerReview.assigned_at), {
                  addSuffix: true,
                  locale: sk,
                })}
              </span>
            </div>

            {isCompleted && peerReview.rating && (
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= peerReview.rating!
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
                {peerReview.feedback && (
                  <span className="text-sm text-muted-foreground ml-2">
                    &quot;{peerReview.feedback.slice(0, 50)}
                    {peerReview.feedback.length > 50 ? '...' : ''}&quot;
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            {isPending && isReviewer ? (
              <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#0062FF] hover:bg-[#0052D9]">
                    <Eye className="mr-2 h-4 w-4" />
                    Ohodnotiť
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Peer Review</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Assignment Info */}
                    <div className="bg-accent/50 rounded-lg p-4">
                      <h4 className="font-medium">
                        Day {assignment?.day}: {assignment?.title}
                      </h4>
                      <Badge variant="outline" className="mt-1">
                        {assignment?.type === 'in_class' ? 'In-Class' : 'Homework'}
                      </Badge>
                    </div>

                    {/* Submission Content */}
                    <div>
                      <Label className="text-muted-foreground">Commit message</Label>
                      <p className="mt-1 font-mono text-sm bg-muted p-2 rounded">
                        {submission?.commit_message || 'Žiadna správa'}
                      </p>
                    </div>

                    {submission?.readme_content && (
                      <div>
                        <Label className="text-muted-foreground">README obsah</Label>
                        <div className="mt-1 text-sm bg-muted p-3 rounded max-h-48 overflow-y-auto">
                          <pre className="whitespace-pre-wrap font-mono text-xs">
                            {submission.readme_content}
                          </pre>
                        </div>
                      </div>
                    )}

                    {submission?.commit_url && (
                      <a
                        href={submission.commit_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-[#0062FF] hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Pozrieť commit na GitHub
                      </a>
                    )}

                    <Separator />

                    {/* Rating */}
                    <div>
                      <Label>Hodnotenie *</Label>
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-8 w-8 ${
                                star <= (hoveredRating || rating)
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </button>
                        ))}
                        {rating > 0 && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            {rating}/5
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Feedback */}
                    <div>
                      <Label htmlFor="feedback">Feedback (voliteľné)</Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Napíš konštruktívny feedback..."
                        rows={3}
                        className="mt-2"
                      />
                    </div>

                    {/* Bonus Points Info */}
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <Gift className="h-5 w-5" />
                        <span className="font-medium">+2 bonus bodov</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Za dokončenie tejto recenzie získaš bonus body do leaderboardu.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="ghost"
                        onClick={handleSkipReview}
                        disabled={isSubmitting}
                      >
                        <SkipForward className="mr-2 h-4 w-4" />
                        Preskočiť
                      </Button>
                      <Button
                        onClick={handleSubmitReview}
                        disabled={isSubmitting || rating === 0}
                        className="bg-[#0062FF] hover:bg-[#0052D9]"
                      >
                        {isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Odoslať recenziu
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Badge variant="outline">
                {isCompleted ? 'Dokončené' : isSkipped ? 'Preskočené' : 'Čaká'}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
