'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLiveSession, useInstructorSession } from '@/hooks/useLiveSession';
import { useLiveSessionPresence } from '@/hooks/usePresence';
import type { LiveSession, MissionDay } from '@/lib/types';
import {
  SkipBack,
  SkipForward,
  Users,
  Clock,
  Radio,
  Copy,
  Check,
  XCircle,
  FileText,
  BookOpen,
  Beaker,
  MessageSquare,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface InstructorControlPanelProps {
  session: LiveSession;
  missionDay: MissionDay;
  instructorName: string;
}

const SECTIONS = [
  { id: 'briefing', name: 'Briefing', icon: FileText },
  { id: 'resources', name: 'Resources', icon: BookOpen },
  { id: 'lab', name: 'Lab', icon: Beaker },
  { id: 'debrief', name: 'Debrief', icon: MessageSquare },
];

export function InstructorControlPanel({
  session,
  missionDay,
  instructorName,
}: InstructorControlPanelProps) {
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const {
    sessionState,
    participants,
    isConnected,
    error,
    sendStateUpdate,
  } = useLiveSession({
    code: session.join_code || '',
    isInstructor: true,
    onSessionEnd: () => {
      toast.info('Session ended');
      router.push('/live-session');
    },
  });

  const { updateStep, updateSection, endSession, isUpdating } = useInstructorSession(
    session.join_code || ''
  );

  // Presence tracking for real-time online status
  const { users: presenceUsers, onlineCount } = useLiveSessionPresence(
    session.join_code || '',
    {
      id: 'instructor',
      name: instructorName,
      avatar_url: null,
      role: 'Instructor',
    }
  );

  // Combine API participants with presence data for accurate display
  const displayParticipants = presenceUsers.length > 0 ? presenceUsers : participants;

  // Timer
  useEffect(() => {
    const startTime = new Date(session.started_at).getTime();
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [session.started_at]);

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy code to clipboard
  const copyCode = () => {
    navigator.clipboard.writeText(session.join_code || '');
    setCopiedCode(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Handle step navigation
  const handlePrevStep = useCallback(async () => {
    try {
      const result = await updateStep('prev');
      sendStateUpdate({ currentStep: result.session.current_step });
      toast.success('Moved to previous step');
    } catch {
      toast.error('Failed to update step');
    }
  }, [updateStep, sendStateUpdate]);

  const handleNextStep = useCallback(async () => {
    try {
      const result = await updateStep('next');
      sendStateUpdate({ currentStep: result.session.current_step });
      toast.success('Moved to next step');
    } catch {
      toast.error('Failed to update step');
    }
  }, [updateStep, sendStateUpdate]);

  // Handle section change
  const handleSectionChange = useCallback(async (section: string) => {
    try {
      await updateSection(section);
      sendStateUpdate({ currentSection: section });
      toast.success(`Switched to ${section}`);
    } catch {
      toast.error('Failed to change section');
    }
  }, [updateSection, sendStateUpdate]);

  // Handle end session
  const handleEndSession = async () => {
    setIsEnding(true);
    try {
      await endSession();
      sendStateUpdate({ isActive: false });
      toast.success('Session ended');
      router.push('/live-session');
    } catch {
      toast.error('Failed to end session');
    } finally {
      setIsEnding(false);
      setEndDialogOpen(false);
    }
  };

  const currentStep = sessionState?.currentStep ?? session.current_step ?? 1;
  const currentSection = sessionState?.currentSection ?? session.current_section ?? 'briefing';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="h-5 w-5 text-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-500">LIVE</span>
            {isConnected ? (
              <Badge variant="outline" className="text-green-500 border-green-500">
                <Wifi className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-500 border-red-500">
                <WifiOff className="h-3 w-3 mr-1" />
                Disconnected
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold">Instructor Control Panel</h1>
          <p className="text-muted-foreground">
            Day {missionDay.day}: {missionDay.title}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xl font-bold">{formatTime(elapsedTime)}</span>
            </div>
          </Card>

          {/* End Session */}
          <Button
            variant="destructive"
            onClick={() => setEndDialogOpen(true)}
          >
            <XCircle className="mr-2 h-4 w-4" />
            End Session
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Card className="border-red-500 bg-red-500/10">
          <CardContent className="pt-6 text-red-500">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Code */}
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Session Code</p>
                  <p className="text-4xl font-mono font-bold tracking-widest">
                    {session.join_code}
                  </p>
                </div>
                <Button variant="outline" size="lg" onClick={copyCode}>
                  {copiedCode ? (
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
              <CardDescription>
                Control the session progress for all participants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePrevStep}
                  disabled={isUpdating || currentStep <= 1}
                >
                  <SkipBack className="mr-2 h-5 w-5" />
                  Previous
                </Button>

                <div className="text-center px-8">
                  <p className="text-sm text-muted-foreground">Current Step</p>
                  <p className="text-4xl font-bold">{currentStep}</p>
                </div>

                <Button
                  size="lg"
                  onClick={handleNextStep}
                  disabled={isUpdating}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Next
                  <SkipForward className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Section Tabs */}
              <div>
                <p className="text-sm text-muted-foreground mb-3">Current Section</p>
                <Tabs value={currentSection} onValueChange={handleSectionChange}>
                  <TabsList className="grid w-full grid-cols-4">
                    {SECTIONS.map((section) => {
                      const Icon = section.icon;
                      return (
                        <TabsTrigger
                          key={section.id}
                          value={section.id}
                          className="flex items-center gap-2"
                          disabled={isUpdating}
                        >
                          <Icon className="h-4 w-4" />
                          {section.name}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Content Preview</CardTitle>
              <CardDescription>
                What participants are seeing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={currentSection}>
                <TabsContent value="briefing">
                  <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                    <h3 className="font-bold mb-2">Day {missionDay.day} Briefing</h3>
                    <p className="text-sm whitespace-pre-wrap">
                      {missionDay.briefing_content || missionDay.subtitle || 'No briefing content available'}
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="resources">
                  <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                    <h3 className="font-bold mb-2">Resources</h3>
                    <p className="text-sm whitespace-pre-wrap">
                      {missionDay.resources_content || 'No resources content available'}
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="lab">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-bold mb-2">Lab Exercise</h3>
                    <p className="text-sm text-muted-foreground">
                      Hands-on practice section
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="debrief">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-bold mb-2">Debrief</h3>
                    <p className="text-sm text-muted-foreground">
                      Wrap-up and Q&A section
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Participants */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants
                </span>
                <Badge variant="secondary">{onlineCount}</Badge>
              </CardTitle>
              <CardDescription>
                Students connected to this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {onlineCount > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {displayParticipants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={p.avatar_url || undefined} />
                        <AvatarFallback>
                          {p.name?.split(' ').map((n) => n[0]).join('') || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.role}</p>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-green-500" title="Online" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No participants yet</p>
                  <p className="text-sm">Share the code to let students join</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Info */}
          <Card>
            <CardHeader>
              <CardTitle>Session Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Instructor</span>
                <span>{instructorName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Started</span>
                <span>{new Date(session.started_at).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Day</span>
                <span>Day {missionDay.day}</span>
              </div>
              {missionDay.tech_skills_focus && missionDay.tech_skills_focus.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Topics</p>
                  <div className="flex flex-wrap gap-1">
                    {missionDay.tech_skills_focus.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* End Session Dialog */}
      <AlertDialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Live Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect all {onlineCount} participants and end the session.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isEnding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndSession}
              disabled={isEnding}
              className="bg-red-500 hover:bg-red-600"
            >
              {isEnding ? 'Ending...' : 'End Session'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
