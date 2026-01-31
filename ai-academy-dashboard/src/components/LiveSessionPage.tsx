'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MissionDay, LiveSession, ACT_NAMES } from '@/lib/types';
import {
  Play,
  Users,
  Radio,
  ArrowLeft,
  Copy,
  Check,
  Tv,
  Calendar,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

interface LiveSessionPageProps {
  missionDays: MissionDay[];
  activeSessions: (LiveSession & { mission_days: MissionDay | null })[];
  isInstructor: boolean;
  userId: string | null;
}

export function LiveSessionPage({
  missionDays,
  activeSessions,
  isInstructor,
  userId,
}: LiveSessionPageProps) {
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [joinCode, setJoinCode] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  const handleStartSession = async () => {
    if (!selectedDay || !userId) return;

    setIsStarting(true);
    setError(null);

    try {
      // Generate a join code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { error: insertError } = await supabase
        .from('live_sessions')
        .insert({
          instructor_id: userId,
          mission_day_id: parseInt(selectedDay),
          join_code: code,
          is_active: true,
        });

      if (insertError) throw insertError;

      // Redirect to the live session control page
      window.location.href = `/live-session/control?code=${code}`;
    } catch (err) {
      setError('Failed to start session. Please try again.');
      console.error(err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim()) return;

    setIsJoining(true);
    setError(null);

    try {
      const { data: session, error: fetchError } = await supabase
        .from('live_sessions')
        .select('id, join_code, is_active')
        .eq('join_code', joinCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (fetchError || !session) {
        setError('Session not found or no longer active.');
        return;
      }

      // Redirect to the live session view
      window.location.href = `/live-session/view?code=${session.join_code}`;
    } catch (err) {
      setError('Failed to join session. Please check the code and try again.');
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/mission" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Mission Hub</span>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Sessions</h1>
        <p className="text-muted-foreground">
          Join or start a live instructor-led session
        </p>
      </div>

      {/* Error display */}
      {error && (
        <Card className="border-red-500 bg-red-500/10">
          <CardContent className="pt-6 text-red-500">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Join Session */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tv className="h-5 w-5" />
              Join a Session
            </CardTitle>
            <CardDescription>
              Enter the session code provided by your instructor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="joinCode">Session Code</Label>
              <Input
                id="joinCode"
                placeholder="e.g., ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
              />
            </div>
            <Button
              onClick={handleJoinSession}
              disabled={!joinCode.trim() || isJoining}
              className="w-full"
            >
              {isJoining ? 'Joining...' : 'Join Session'}
            </Button>
          </CardContent>
        </Card>

        {/* Start Session (Instructors only) */}
        {isInstructor ? (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Start a Session
              </CardTitle>
              <CardDescription>
                Create a new live session for participants to join
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="daySelect">Select Mission Day</Label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a day..." />
                  </SelectTrigger>
                  <SelectContent>
                    {missionDays.map((day) => (
                      <SelectItem key={day.id} value={String(day.id)}>
                        Day {day.day}: {day.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleStartSession}
                disabled={!selectedDay || isStarting}
                className="w-full"
              >
                {isStarting ? 'Starting...' : 'Start Live Session'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Start a Session
              </CardTitle>
              <CardDescription>
                Only instructors can start live sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                If you are an instructor and need access, please contact an administrator.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-green-500 animate-pulse" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Currently running live sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSessions.length > 0 ? (
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Radio className="h-5 w-5 text-green-500 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Day {session.mission_days?.day}: {session.mission_days?.title}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Started {new Date(session.started_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <p className="text-xs text-muted-foreground">Session Code</p>
                      <p className="font-mono font-bold text-lg">{session.join_code}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(session.join_code || '')}
                    >
                      {copiedCode === session.join_code ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setJoinCode(session.join_code || '');
                        handleJoinSession();
                      }}
                    >
                      Join
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Radio className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No active sessions at this time.</p>
              <p className="text-sm">Sessions will appear here when instructors start them.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Sessions (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Sessions
          </CardTitle>
          <CardDescription>
            Scheduled live sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {missionDays.slice(0, 5).map((day) => (
              <div
                key={day.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-sm font-bold">
                    {day.day}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{day.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ACT_NAMES[day.act]} • {day.unlock_date}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {new Date(day.unlock_date || '') > new Date() ? 'Scheduled' : 'Available'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
