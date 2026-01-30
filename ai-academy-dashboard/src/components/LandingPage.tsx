'use client';

import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import {
  GraduationCap,
  Github,
  Trophy,
  Users,
  Target,
  Zap,
  ChevronRight,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

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
  // This is fallback content while redirecting
  if (user && (isAdmin || userStatus === 'approved')) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#0062FF] mb-6">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Kyndryl AI Academy
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sleduj svoj pokrok, súťaž s kolegami a staň sa AI expertom
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link href="/login">
            <Button size="lg" className="bg-[#0062FF] hover:bg-[#0052D9] text-lg px-8">
              <Github className="mr-2 h-5 w-5" />
              Prihlásiť sa cez GitHub
            </Button>
          </Link>
          <Link href="/login?admin=true">
            <Button size="lg" variant="outline" className="text-lg px-8">
              <ShieldCheck className="mr-2 h-5 w-5" />
              Admin prihlásenie
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl w-full">
          <Card className="border-0 bg-accent/30">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-yellow-500/20 mx-auto mb-4">
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>
              <h3 className="font-semibold mb-2">Leaderboard</h3>
              <p className="text-sm text-muted-foreground">
                Sleduj svoje umiestnenie a súťaž o prvé miesto
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-accent/30">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/20 mx-auto mb-4">
                <Target className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold mb-2">Progress Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Vizualizuj svoj pokrok a chýbajúce úlohy
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-accent/30">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/20 mx-auto mb-4">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold mb-2">Tímová spolupráca</h3>
              <p className="text-sm text-muted-foreground">
                Porovnaj sa s tímom a motivuj sa navzájom
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-accent/30">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/20 mx-auto mb-4">
                <Zap className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="font-semibold mb-2">Achievements</h3>
              <p className="text-sm text-muted-foreground">
                Odomkni achievements a získaj bonus body
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-sm text-muted-foreground border-t">
        <p>Powered by Kyndryl Slovakia</p>
      </div>
    </div>
  );
}
