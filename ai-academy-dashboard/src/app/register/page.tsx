'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function RegisterRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  useEffect(() => {
    // Redirect to onboarding wizard
    if (from === 'github') {
      router.replace('/onboarding?from=github');
    } else {
      router.replace('/onboarding');
    }
  }, [router, from]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
        </div>
      }
    >
      <RegisterRedirect />
    </Suspense>
  );
}
