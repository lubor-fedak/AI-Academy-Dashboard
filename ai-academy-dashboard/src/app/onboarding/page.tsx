'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

function OnboardingContent() {
  const searchParams = useSearchParams();
  const fromGitHub = searchParams.get('from') === 'github';

  return <OnboardingWizard fromGitHub={fromGitHub} />;
}

function OnboardingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center flex-1">
            <Skeleton className="w-10 h-10 rounded-full" />
            {i < 4 && <Skeleton className="flex-1 h-1 mx-2" />}
          </div>
        ))}
      </div>
      <Card className="border-2">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            <Skeleton className="w-20 h-20 rounded-full mx-auto" />
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-96 mx-auto" />
            <div className="grid grid-cols-3 gap-4 py-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-12 w-32 mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <div className="py-8">
      <Suspense fallback={<OnboardingSkeleton />}>
        <OnboardingContent />
      </Suspense>
    </div>
  );
}
