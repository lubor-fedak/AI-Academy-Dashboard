'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PeerReviewCard } from '@/components/PeerReviewCard';
import {
  Users,
  Star,
  Gift,
  CheckCircle,
  Clock,
  Trophy,
  AlertCircle,
  UserCircle,
} from 'lucide-react';
import type { Participant, PeerReviewWithDetails, PeerReviewStats } from '@/lib/types';

export default function PeerReviewsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedUsername, setSelectedUsername] = useState<string>('');
  const [peerReviews, setPeerReviews] = useState<PeerReviewWithDetails[]>([]);
  const [receivedReviews, setReceivedReviews] = useState<PeerReviewWithDetails[]>([]);
  const [stats, setStats] = useState<PeerReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  // Load participants
  useEffect(() => {
    const fetchParticipants = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('public_participants')
        .select('*')
        .order('name');
      setParticipants((data as Participant[]) ?? []);

      // Load saved username
      const saved = localStorage.getItem('my-dashboard-username');
      if (saved && data?.some((p) => p.github_username === saved)) {
        setSelectedUsername(saved);
      }
      setIsLoading(false);
    };

    fetchParticipants();
  }, []);

  const fetchPeerReviews = useCallback(async () => {
    if (!selectedUsername) return;

    const participant = participants.find(
      (p) => p.github_username === selectedUsername
    );
    if (!participant) return;

    setIsLoading(true);

    try {
      // Fetch reviews to give
      const reviewsResponse = await fetch(
        `/api/peer-review?reviewer_id=${participant.id}`
      );
      const reviewsData = await reviewsResponse.json();

      // Fetch reviews received (on my submissions)
      const supabase = getSupabaseClient();
      const { data: mySubmissions } = await supabase
        .from('submissions')
        .select('id')
        .eq('participant_id', participant.id);

      const submissionIds = mySubmissions?.map((s) => s.id) ?? [];

      let receivedData: PeerReviewWithDetails[] = [];
      if (submissionIds.length > 0) {
        const { data } = await supabase
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
          .in('submission_id', submissionIds)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false });
        receivedData = (data as PeerReviewWithDetails[]) ?? [];
      }

      // Calculate stats
      const completed = reviewsData.peer_reviews?.filter(
        (r: PeerReviewWithDetails) => r.status === 'completed'
      ) ?? [];

      const avgGiven =
        completed.length > 0
          ? completed.reduce((sum: number, r: PeerReviewWithDetails) => sum + (r.rating || 0), 0) /
            completed.length
          : null;

      const avgReceived =
        receivedData.length > 0
          ? receivedData.reduce((sum, r) => sum + (r.rating || 0), 0) /
            receivedData.length
          : null;

      const bonusPoints = completed.reduce(
        (sum: number, r: PeerReviewWithDetails) => sum + r.bonus_points_earned,
        0
      );

      setPeerReviews(reviewsData.peer_reviews ?? []);
      setReceivedReviews(receivedData);
      setStats({
        total_reviews_given: completed.length,
        total_reviews_received: receivedData.length,
        avg_rating_given: avgGiven,
        avg_rating_received: avgReceived,
        bonus_points_earned: bonusPoints,
      });
    } catch (error) {
      console.error('Failed to fetch peer reviews:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUsername, participants]);

  // Fetch peer reviews when user selected
  useEffect(() => {
    if (selectedUsername) {
      localStorage.setItem('my-dashboard-username', selectedUsername);
      fetchPeerReviews();
    }
  }, [selectedUsername, fetchPeerReviews]);

  const pendingReviews = peerReviews.filter((r) => r.status === 'pending');
  const completedReviews = peerReviews.filter((r) => r.status === 'completed');
  const skippedReviews = peerReviews.filter((r) => r.status === 'skipped');

  if (isLoading && !selectedUsername) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!selectedUsername) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#0062FF]" />
            Peer Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            To view peer reviews, select your name:
          </p>
          <Select value={selectedUsername} onValueChange={setSelectedUsername}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select your GitHub username" />
            </SelectTrigger>
            <SelectContent>
              {participants.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} (@{p.nickname || p.github_username || 'no-username'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-[#0062FF]" />
            Peer Reviews
          </h1>
          <p className="text-muted-foreground">
            Anonymous peer review of submissions
          </p>
        </div>
        <Select value={selectedUsername} onValueChange={setSelectedUsername}>
          <SelectTrigger className="w-[250px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {participants.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#0062FF]/10">
                  <Clock className="h-6 w-6 text-[#0062FF]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingReviews.length}</p>
                  <p className="text-sm text-muted-foreground">Pending review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_reviews_given}</p>
                  <p className="text-sm text-muted-foreground">Completed reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-yellow-500/10">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.avg_rating_received?.toFixed(1) ?? '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">Average rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10">
                  <Gift className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.bonus_points_earned}</p>
                  <p className="text-sm text-muted-foreground">Bonus points</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="pending" className="relative">
            <Clock className="mr-2 h-4 w-4" />
            Pending
            {pendingReviews.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-[#0062FF]">
                {pendingReviews.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            <CheckCircle className="mr-2 h-4 w-4" />
            Completed
          </TabsTrigger>
          <TabsTrigger value="received">
            <UserCircle className="mr-2 h-4 w-4" />
            Received
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            {/* Pending Reviews */}
            <TabsContent value="pending" className="space-y-4">
              {pendingReviews.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                      <p className="font-medium">All reviews completed!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        You have no pending reviews at the moment
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                pendingReviews.map((review) => (
                  <PeerReviewCard
                    key={review.id}
                    peerReview={review}
                    onComplete={fetchPeerReviews}
                    isReviewer
                  />
                ))
              )}
            </TabsContent>

            {/* Completed Reviews */}
            <TabsContent value="completed" className="space-y-4">
              {completedReviews.length === 0 && skippedReviews.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="font-medium">No reviews yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        When you complete a review, it will appear here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {completedReviews.map((review) => (
                    <PeerReviewCard
                      key={review.id}
                      peerReview={review}
                      onComplete={fetchPeerReviews}
                      isReviewer
                    />
                  ))}
                  {skippedReviews.length > 0 && (
                    <>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        Skipped ({skippedReviews.length})
                      </p>
                      {skippedReviews.map((review) => (
                        <PeerReviewCard
                          key={review.id}
                          peerReview={review}
                          onComplete={fetchPeerReviews}
                          isReviewer
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </TabsContent>

            {/* Received Reviews */}
            <TabsContent value="received" className="space-y-4">
              {receivedReviews.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="font-medium">No received reviews yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        When someone reviews your submission, it will appear here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Average rating card */}
                  <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Your average peer rating
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-6 w-6 ${
                                  star <= Math.round(stats?.avg_rating_received || 0)
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                            <span className="text-2xl font-bold ml-2">
                              {stats?.avg_rating_received?.toFixed(1) ?? '-'}
                            </span>
                          </div>
                        </div>
                        <Trophy className="h-12 w-12 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>

                  {receivedReviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-medium">
                              Day {review.submissions?.assignments?.day}:{' '}
                              {review.submissions?.assignments?.title}
                            </h4>
                            <div className="flex items-center gap-1 mt-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= (review.rating || 0)
                                      ? 'text-yellow-500 fill-yellow-500'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                            {review.feedback && (
                              <p className="text-sm text-muted-foreground mt-2 italic">
                                &quot;{review.feedback}&quot;
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">
                            {review.is_anonymous ? 'Anonymous' : 'Public'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
