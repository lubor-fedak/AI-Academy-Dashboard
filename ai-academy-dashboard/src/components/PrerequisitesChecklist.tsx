'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Info,
  Loader2,
  Rocket,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PrerequisiteWithStatus,
  PrerequisiteCategory,
  PREREQUISITE_CATEGORY_NAMES,
  PREREQUISITE_CATEGORY_ICONS,
} from '@/lib/types';

interface PrerequisitesChecklistProps {
  participantId: string;
}

interface PrerequisitesSummary {
  required_total: number;
  required_completed: number;
  required_completion_pct: number;
  total_items: number;
  total_completed: number;
  total_completion_pct: number;
  is_ready: boolean;
}

export function PrerequisitesChecklist({ participantId }: PrerequisitesChecklistProps) {
  const [prerequisites, setPrerequisites] = useState<PrerequisiteWithStatus[]>([]);
  const [summary, setSummary] = useState<PrerequisitesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchPrerequisites = useCallback(async () => {
    try {
      const response = await fetch(`/api/prerequisites?participant_id=${participantId}`);
      if (!response.ok) throw new Error('Failed to fetch prerequisites');
      const data = await response.json();
      setPrerequisites(data.prerequisites || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching prerequisites:', error);
      toast.error('Failed to load prerequisites');
    } finally {
      setLoading(false);
    }
  }, [participantId]);

  useEffect(() => {
    fetchPrerequisites();
  }, [fetchPrerequisites]);

  const handleToggle = async (prerequisiteId: number, currentStatus: boolean) => {
    setUpdating(prerequisiteId);

    // Optimistic update
    setPrerequisites(prev =>
      prev.map(p =>
        p.id === prerequisiteId
          ? { ...p, is_completed: !currentStatus }
          : p
      )
    );

    try {
      const response = await fetch('/api/prerequisites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          prerequisite_id: prerequisiteId,
          is_completed: !currentStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      // Refresh to get accurate summary
      await fetchPrerequisites();
      toast.success(!currentStatus ? 'Marked as complete' : 'Marked as incomplete');
    } catch (error) {
      console.error('Error updating prerequisite:', error);
      // Revert optimistic update
      setPrerequisites(prev =>
        prev.map(p =>
          p.id === prerequisiteId
            ? { ...p, is_completed: currentStatus }
            : p
        )
      );
      toast.error('Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  // Group prerequisites by category
  const groupedPrerequisites = prerequisites.reduce((acc, prereq) => {
    const category = prereq.category as PrerequisiteCategory;
    if (!acc[category]) acc[category] = [];
    acc[category].push(prereq);
    return acc;
  }, {} as Record<PrerequisiteCategory, PrerequisiteWithStatus[]>);

  const categoryOrder: PrerequisiteCategory[] = [
    'development',
    'ai_platforms',
    'google',
    'collaboration',
    'technical',
    'confirmation',
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-2">
                {[1, 2, 3].map(j => (
                  <Skeleton key={j} className="h-12 w-full" />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-6 w-6 text-blue-500" />
              Pre-course Readiness Checklist
            </CardTitle>
            <CardDescription className="mt-1">
              Complete these prerequisites before the course starts. Required items are marked with *.
            </CardDescription>
          </div>
          {summary?.is_ready && (
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Ready!
            </Badge>
          )}
        </div>

        {/* Progress Summary */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Required Items</span>
            <span className="text-sm text-muted-foreground">
              {summary?.required_completed || 0} / {summary?.required_total || 0}
            </span>
          </div>
          <Progress value={summary?.required_completion_pct || 0} className="h-2" />

          <div className="flex items-center justify-between mt-3 mb-2">
            <span className="text-sm font-medium text-muted-foreground">All Items</span>
            <span className="text-sm text-muted-foreground">
              {summary?.total_completed || 0} / {summary?.total_items || 0}
            </span>
          </div>
          <Progress value={summary?.total_completion_pct || 0} className="h-2 opacity-60" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {categoryOrder.map(category => {
          const items = groupedPrerequisites[category];
          if (!items?.length) return null;

          const categoryCompleted = items.filter(i => i.is_completed).length;
          const categoryRequired = items.filter(i => i.is_required).length;
          const categoryRequiredCompleted = items.filter(i => i.is_required && i.is_completed).length;

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <span>{PREREQUISITE_CATEGORY_ICONS[category]}</span>
                  {PREREQUISITE_CATEGORY_NAMES[category]}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {categoryCompleted} / {items.length}
                  {categoryRequired > 0 && categoryRequiredCompleted < categoryRequired && (
                    <span className="text-orange-500 ml-2">
                      ({categoryRequired - categoryRequiredCompleted} required)
                    </span>
                  )}
                </span>
              </div>

              <div className="space-y-2">
                {items.map(prereq => (
                  <div
                    key={prereq.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      prereq.is_completed
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                        : prereq.is_required
                        ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="pt-0.5">
                      {updating === prereq.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <Checkbox
                          id={`prereq-${prereq.id}`}
                          checked={prereq.is_completed}
                          onCheckedChange={() => handleToggle(prereq.id, prereq.is_completed)}
                          className="h-5 w-5"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`prereq-${prereq.id}`}
                        className={`font-medium cursor-pointer flex items-center gap-2 ${
                          prereq.is_completed ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {prereq.name}
                        {prereq.is_required && (
                          <span className="text-red-500">*</span>
                        )}
                        {prereq.is_completed && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </label>
                      {prereq.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {prereq.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {prereq.help_url && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(prereq.help_url!, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Get access / Help</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {!summary?.is_ready && (
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-200">
                Complete all required items before the course starts
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                You have {(summary?.required_total || 0) - (summary?.required_completed || 0)} required items remaining.
                If you need help accessing any tool, contact your team lead or course administrator.
              </p>
            </div>
          </div>
        )}

        {summary?.is_ready && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                You&apos;re all set!
              </p>
              <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                All required prerequisites are complete. You&apos;re ready for the AI Academy.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
