'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MissionDay,
  Assignment,
  ACT_NAMES,
  ACT_WEEKS,
} from '@/lib/types';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  BookOpen,
  Wrench,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  ArrowLeft,
  Loader2,
  AlertCircle,
  User,
} from 'lucide-react';

// Content fetched from Git/API
interface DayContent {
  situation: string | null;
  resources: string | null;
  mentorNotes: string | null;
  source: 'local' | 'github' | 'database';
}

interface DayBriefingProps {
  missionDay: MissionDay;
  assignments: Assignment[];
  prevDay: { day: number; title: string } | null;
  nextDay: { day: number; title: string } | null;
  allDays: Pick<MissionDay, 'day' | 'title' | 'codename' | 'act' | 'week'>[];
  currentProgramDay: number;
  userRole?: string;
}

// Role-specific content
interface RoleContent {
  content: string | null;
  source: 'local' | 'github' | 'fallback';
  hasFallback: boolean;
}

export function DayBriefing({
  missionDay,
  assignments,
  prevDay,
  nextDay,
  allDays,
  currentProgramDay,
  userRole,
}: DayBriefingProps) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [content, setContent] = useState<DayContent | null>(null);
  const [roleContent, setRoleContent] = useState<RoleContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const isCurrentDay = missionDay.day === currentProgramDay;
  const isPastDay = missionDay.day < currentProgramDay;

  // Fetch content from API
  useEffect(() => {
    async function fetchContent() {
      setIsLoading(true);
      setContentError(null);

      try {
        const response = await fetch(`/api/content/day/${missionDay.day}`);
        if (response.ok) {
          const data = await response.json();
          setContent({
            situation: data.situation,
            resources: data.resources,
            mentorNotes: data.mentorNotes,
            source: data.source,
          });
        } else {
          // Use database content as fallback
          setContent({
            situation: missionDay.briefing_content,
            resources: missionDay.resources_content,
            mentorNotes: null,
            source: 'database',
          });
        }
      } catch {
        // Use database content as fallback
        setContent({
          situation: missionDay.briefing_content,
          resources: missionDay.resources_content,
          mentorNotes: null,
          source: 'database',
        });
        setContentError('Using cached content');
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [missionDay.day, missionDay.briefing_content, missionDay.resources_content]);

  // Fetch role-specific content
  useEffect(() => {
    async function fetchRoleContent() {
      if (!userRole) return;

      setIsLoadingRole(true);
      try {
        const response = await fetch(`/api/content/role/${userRole}/day/${missionDay.day}`);
        if (response.ok) {
          const data = await response.json();
          // Only set if not fallback (meaning actual role-specific content exists)
          if (!data.hasFallback) {
            setRoleContent({
              content: data.content,
              source: data.source,
              hasFallback: data.hasFallback,
            });
          } else {
            setRoleContent(null);
          }
        }
      } catch {
        // No role-specific content available
        setRoleContent(null);
      } finally {
        setIsLoadingRole(false);
      }
    }

    fetchRoleContent();
  }, [missionDay.day, userRole]);

  // Group days by act for timeline
  const daysByAct = allDays.reduce((acc, day) => {
    if (!acc[day.act]) acc[day.act] = [];
    acc[day.act].push(day);
    return acc;
  }, {} as Record<number, typeof allDays>);

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <Link href="/mission" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Mission Hub</span>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTimeline(!showTimeline)}
        >
          {showTimeline ? 'Hide' : 'Show'} Timeline
        </Button>
      </div>

      {/* Timeline (collapsible) */}
      {showTimeline && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {Object.entries(daysByAct).map(([act, days]) => (
                <div key={act}>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    ACT {act}: {ACT_NAMES[parseInt(act)]} ({ACT_WEEKS[parseInt(act)]})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {days.map((d) => {
                      const status = d.day < currentProgramDay ? 'completed' : d.day === currentProgramDay ? 'current' : 'upcoming';
                      const isSelected = d.day === missionDay.day;
                      return (
                        <Link
                          key={d.day}
                          href={`/mission/day/${d.day}`}
                          className={`
                            px-2 py-1 rounded text-xs font-medium transition-all
                            ${isSelected ? 'ring-2 ring-primary' : ''}
                            ${status === 'completed' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''}
                            ${status === 'current' ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' : ''}
                            ${status === 'upcoming' ? 'bg-muted text-muted-foreground hover:bg-muted/80' : ''}
                          `}
                        >
                          {d.day}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Briefing Card */}
      <Card className={isCurrentDay ? 'border-blue-500/50 ring-1 ring-blue-500/20' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>ACT {missionDay.act}: {ACT_NAMES[missionDay.act]}</span>
                <span>•</span>
                <span>{ACT_WEEKS[missionDay.act]}</span>
              </div>
              <CardTitle className="text-3xl">
                Day {missionDay.day}: {missionDay.title}
              </CardTitle>
              {missionDay.codename && (
                <CardDescription className="text-lg">
                  &ldquo;{missionDay.codename}&rdquo;
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isCurrentDay && (
                <Badge className="bg-blue-500">
                  <Circle className="h-2 w-2 mr-1 fill-current" />
                  Current Day
                </Badge>
              )}
              {isPastDay && (
                <Badge variant="secondary">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {missionDay.subtitle && (
            <p className="text-muted-foreground mb-4">{missionDay.subtitle}</p>
          )}

          {/* Tech Skills Focus */}
          {missionDay.tech_skills_focus && missionDay.tech_skills_focus.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {missionDay.tech_skills_focus.map((skill, i) => (
                <Badge key={i} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          )}

          <Separator className="my-6" />

          {/* Tabs for different content sections */}
          <Tabs defaultValue="briefing" className="space-y-4">
            <TabsList>
              <TabsTrigger value="briefing" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Briefing
              </TabsTrigger>
              {(roleContent || isLoadingRole) && userRole && (
                <TabsTrigger value="role-specific" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {userRole}
                  {isLoadingRole && <Loader2 className="h-3 w-3 animate-spin" />}
                </TabsTrigger>
              )}
              <TabsTrigger value="deliverables" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Deliverables
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Resources
              </TabsTrigger>
            </TabsList>

            <TabsContent value="briefing" className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : content?.situation ? (
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {contentError && (
                    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                      {contentError}
                    </div>
                  )}
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {content.situation}
                  </ReactMarkdown>
                  {content.source !== 'database' && (
                    <div className="mt-4 text-xs text-muted-foreground">
                      Content loaded from {content.source}
                    </div>
                  )}
                </div>
              ) : (
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="font-semibold">Mission Briefing</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        The full briefing content for Day {missionDay.day} will be presented during the live session.
                        Check back after the session for detailed materials.
                      </p>
                      {missionDay.subtitle && (
                        <div className="mt-4 p-4 bg-background rounded-lg border">
                          <h4 className="font-medium mb-2">Today&apos;s Focus:</h4>
                          <p className="text-muted-foreground">{missionDay.subtitle}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Role-Specific Content */}
            {userRole && (
              <TabsContent value="role-specific" className="space-y-4">
                {isLoadingRole ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : roleContent?.content ? (
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                        <User className="h-4 w-4" />
                        Content tailored for {userRole} role
                      </div>
                    </div>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {roleContent.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <Card className="bg-muted/30">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <User className="h-12 w-12 mx-auto text-muted-foreground" />
                        <h3 className="font-semibold">No Role-Specific Content</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          There is no specialized content for the {userRole} role on Day {missionDay.day}.
                          The common briefing content applies to all roles.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

            <TabsContent value="deliverables" className="space-y-4">
              {assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge variant={assignment.type === 'in_class' ? 'default' : 'secondary'} className="mb-2">
                              {assignment.type === 'in_class' ? 'In-Class' : 'Homework'}
                            </Badge>
                            <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{assignment.max_points}</div>
                            <div className="text-xs text-muted-foreground">points</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {assignment.situation && (
                          <div className="p-3 bg-muted/50 rounded-lg mb-4 border-l-4 border-primary">
                            <h4 className="text-xs font-medium uppercase text-muted-foreground mb-1">Situation</h4>
                            <p className="text-sm">{assignment.situation}</p>
                          </div>
                        )}
                        {assignment.description && (
                          <p className="text-muted-foreground">{assignment.description}</p>
                        )}
                        {assignment.target_roles && (
                          <div className="mt-4 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Target roles:</span>
                            {assignment.target_roles.map((role) => (
                              <Badge key={role} variant="outline" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Folder: {assignment.folder_name}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <Target className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="font-semibold">No Deliverables Assigned</h3>
                      <p className="text-sm text-muted-foreground">
                        Deliverables for Day {missionDay.day} will be announced during the session.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : content?.resources ? (
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {content.resources}
                  </ReactMarkdown>
                </div>
              ) : (
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="font-semibold">Resources</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Additional resources and references for Day {missionDay.day} will be provided
                        during and after the live session.
                      </p>
                      {missionDay.tech_skills_focus && missionDay.tech_skills_focus.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Key Topics:</h4>
                          <div className="flex flex-wrap justify-center gap-2">
                            {missionDay.tech_skills_focus.map((skill, i) => (
                              <Badge key={i} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Quick Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1">
              <span className="text-2xl">🤖</span>
              <span className="text-sm">AI Tutor</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1">
              <span className="text-2xl">📝</span>
              <span className="text-sm">Submit Work</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1">
              <span className="text-2xl">👥</span>
              <span className="text-sm">Team Chat</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1">
              <span className="text-2xl">❓</span>
              <span className="text-sm">Get Help</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {prevDay ? (
          <Link href={`/mission/day/${prevDay.day}`}>
            <Button variant="outline" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              <div className="text-left">
                <div className="text-xs text-muted-foreground">Previous</div>
                <div className="text-sm">Day {prevDay.day}: {prevDay.title}</div>
              </div>
            </Button>
          </Link>
        ) : (
          <div />
        )}

        {nextDay ? (
          <Link href={`/mission/day/${nextDay.day}`}>
            <Button variant="outline" className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Next</div>
                <div className="text-sm">Day {nextDay.day}: {nextDay.title}</div>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
