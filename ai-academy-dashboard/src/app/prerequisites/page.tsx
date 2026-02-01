'use client';

import { useAuth } from '@/components/AuthProvider';
import { PrerequisitesChecklist } from '@/components/PrerequisitesChecklist';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export default function PrerequisitesPage() {
  const { participant, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="p-6 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <p className="text-orange-800 dark:text-orange-200">
            Please log in to view your prerequisites checklist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <PrerequisitesChecklist participantId={participant.id} />
    </div>
  );
}
