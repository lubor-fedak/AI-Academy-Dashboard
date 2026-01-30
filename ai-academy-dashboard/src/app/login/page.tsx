'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Github,
  Loader2,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAdmin, userStatus, signInWithEmail } = useAuth();

  const error = searchParams.get('error');
  const message = searchParams.get('message');
  const isAdminLogin = searchParams.get('admin') === 'true';

  const [activeTab, setActiveTab] = useState(isAdminLogin ? 'admin' : 'github');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        router.push('/admin/users');
      } else if (userStatus === 'approved') {
        router.push('/my-dashboard');
      } else if (userStatus === 'pending' || userStatus === 'rejected') {
        router.push('/pending');
      } else if (userStatus === 'no_profile') {
        router.push('/onboarding');
      }
    }
  }, [user, isAdmin, userStatus, router]);

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setLoginError(null);
    const supabase = getSupabaseClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'read:user user:email',
      },
    });

    if (error) {
      console.error('Login error:', error);
      setLoginError(error.message);
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setLoginError(null);

    const { error } = await signInWithEmail(email, password);

    if (error) {
      setLoginError(error.message);
      setIsLoading(false);
    }
    // Success will be handled by auth state change
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#0062FF]">
            <span className="text-2xl font-bold text-white">AI</span>
          </div>
        </div>
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>
          Sign in to access the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(error || loginError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error === 'auth_failed'
                ? 'Authentication failed. Please try again.'
                : loginError || error}
            </AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              {message}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="github" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              User
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Admin
            </TabsTrigger>
          </TabsList>

          {/* GitHub Login */}
          <TabsContent value="github" className="space-y-4 mt-4">
            <Button
              onClick={handleGitHubLogin}
              disabled={isLoading}
              className="w-full bg-[#24292e] hover:bg-[#1b1f23] text-white"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Github className="mr-2 h-5 w-5" />
              )}
              Sign in with GitHub
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>For registered users</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Automatic avatar assignment</li>
                <li>• GitHub username verification</li>
                <li>• Access granted after admin approval</li>
              </ul>
            </div>
          </TabsContent>

          {/* Admin Login */}
          <TabsContent value="admin" className="space-y-4 mt-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0062FF] hover:bg-[#0052D9]"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 h-5 w-5" />
                )}
                Sign In
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function LoginSkeleton() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Skeleton className="h-16 w-16 mx-auto rounded-xl mb-4" />
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
