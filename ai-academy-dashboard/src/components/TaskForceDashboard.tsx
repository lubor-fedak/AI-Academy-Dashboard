'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  TaskForce,
  PilotClient,
  Participant,
  ParticipantMastery,
  CLEARANCE_COLORS,
  CLEARANCE_LABELS,
  ROLE_COLORS,
  URGENCY_COLORS,
  ClearanceLevel,
  RoleType,
  ClientUrgency,
} from '@/lib/types';
import {
  Users,
  Target,
  ChevronRight,
  ArrowLeft,
  Shield,
  Star,
  AlertTriangle,
  Building2,
  MapPin,
  User,
} from 'lucide-react';

interface TaskForceDashboardProps {
  taskForce: TaskForce & { pilot_clients: PilotClient | null };
  members: Array<{
    id: string;
    participant_id: string;
    is_team_lead: boolean;
    participants: Participant | null;
    mastery: ParticipantMastery | null;
  }>;
  roleStats: Record<string, {
    total: number;
    specialists: number;
    field_ready: number;
    field_trainee: number;
    trainee: number;
  }>;
  overallReadiness: number;
  teamLeads: Array<{
    id: string;
    participant_id: string;
    is_team_lead: boolean;
    participants: Participant | null;
    mastery: ParticipantMastery | null;
  }>;
}

export function TaskForceDashboard({
  taskForce,
  members,
  roleStats,
  overallReadiness,
  teamLeads,
}: TaskForceDashboardProps) {
  const client = taskForce.pilot_clients;

  // Calculate clearance distribution
  const clearanceDistribution = members.reduce((acc, m) => {
    const clearance = m.mastery?.clearance || 'TRAINEE';
    acc[clearance] = (acc[clearance] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/mission" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Mission Hub</span>
        </Link>
      </div>

      {/* Title Section */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{taskForce.display_name}</h1>
              {client && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Target: {client.name}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-primary">{overallReadiness}%</div>
          <p className="text-sm text-muted-foreground">Overall Readiness</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-sm text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Star className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clearanceDistribution['SPECIALIST'] || 0}</p>
                <p className="text-sm text-muted-foreground">Specialists</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clearanceDistribution['FIELD_READY'] || 0}</p>
                <p className="text-sm text-muted-foreground">Field Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Target className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Object.keys(roleStats).length}</p>
                <p className="text-sm text-muted-foreground">Role Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Client Dossier Summary */}
        {client && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Client: {client.name}
              </CardTitle>
              <CardDescription>{client.sector}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{client.city}, {client.country}</span>
                </div>
                {client.employees && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{client.employees.toLocaleString()} employees</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge className={URGENCY_COLORS[client.urgency as ClientUrgency]}>
                  {client.urgency?.toUpperCase()} URGENCY
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">{client.situation}</p>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Pain Points
                </h4>
                <ul className="space-y-1">
                  {client.pain_points?.slice(0, 3).map((point, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {client.stakeholder_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Stakeholder: <strong>{client.stakeholder_name}</strong> ({client.stakeholder_title})</span>
                </div>
              )}

              <Link href={`/mission/client/${client.id}`}>
                <Button variant="outline" className="w-full">
                  View Full Client Dossier
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Role Readiness */}
        <Card>
          <CardHeader>
            <CardTitle>Role Readiness</CardTitle>
            <CardDescription>Progress by role specialization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(roleStats).map(([role, stats]) => {
              const readiness = Math.round(
                ((stats.specialists * 4 + stats.field_ready * 3 + stats.field_trainee * 2 + stats.trainee * 1) /
                  (stats.total * 4)) *
                  100
              );
              return (
                <div key={role} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${ROLE_COLORS[role as RoleType] || 'bg-gray-500'}`} />
                      <span className="font-medium">{role}</span>
                      <span className="text-muted-foreground">({stats.total})</span>
                    </div>
                    <span className="font-medium">{readiness}%</span>
                  </div>
                  <Progress value={readiness} className="h-2" />
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {stats.specialists > 0 && (
                      <span className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {stats.specialists} Specialist
                      </span>
                    )}
                    {stats.field_ready > 0 && (
                      <span className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        {stats.field_ready} Field Ready
                      </span>
                    )}
                    {stats.field_trainee > 0 && (
                      <span className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        {stats.field_trainee} Field Trainee
                      </span>
                    )}
                    {stats.trainee > 0 && (
                      <span className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
                        {stats.trainee} Trainee
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Team Leads */}
      {teamLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Leads</CardTitle>
            <CardDescription>Your points of contact for this task force</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teamLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={lead.participants?.avatar_url || ''} />
                    <AvatarFallback>
                      {lead.participants?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{lead.participants?.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {lead.participants?.role}
                      </Badge>
                      {lead.mastery && (
                        <Badge className={`text-xs ${CLEARANCE_COLORS[lead.mastery.clearance as ClearanceLevel]}`}>
                          {CLEARANCE_LABELS[lead.mastery.clearance as ClearanceLevel]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({members.length})</CardTitle>
          <CardDescription>All members of {taskForce.display_name}</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => (
                <Link
                  key={member.id}
                  href={`/participant/${member.participants?.github_username}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.participants?.avatar_url || ''} />
                    <AvatarFallback>
                      {member.participants?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate text-sm">{member.participants?.name}</p>
                      {member.is_team_lead && (
                        <Star className="h-3 w-3 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {member.participants?.role}
                      </Badge>
                      {member.mastery && (
                        <div className={`h-2 w-2 rounded-full ${CLEARANCE_COLORS[member.mastery.clearance as ClearanceLevel]}`} />
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No members assigned to this task force yet.</p>
              <p className="text-sm">Members will be assigned during the team formation phase.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
