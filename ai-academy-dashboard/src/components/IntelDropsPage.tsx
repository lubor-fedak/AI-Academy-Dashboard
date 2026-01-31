'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IntelDrop } from '@/lib/types';
import {
  AlertTriangle,
  Shield,
  FileText,
  ArrowLeft,
  Calendar,
  Users,
  Filter,
} from 'lucide-react';

interface IntelDropsPageProps {
  intelDrops: IntelDrop[];
  userTaskForce: string | null;
}

export function IntelDropsPage({ intelDrops, userTaskForce }: IntelDropsPageProps) {
  const [filter, setFilter] = useState<'all' | 'my-team'>('all');

  // Filter intel drops
  const filteredDrops = intelDrops.filter((drop) => {
    if (filter === 'my-team' && userTaskForce) {
      // Show drops that affect all teams (null) or specifically this team
      return !drop.affected_task_forces || drop.affected_task_forces.includes(userTaskForce);
    }
    return true;
  });

  // Group by classification
  const urgentDrops = filteredDrops.filter(d => d.classification === 'URGENT');
  const classifiedDrops = filteredDrops.filter(d => d.classification === 'CLASSIFIED');
  const briefingDrops = filteredDrops.filter(d => d.classification === 'BRIEFING');

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'URGENT':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'CLASSIFIED':
        return <Shield className="h-5 w-5 text-amber-500" />;
      default:
        return <FileText className="h-5 w-5 text-blue-500" />;
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'URGENT':
        return 'border-red-500/30 bg-red-500/5';
      case 'CLASSIFIED':
        return 'border-amber-500/30 bg-amber-500/5';
      default:
        return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  const renderIntelCard = (intel: IntelDrop) => (
    <Card key={intel.id} className={getClassificationColor(intel.classification)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getClassificationIcon(intel.classification)}
            <Badge
              variant={
                intel.classification === 'URGENT' ? 'destructive' :
                intel.classification === 'CLASSIFIED' ? 'default' :
                'secondary'
              }
            >
              {intel.classification}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Day {intel.day}
          </div>
        </div>
        <CardTitle className="text-lg mt-2">{intel.title}</CardTitle>
        {intel.affected_task_forces && (
          <CardDescription className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Affects: {intel.affected_task_forces.join(', ')}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="bg-background/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
          {intel.content}
        </div>
        {intel.released_at && (
          <p className="text-xs text-muted-foreground mt-3">
            Released: {new Date(intel.released_at).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/mission" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Mission Hub</span>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intel Drops</h1>
          <p className="text-muted-foreground">
            Briefings, updates, and critical information
          </p>
        </div>
        {userTaskForce && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All Intel
            </Button>
            <Button
              variant={filter === 'my-team' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('my-team')}
            >
              My Team ({userTaskForce})
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{urgentDrops.length}</p>
                <p className="text-sm text-muted-foreground">Urgent Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Shield className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{classifiedDrops.length}</p>
                <p className="text-sm text-muted-foreground">Classified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{briefingDrops.length}</p>
                <p className="text-sm text-muted-foreground">Briefings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({filteredDrops.length})</TabsTrigger>
          <TabsTrigger value="urgent" className="text-red-500">
            Urgent ({urgentDrops.length})
          </TabsTrigger>
          <TabsTrigger value="classified" className="text-amber-500">
            Classified ({classifiedDrops.length})
          </TabsTrigger>
          <TabsTrigger value="briefing" className="text-blue-500">
            Briefings ({briefingDrops.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredDrops.length > 0 ? (
            filteredDrops.map(renderIntelCard)
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No intel drops released yet.</p>
                <p className="text-sm text-muted-foreground">Check back during the program for updates.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="urgent" className="space-y-4">
          {urgentDrops.length > 0 ? (
            urgentDrops.map(renderIntelCard)
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No urgent alerts at this time.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="classified" className="space-y-4">
          {classifiedDrops.length > 0 ? (
            classifiedDrops.map(renderIntelCard)
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No classified intel at this time.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="briefing" className="space-y-4">
          {briefingDrops.length > 0 ? (
            briefingDrops.map(renderIntelCard)
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No briefings available.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
