'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseClient } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Rocket,
  Github,
  User,
  Webhook,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Copy,
  ExternalLink,
  Sparkles,
  Trophy,
  Users,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { RoleType, TeamType, StreamType } from '@/lib/types';

const ROLES: RoleType[] = ['FDE', 'AI-SE', 'AI-PM', 'AI-DA', 'AI-DS', 'AI-SEC', 'AI-FE'];
const TEAMS: TeamType[] = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
const STREAMS: StreamType[] = ['Tech', 'Business'];

const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  'FDE': 'Forward Deployed Engineer',
  'AI-SE': 'AI Software Engineer',
  'AI-PM': 'AI Product Manager',
  'AI-DA': 'AI Data Analyst',
  'AI-DS': 'AI Data Scientist',
  'AI-SEC': 'AI Security Consultant',
  'AI-FE': 'AI Front-End Developer',
};

type Step = 'welcome' | 'github' | 'profile' | 'webhook' | 'complete';

const STEPS: Step[] = ['welcome', 'github', 'profile', 'webhook', 'complete'];

interface OnboardingWizardProps {
  initialStep?: Step;
  fromGitHub?: boolean;
}

export function OnboardingWizard({ initialStep = 'welcome', fromGitHub = false }: OnboardingWizardProps) {
  const { user, participant, isLoading: authLoading, refreshParticipant } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    github_username: '',
    name: '',
    email: '',
    role: '',
    team: '',
    stream: '',
  });

  // Determine initial step based on auth state
  useEffect(() => {
    if (authLoading) return;

    if (participant) {
      // Already registered, go to complete or dashboard
      router.push('/my-dashboard');
      return;
    }

    if (user && fromGitHub) {
      // GitHub connected, go to profile step
      setCurrentStep('profile');
      setFormData((prev) => ({
        ...prev,
        github_username: user.user_metadata?.user_name || '',
        name: user.user_metadata?.name || user.user_metadata?.full_name || '',
        email: user.email || '',
      }));
    } else if (user) {
      // Logged in but not from GitHub flow
      setCurrentStep('profile');
    }
  }, [authLoading, user, participant, fromGitHub, router]);

  const currentStepIndex = STEPS.indexOf(currentStep);

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const handleGitHubLogin = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding?from=github`,
        scopes: 'read:user user:email',
      },
    });
  };

  const handleSubmitProfile = async () => {
    if (!formData.github_username || !formData.name || !formData.email || !formData.role || !formData.team || !formData.stream) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          avatar_url: user?.user_metadata?.avatar_url || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      toast.success('Profile created!');

      if (user) {
        await refreshParticipant();
      }

      goNext(); // Go to webhook step
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhook/github`
    : 'https://your-app.vercel.app/api/webhook/github';

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const icons = {
              welcome: Rocket,
              github: Github,
              profile: User,
              webhook: Webhook,
              complete: CheckCircle,
            };
            const Icon = icons[step];

            return (
              <div
                key={step}
                className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isActive
                      ? 'bg-[#0062FF] border-[#0062FF] text-white'
                      : 'bg-muted border-border text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      isCompleted ? 'bg-green-500' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="border-2">
        <CardContent className="pt-8 pb-8">
          {/* Welcome Step */}
          {currentStep === 'welcome' && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#0062FF]/10 mb-4">
                <Rocket className="h-10 w-10 text-[#0062FF]" />
              </div>

              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome to AI Academy!</h1>
                <p className="text-muted-foreground text-lg">
                  Get ready for an exciting journey into the world of AI and machine learning.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 py-6">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Target className="h-8 w-8 mx-auto mb-2 text-[#0062FF]" />
                  <p className="font-medium">5 Weeks</p>
                  <p className="text-sm text-muted-foreground">Intensive training</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="font-medium">Achievements</p>
                  <p className="text-sm text-muted-foreground">Collect badges</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="font-medium">Team Projects</p>
                  <p className="text-sm text-muted-foreground">Collaborate with others</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                This wizard will help you set up everything you need in just a few minutes.
              </p>

              <Button
                size="lg"
                className="bg-[#0062FF] hover:bg-[#0052D9]"
                onClick={goNext}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {/* GitHub Step */}
          {currentStep === 'github' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#24292e] mb-4">
                  <Github className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Connect GitHub Account</h2>
                <p className="text-muted-foreground">
                  We need to connect your GitHub account to track submissions.
                </p>
              </div>

              {user ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                  <p className="font-medium text-green-600 dark:text-green-400">
                    GitHub account connected!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    @{user.user_metadata?.user_name}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    size="lg"
                    className="w-full bg-[#24292e] hover:bg-[#1b1f23] text-white"
                    onClick={handleGitHubLogin}
                  >
                    <Github className="mr-2 h-5 w-5" />
                    Sign in with GitHub
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    We only require access to basic information (name, email, avatar).
                  </p>
                </div>
              )}

              <Separator />

              <div className="flex justify-between">
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={goNext}
                  disabled={!user}
                  className="bg-[#0062FF] hover:bg-[#0052D9]"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Profile Step */}
          {currentStep === 'profile' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0062FF]/10 mb-4">
                  <User className="h-8 w-8 text-[#0062FF]" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Set Up Your Profile</h2>
                <p className="text-muted-foreground">
                  Complete information about yourself and your assignment.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="github_username">GitHub Username</Label>
                    <Input
                      id="github_username"
                      value={formData.github_username}
                      onChange={(e) => setFormData({ ...formData, github_username: e.target.value })}
                      disabled={!!user}
                      required
                    />
                    {user && (
                      <p className="text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!!user && !!user.email}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex flex-col">
                              <span>{role}</span>
                              <span className="text-xs text-muted-foreground">
                                {ROLE_DESCRIPTIONS[role]}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Team</Label>
                    <Select
                      value={formData.team}
                      onValueChange={(value) => setFormData({ ...formData, team: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAMS.map((team) => (
                          <SelectItem key={team} value={team}>
                            Team {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Stream</Label>
                    <Select
                      value={formData.stream}
                      onValueChange={(value) => setFormData({ ...formData, stream: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {STREAMS.map((stream) => (
                          <SelectItem key={stream} value={stream}>
                            {stream}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmitProfile}
                  disabled={isSubmitting}
                  className="bg-[#0062FF] hover:bg-[#0052D9]"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Webhook Step */}
          {currentStep === 'webhook' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 mb-4">
                  <Webhook className="h-8 w-8 text-purple-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Set Up Webhook</h2>
                <p className="text-muted-foreground">
                  Webhook will automatically record your submissions on every push.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Step 1</Badge>
                  <span className="font-medium">Open repository settings</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  Go to your GitHub repository - Settings - Webhooks - Add webhook
                </p>

                <Separator />

                <div className="flex items-center gap-2">
                  <Badge variant="outline">Step 2</Badge>
                  <span className="font-medium">Set Payload URL</span>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <code className="flex-1 bg-background px-3 py-2 rounded border text-sm truncate">
                    {webhookUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <Badge variant="outline">Step 3</Badge>
                  <span className="font-medium">Select Content type</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  Set to <code className="bg-background px-1 rounded">application/json</code>
                </p>

                <Separator />

                <div className="flex items-center gap-2">
                  <Badge variant="outline">Step 4</Badge>
                  <span className="font-medium">Select events</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  Select &quot;Just the push event&quot; and click &quot;Add webhook&quot;
                </p>
              </div>

              <div className="text-center">
                <a
                  href="https://github.com/settings/repositories"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#0062FF] hover:underline"
                >
                  Open GitHub Repositories
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={goNext}
                  className="bg-[#0062FF] hover:bg-[#0052D9]"
                >
                  Done
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4">
                <Sparkles className="h-10 w-10 text-green-500" />
              </div>

              <div>
                <h1 className="text-3xl font-bold mb-2">All Set!</h1>
                <p className="text-muted-foreground text-lg">
                  You are ready to start your AI Academy journey.
                </p>
              </div>

              <div className="bg-gradient-to-r from-[#0062FF]/10 to-purple-500/10 rounded-lg p-6">
                <h3 className="font-semibold mb-3">What&apos;s Next?</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Check your dashboard and track your progress
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Start working on Day 1 assignments
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Push changes to your repository to record submissions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Collect achievements and compete on the leaderboard
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 justify-center">
                <Link href="/my-dashboard">
                  <Button size="lg" className="bg-[#0062FF] hover:bg-[#0052D9]">
                    <User className="mr-2 h-5 w-5" />
                    My Dashboard
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button size="lg" variant="outline">
                    <Trophy className="mr-2 h-5 w-5" />
                    Leaderboard
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
