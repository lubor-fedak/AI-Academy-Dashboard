'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  MissionDay,
  TaskForce,
  PilotClient,
  IntelDrop,
  ParticipantMastery,
  ACT_NAMES,
  ACT_WEEKS,
  CLEARANCE_COLORS,
  CLEARANCE_LABELS,
  ClearanceLevel,
} from '@/lib/types';
import {
  CheckCircle2,
  Circle,
  Lock,
  AlertTriangle,
  ChevronRight,
  Users,
  Target,
  FileText,
  Zap,
} from 'lucide-react';

interface MissionHubProps {
  missionDays: MissionDay[];
  taskForces: (TaskForce & { pilot_clients: PilotClient | null })[];
  pilotClients: PilotClient[];
  intelDrops: IntelDrop[];
  currentProgramDay: number;
  participant: {
    id: string;
    name: string;
    role: string;
  } | null;
  participantTaskForce: TaskForce | null;
  participantClient: PilotClient | null;
  participantMastery: ParticipantMastery | null;
}

export function MissionHub({
  missionDays,
  taskForces,
  intelDrops,
  currentProgramDay,
  participant,
  participantTaskForce,
  participantClient,
  participantMastery,
}: MissionHubProps) {
  const [selectedAct, setSelectedAct] = useState<number | null>(null);

  // Get current day info
  const currentDay = missionDays.find(d => d.day === currentProgramDay);

  // Group days by act
  const daysByAct = missionDays.reduce((acc, day) => {
    if (!acc[day.act]) acc[day.act] = [];
    acc[day.act].push(day);
    return acc;
  }, {} as Record<number, MissionDay[]>);

  // Get clearance info
  const clearance = participantMastery?.clearance ?? 'TRAINEE';
  const masteryLevel = participantMastery?.mastery_level ?? 1;

  // Check if day is accessible
  const isDayAccessible = (day: MissionDay) => {
    if (!day.unlock_date) return true;
    const unlockDate = new Date(day.unlock_date);
    return new Date() >= unlockDate;
  };

  // Get day status
  const getDayStatus = (day: MissionDay) => {
    if (day.day < currentProgramDay) return 'completed';
    if (day.day === currentProgramDay) return 'current';
    if (!isDayAccessible(day)) return 'locked';
    return 'upcoming';
  };

  // Recent intel drops (show latest 3)
  const recentIntelDrops = intelDrops.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Today's Mission Card */}
      {currentDay && (
        <Card className="border-blue-500/30 bg-gradient-to-r from-blue-500/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription className="text-blue-500">TODAY&apos;S MISSION</CardDescription>
                <CardTitle className="text-2xl">Day {currentDay.day}: {currentDay.title}</CardTitle>
              </div>
              {participantTaskForce && (
                <Badge variant="outline" className="text-sm">
                  Task Force {participantTaskForce.name} | {clearance && CLEARANCE_LABELS[clearance as ClearanceLevel]}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-muted-foreground">{currentDay.subtitle}</p>
                {currentDay.tech_skills_focus && currentDay.tech_skills_focus.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {currentDay.tech_skills_focus.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Link href={`/mission/day/${currentDay.day}`}>
                <Button size="lg" className="w-full md:w-auto">
                  Access Today&apos;s Briefing
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Program Progress */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((act) => {
          const actDays = daysByAct[act] || [];
          const completedDays = actDays.filter(d => getDayStatus(d) === 'completed').length;
          const progress = actDays.length > 0 ? (completedDays / actDays.length) * 100 : 0;
          const isCurrentAct = actDays.some(d => d.day === currentProgramDay);

          return (
            <Card
              key={act}
              className={`cursor-pointer transition-all hover:border-primary/50 ${
                isCurrentAct ? 'border-primary ring-1 ring-primary/20' : ''
              } ${selectedAct === act ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedAct(selectedAct === act ? null : act)}
            >
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider">
                  ACT {act}: {ACT_NAMES[act]}
                </CardDescription>
                <CardTitle className="text-sm font-medium">{ACT_WEEKS[act]}</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {completedDays} / {actDays.length} days
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Day Grid - Shown when act is selected */}
      {selectedAct && daysByAct[selectedAct] && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ACT {selectedAct}: {ACT_NAMES[selectedAct]}</CardTitle>
            <CardDescription>{ACT_WEEKS[selectedAct]}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {daysByAct[selectedAct].map((day) => {
                const status = getDayStatus(day);
                return (
                  <Link
                    key={day.day}
                    href={status !== 'locked' ? `/mission/day/${day.day}` : '#'}
                    className={`
                      relative p-3 rounded-lg border text-center transition-all
                      ${status === 'completed' ? 'bg-green-500/10 border-green-500/30 hover:border-green-500' : ''}
                      ${status === 'current' ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20' : ''}
                      ${status === 'upcoming' ? 'bg-muted/50 border-border hover:border-primary/50' : ''}
                      ${status === 'locked' ? 'bg-muted/30 border-border cursor-not-allowed opacity-50' : ''}
                    `}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {status === 'current' && <Circle className="h-5 w-5 text-blue-500 fill-blue-500" />}
                      {status === 'upcoming' && <Circle className="h-5 w-5 text-muted-foreground" />}
                      {status === 'locked' && <Lock className="h-5 w-5 text-muted-foreground" />}
                      <span className="font-semibold">Day {day.day}</span>
                      <span className="text-xs text-muted-foreground truncate w-full">
                        {day.codename || day.title}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Intel Drops & Task Force Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Intel Drops */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Intel Drops
              </CardTitle>
              <CardDescription>Latest briefings and updates</CardDescription>
            </div>
            <Link href="/intel">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentIntelDrops.length > 0 ? (
              <div className="space-y-3">
                {recentIntelDrops.map((intel) => (
                  <div
                    key={intel.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      intel.classification === 'URGENT' ? 'text-red-500' :
                      intel.classification === 'CLASSIFIED' ? 'text-amber-500' :
                      'text-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{intel.title}</span>
                        <Badge variant="outline" className="text-xs">
                          Day {intel.day}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {intel.content.split('\n')[0]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                No intel drops released yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Task Force / Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              {participantTaskForce ? `Task Force ${participantTaskForce.name}` : 'Task Forces'}
            </CardTitle>
            <CardDescription>
              {participantClient ? `Target: ${participantClient.name}` : 'Team assignments'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {participantTaskForce && participantClient ? (
              <div className="space-y-4">
                {/* Client Info */}
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{participantClient.icon}</span>
                    <div>
                      <h4 className="font-semibold">{participantClient.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {participantClient.sector} | {participantClient.city}, {participantClient.country}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={
                        participantClient.urgency === 'critical' ? 'destructive' :
                        participantClient.urgency === 'high' ? 'default' :
                        'secondary'
                      }
                    >
                      {participantClient.urgency?.toUpperCase()} URGENCY
                    </Badge>
                    {participantClient.stakeholder_name && (
                      <span className="text-sm text-muted-foreground">
                        Stakeholder: {participantClient.stakeholder_name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {participantClient.situation}
                  </p>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/team/${participantTaskForce.name.toLowerCase()}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      Team Dashboard
                    </Button>
                  </Link>
                  <Link href={`/mission/client/${participantClient.id}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Client Dossier
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {taskForces.map((tf) => (
                  <Link
                    key={tf.id}
                    href={`/team/${tf.name.toLowerCase()}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="font-medium">{tf.display_name}</span>
                        {tf.pilot_clients && (
                          <p className="text-xs text-muted-foreground">
                            {tf.pilot_clients.icon} {tf.pilot_clients.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mastery Progress */}
      {participant && (
        <Card>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>
              {participant.name} | {participant.role} Track
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Clearance Level Progress */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Current Clearance</p>
                  <div className="flex items-center gap-2">
                    <Badge className={CLEARANCE_COLORS[clearance as ClearanceLevel]}>
                      {CLEARANCE_LABELS[clearance as ClearanceLevel]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Level {masteryLevel} of 4
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Days Completed</p>
                  <p className="text-2xl font-bold">
                    {participantMastery?.days_completed ?? 0}
                    <span className="text-sm font-normal text-muted-foreground"> / 25</span>
                  </p>
                </div>
              </div>

              {/* Level Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mastery Progress</span>
                  <span>{Math.round((masteryLevel / 4) * 100)}%</span>
                </div>
                <div className="relative">
                  <Progress value={(masteryLevel / 4) * 100} className="h-3" />
                  <div className="absolute top-0 left-0 w-full h-3 flex">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="flex-1 border-r border-background last:border-r-0"
                        title={CLEARANCE_LABELS[(['TRAINEE', 'FIELD_TRAINEE', 'FIELD_READY', 'SPECIALIST'][level - 1]) as ClearanceLevel]}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Trainee</span>
                  <span>Field Trainee</span>
                  <span>Field Ready</span>
                  <span>Specialist</span>
                </div>
              </div>

              <Link href="/my-progress">
                <Button variant="outline" className="w-full">
                  View Full Progress Dashboard
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="h-4 w-4 text-blue-500 fill-blue-500" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="h-4 w-4 text-muted-foreground" />
          <span>Upcoming</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span>Locked</span>
        </div>
      </div>
    </div>
  );
}
