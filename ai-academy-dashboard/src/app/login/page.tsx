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
import { Separator } from '@/components/ui/separator';
import {
  Github,
  Loader2,
  AlertCircle,
  CheckCircle,
  Mail,
  ShieldCheck,
  KeyRound,
  Sparkles,
} from 'lucide-react';

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAdmin, userStatus, signInWithEmail, signInWithMagicLink } = useAuth();

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

  const handleMagicLink = async () => {
    if (!email) {
      setLoginError('Zadaj emailovú adresu');
      return;
    }

    setIsLoading(true);
    setLoginError(null);

    const { error } = await signInWithMagicLink(email);

    if (error) {
      setLoginError(error.message);
    } else {
      setMagicLinkSent(true);
    }
    setIsLoading(false);
  };

  if (magicLinkSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-green-500">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Skontroluj email</CardTitle>
          <CardDescription>
            Poslali sme ti prihlasovací link na <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Klikni na link v emaile pre prihlásenie. Link je platný 1 hodinu.
          </p>
          <Button
            variant="outline"
            onClick={() => setMagicLinkSent(false)}
            className="w-full"
          >
            Použiť iný email
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#0062FF]">
            <span className="text-2xl font-bold text-white">AI</span>
          </div>
        </div>
        <CardTitle className="text-2xl">Vitaj v AI Academy</CardTitle>
        <CardDescription>
          Prihlás sa pre prístup k dashboardu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(error || loginError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error === 'auth_failed'
                ? 'Prihlásenie zlyhalo. Skúste to znova.'
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
              Študent
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
              Prihlásiť sa cez GitHub
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>Pre študentov AI Academy</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Automatické priradenie avataru</li>
                <li>• Verifikácia GitHub username</li>
                <li>• Po schválení adminom získaš prístup</li>
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
                <Label htmlFor="password">Heslo</Label>
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
                Prihlásiť sa
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">alebo</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleMagicLink}
              disabled={isLoading || !email}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Poslať prihlasovací link
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Zadaj email a klikni na &quot;Poslať prihlasovací link&quot; pre prihlásenie bez hesla
            </p>
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
