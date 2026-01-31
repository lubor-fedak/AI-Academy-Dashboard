'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function BriefingMemo() {
  return (
    <Card className="max-w-3xl mx-auto border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent">
      <CardContent className="p-0">
        {/* Header */}
        <div className="border-b border-amber-500/20 p-4 bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <div className="space-y-1">
              <p className="font-semibold">INTERNAL MEMO</p>
              <p className="text-muted-foreground">CLASSIFICATION: OPERATION AI READY EUROPE</p>
            </div>
            <Badge variant="outline" className="border-amber-500/50">
              OFFICIAL
            </Badge>
          </div>
        </div>

        {/* Meta */}
        <div className="border-b border-border/50 p-4 bg-muted/10 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">FROM:</span>
              <span className="ml-2">Martin Schroeter, CEO Kyndryl</span>
            </div>
            <div>
              <span className="text-muted-foreground">DATE:</span>
              <span className="ml-2">February 2, 2026</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">TO:</span>
              <span className="ml-2">Selected Participants - EU Cohort</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm leading-relaxed">
          <p className="font-semibold text-lg">Team,</p>

          <p>You&apos;ve just heard the call. Europe needs us.</p>

          <p>
            You&apos;ve been selected for Operation AI Ready Europe - not because you&apos;re
            the most senior, but because you have the potential to become something
            new: <strong>Forward Deployed AI Engineers</strong>.
          </p>

          <p className="font-medium">What does that mean?</p>

          <p>
            It means you won&apos;t be sitting in offices writing strategy documents.
            You&apos;ll be embedded with clients, solving real problems, deploying real
            solutions. Fast.
          </p>

          <div className="my-6 p-4 bg-muted/30 rounded-lg border-l-4 border-amber-500">
            <p className="text-muted-foreground italic">
              &ldquo;The big consulting firms charge millions and deliver PowerPoints.
              We charge less and deliver working systems.&rdquo;
            </p>
          </div>

          <p>Over the next 6 weeks, you&apos;ll learn:</p>

          <ul className="list-none space-y-2 pl-4">
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span><strong>The Kyndryl Agentic Framework</strong> - our core toolkit</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span><strong>Rapid deployment patterns</strong> - from idea to production in days</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span><strong>Client engagement skills</strong> - understand fast, deliver faster</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span><strong>Team coordination</strong> - work as a unit, move as one</span>
            </li>
          </ul>

          <p>
            At the end, you&apos;ll face a real challenge: four pilot clients are waiting.
            They have real problems. They need real solutions. You&apos;ll deliver.
          </p>

          <p>
            I won&apos;t pretend this will be easy. It will demand your time, your focus,
            and your persistence. Some days will be frustrating. Some concepts will
            take multiple attempts to master. That&apos;s not failure - that&apos;s growth.
          </p>

          <p className="font-medium">
            Those who complete this program will have earned something real:
            the capability to transform enterprises with AI.
          </p>

          <p className="text-lg font-semibold text-amber-500">
            Welcome to Operation AI Ready Europe.
          </p>

          <div className="pt-4">
            <p className="font-semibold">Martin</p>
            <p className="text-xs text-muted-foreground mt-2">
              P.S. - The Commission is watching. Let&apos;s show them what Kyndryl can do.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
