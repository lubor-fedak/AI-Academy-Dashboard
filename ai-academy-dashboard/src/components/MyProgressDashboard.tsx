'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Participant,
  ParticipantMastery,
  TaskForce,
  PilotClient,
  RecognitionType,
  ParticipantRecognition,
  MissionDay,
  CLEARANCE_COLORS,
  CLEARANCE_LABELS,
  ClearanceLevel,
  ACT_NAMES,
} from '@/lib/types';
import {
  User,
  Shield,
  Target,
  Star,
  CheckCircle2,
  Circle,
  ChevronRight,
  Award,
  Calendar,
  FileText,
  Users,
  TrendingUp,
} from 'lucide-react';

interface MyProgressDashboardProps {
  participant: Participant;
  mastery: ParticipantMastery | null;
  taskForce: (TaskForce & { pilot_clients: PilotClient | null }) | null;
  client: PilotClient | null;
  recognitionsEarned: (ParticipantRecognition & { recognition_types: RecognitionType })[];
  allRecognitionTypes: RecognitionType[];
  missionDays: MissionDay[];
  completedDays: number[];
  totalSubmissions: number;
}

export function MyProgressDashboard({
  participant,
  mastery,
  taskForce,
  client,
  recognitionsEarned,
  allRecognitionTypes,
  missionDays,
  completedDays,
  totalSubmissions,
}: MyProgressDashboardProps) {
  const clearance = mastery?.clearance ?? 'TRAINEE';
  const masteryLevel = mastery?.mastery_level ?? 1;

  // Calculate progress percentages based on unlocked days only
  const daysCompleted = completedDays.length;
  const unlockedDaysCount = missionDays.length; // missionDays is already filtered to unlocked only
  const daysProgress = unlockedDaysCount > 0 ? Math.round((daysCompleted / unlockedDaysCount) * 100) : 0;

  // Group days by act
  const daysByAct = missionDays.reduce((acc, day) => {
    if (!acc[day.act]) acc[day.act] = [];
    acc[day.act].push(day);
    return acc;
  }, {} as Record<number, MissionDay[]>);

  // Clearance levels with descriptions
  const clearanceLevels = [
    { level: 'TRAINEE', label: 'Trainee', description: 'Understanding the basics' },
    { level: 'FIELD_TRAINEE', label: 'Field Trainee', description: 'Building core skills' },
    { level: 'FIELD_READY', label: 'Field Ready', description: 'Working independently' },
    { level: 'SPECIALIST', label: 'Specialist', description: 'Ready for deployment' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Journey</h1>
          <p className="text-muted-foreground">
            {participant.name} | {participant.role} Track
            {taskForce && ` | ${taskForce.display_name}`}
          </p>
        </div>
        <Badge className={CLEARANCE_COLORS[clearance as ClearanceLevel]}>
          {CLEARANCE_LABELS[clearance as ClearanceLevel]}
        </Badge>
      </div>

      {/* Mastery Level Card */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Mastery Level
          </CardTitle>
          <CardDescription>Your progression through clearance levels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visual Level Progression */}
          <div className="relative">
            <div className="flex justify-between mb-2">
              {clearanceLevels.map((level, index) => (
                <div
                  key={level.level}
                  className={`flex flex-col items-center ${
                    index < masteryLevel ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                      level.level === clearance
                        ? 'bg-primary text-primary-foreground border-primary'
                        : index < masteryLevel - 1
                        ? 'bg-primary/20 border-primary'
                        : 'bg-muted border-muted-foreground/30'
                    }`}
                  >
                    {index < masteryLevel - 1 ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : level.level === clearance ? (
                      <Circle className="h-5 w-5 fill-current" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs mt-2 font-medium text-center hidden sm:block">{level.label}</span>
                </div>
              ))}
            </div>
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${((masteryLevel - 1) / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Level Details */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Current: {CLEARANCE_LABELS[clearance as ClearanceLevel]}</h3>
              <Badge variant="outline">Level {masteryLevel} of 4</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {clearanceLevels.find(l => l.level === clearance)?.description}
            </p>
          </div>

          {/* Requirements for Next Level */}
          {masteryLevel < 4 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">To reach {clearanceLevels[masteryLevel]?.label}:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {masteryLevel === 1 && (
                  <>
                    <li className="flex items-center gap-2">
                      <Circle className="h-3 w-3" /> Complete role-specific intro
                    </li>
                    <li className="flex items-center gap-2">
                      <Circle className="h-3 w-3" /> Demonstrate tool proficiency
                    </li>
                    <li className="flex items-center gap-2">
                      <Circle className="h-3 w-3" /> Pass Week 1 checkpoint
                    </li>
                  </>
                )}
                {masteryLevel === 2 && (
                  <>
                    <li className="flex items-center gap-2">
                      <Circle className="h-3 w-3" /> Complete Week 2 deep dive
                    </li>
                    <li className="flex items-center gap-2">
                      <Circle className="h-3 w-3" /> Create independent artifacts
                    </li>
                    <li className="flex items-center gap-2">
                      <Circle className="h-3 w-3" /> Participate in peer review
                    </li>
                  </>
                )}
                {masteryLevel === 3 && (
                  <>
                    <li className="flex items-center gap-2">
                      <Circle className="h-3 w-3" /> Contribute to team project
                    </li>
                    <li className="flex items-center gap-2">
                      <Circle className="h-3 w-3" /> Handle client scenarios
                    </li>
                    <li className="flex items-center gap-2">
                      <Circle className="h-3 w-3" /> Participate in hackathon
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{daysCompleted} / {unlockedDaysCount}</p>
                <p className="text-sm text-muted-foreground">Days Completed</p>
              </div>
            </div>
            <Progress value={daysProgress} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <FileText className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSubmissions}</p>
                <p className="text-sm text-muted-foreground">Artifacts Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mastery?.peer_assists_given ?? 0}</p>
                <p className="text-sm text-muted-foreground">Peer Assists</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Award className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recognitionsEarned.length}</p>
                <p className="text-sm text-muted-foreground">Recognitions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Task Force / Client */}
        {taskForce && client && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">{taskForce.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Target: {client.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-2xl">{client.icon}</span>
                  <div>
                    <p>{client.sector}</p>
                    <p className="text-muted-foreground">{client.city}, {client.country}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/team/${taskForce.name.toLowerCase()}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Team Dashboard
                  </Button>
                </Link>
                <Link href={`/mission/client/${client.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Client Dossier
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recognitions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Recognitions
            </CardTitle>
            <CardDescription>Acknowledgments for your contributions</CardDescription>
          </CardHeader>
          <CardContent>
            {recognitionsEarned.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {recognitionsEarned.map((recognition) => (
                  <div
                    key={recognition.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-amber-500/5 to-transparent"
                  >
                    <span className="text-2xl">{recognition.recognition_types.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{recognition.recognition_types.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(recognition.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No recognitions earned yet.</p>
                <p className="text-sm">Keep up the great work!</p>
              </div>
            )}

            <Separator className="my-4" />

            {/* Available Recognitions */}
            <div>
              <h4 className="text-sm font-medium mb-3">Available Recognitions</h4>
              <div className="grid grid-cols-5 gap-2">
                {allRecognitionTypes.map((type) => {
                  const earned = recognitionsEarned.some(r => r.recognition_type_id === type.id);
                  return (
                    <div
                      key={type.id}
                      className={`text-center p-2 rounded-lg border ${
                        earned ? 'bg-amber-500/10 border-amber-500/30' : 'opacity-30'
                      }`}
                      title={`${type.name}: ${type.description}`}
                    >
                      <span className="text-2xl">{type.icon}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mission Progress by Act - only show acts that have unlocked days */}
      {missionDays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Mission Progress
            </CardTitle>
            <CardDescription>Your journey through the program</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3, 4].map((act) => {
              const actDays = daysByAct[act] || [];
              // Skip acts with no unlocked days
              if (actDays.length === 0) return null;

              const actCompleted = actDays.filter(d => completedDays.includes(d.day)).length;
              const actProgress = actDays.length > 0 ? Math.round((actCompleted / actDays.length) * 100) : 0;

              return (
                <div key={act} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">ACT {act}: {ACT_NAMES[act]}</h4>
                      <p className="text-sm text-muted-foreground">
                        {actCompleted} of {actDays.length} days completed
                      </p>
                    </div>
                    <span className="text-lg font-bold">{actProgress}%</span>
                  </div>
                  <div className="flex gap-1">
                    {actDays.map((day) => {
                      const isCompleted = completedDays.includes(day.day);
                      return (
                        <Link
                          key={day.day}
                          href={`/mission/day/${day.day}`}
                          className={`flex-1 h-2 rounded-full transition-colors ${
                            isCompleted ? 'bg-green-500' : 'bg-muted'
                          }`}
                          title={`Day ${day.day}: ${day.title}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Motivational Quote */}
      <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
        <CardContent className="pt-6">
          <blockquote className="text-center space-y-2">
            <p className="text-lg italic text-muted-foreground">
              &ldquo;Every day you show up is a day you grow. The goal isn&apos;t perfection - it&apos;s progress.&rdquo;
            </p>
          </blockquote>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/mission">
          <Button>
            <Target className="mr-2 h-4 w-4" />
            Mission Hub
          </Button>
        </Link>
        <Link href="/my-dashboard">
          <Button variant="outline">
            <User className="mr-2 h-4 w-4" />
            Submissions
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link href="/peer-reviews">
          <Button variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Peer Reviews
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
