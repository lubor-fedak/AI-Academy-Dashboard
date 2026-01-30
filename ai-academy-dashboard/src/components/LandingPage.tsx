'use client';

import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Github, Loader2, ShieldCheck } from 'lucide-react';

export function LandingPage() {
  const { user, isLoading, isAdmin, userStatus } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
      </div>
    );
  }

  // If user is logged in and approved, redirect happens via AuthGuard
  if (user && (isAdmin || userStatus === 'approved')) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FF462D]">
          <span className="text-3xl font-bold text-white">AI</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/login">
            <Button size="lg" className="bg-[#24292e] hover:bg-[#1b1f23] text-white">
              <Github className="mr-2 h-5 w-5" />
              Sign in with GitHub
            </Button>
          </Link>
          <Link href="/login?admin=true">
            <Button size="lg" variant="outline">
              <ShieldCheck className="mr-2 h-5 w-5" />
              Admin
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
