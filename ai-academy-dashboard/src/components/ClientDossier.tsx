'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  PilotClient,
  TaskForce,
  URGENCY_COLORS,
  ClientUrgency,
} from '@/lib/types';
import {
  Building2,
  MapPin,
  Users,
  AlertTriangle,
  Shield,
  Target,
  User,
  FileText,
  ArrowLeft,
  ChevronRight,
  Globe,
  TrendingUp,
} from 'lucide-react';

interface ClientDossierProps {
  client: PilotClient;
  taskForce: TaskForce | null;
}

export function ClientDossier({ client, taskForce }: ClientDossierProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/mission" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Mission Hub</span>
        </Link>
        <Badge variant="outline" className="font-mono">
          CLASSIFICATION: PROGRAM USE ONLY
        </Badge>
      </div>

      {/* Dossier Header */}
      <Card className="border-primary/30">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardDescription className="text-xs uppercase tracking-wider">
                PILOT CLIENT DOSSIER
              </CardDescription>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{client.icon}</span>
                <div>
                  <CardTitle className="text-3xl">{client.name}</CardTitle>
                  <p className="text-muted-foreground">{client.codename}</p>
                </div>
              </div>
            </div>
            <Badge className={`${URGENCY_COLORS[client.urgency as ClientUrgency]} text-white`}>
              {client.urgency?.toUpperCase()} URGENCY
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3 py-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Sector</p>
                <p className="font-medium">{client.sector}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Headquarters</p>
                <p className="font-medium">{client.city}, {client.country}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="font-medium">{client.employees?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Situation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Situation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {client.situation}
            </p>
          </CardContent>
        </Card>

        {/* Key Stakeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Key Stakeholder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-xl font-semibold">{client.stakeholder_name}</p>
                <p className="text-muted-foreground">{client.stakeholder_title}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground">
              Primary point of contact for all client communications. All major decisions
              and approvals must go through this stakeholder.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pain Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Pain Points
          </CardTitle>
          <CardDescription>
            Critical challenges that need to be addressed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {client.pain_points?.map((point, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30"
              >
                <div className="h-6 w-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm">{point}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Act Compliance */}
      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            AI Act Compliance Concern
          </CardTitle>
          <CardDescription>
            Regulatory considerations specific to this client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <p className="text-sm font-medium text-red-500 mb-2">COMPLIANCE ALERT</p>
            <p>{client.ai_act_concern}</p>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              <strong>Note:</strong> All AI solutions deployed for this client must be reviewed
              by the AI-SEC team to ensure compliance with the EU AI Act. High-risk AI systems
              require additional documentation and human oversight mechanisms.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Task Force */}
      {taskForce && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Assigned Task Force
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border bg-primary/5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-semibold">{taskForce.display_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {taskForce.current_size} members assigned
                  </p>
                </div>
              </div>
              <Link href={`/team/${taskForce.name.toLowerCase()}`}>
                <Button>
                  View Team
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategic Approach */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Strategic Approach
          </CardTitle>
          <CardDescription>
            Recommended engagement strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">1</div>
                Understand
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Map current processes</li>
                <li>• Identify data sources</li>
                <li>• Document pain points</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">2</div>
                Build
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Rapid PoC development</li>
                <li>• Iterate with stakeholders</li>
                <li>• Security review</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">3</div>
                Deploy
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Production hardening</li>
                <li>• Knowledge transfer</li>
                <li>• Monitoring setup</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Industry Analysis
            </Button>
            <Button variant="outline" className="justify-start">
              <Shield className="mr-2 h-4 w-4" />
              AI Act Requirements
            </Button>
            <Button variant="outline" className="justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              Competitor Analysis
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="mr-2 h-4 w-4" />
              Stakeholder Map
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
