'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, XCircle, LogOut, RefreshCw, Github, Mail } from 'lucide-react';

export default function PendingPage() {
  const { user, participant, isLoading, isAdmin, userStatus, signOut, refreshParticipant } = useAuth();
  const router = useRouter();

  // Redirect if approved or admin
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (isAdmin || userStatus === 'approved') {
        router.push('/my-dashboard');
      } else if (userStatus === 'no_profile') {
        router.push('/onboarding');
      }
    }
  }, [user, isLoading, isAdmin, userStatus, router]);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
      </div>
    );
  }

  if (!user || isAdmin || userStatus === 'approved') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0062FF]" />
      </div>
    );
  }

  const isRejected = userStatus === 'rejected';

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {participant?.avatar_url ? (
              <Avatar className="h-20 w-20">
                <AvatarImage src={participant.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {participant.name?.split(' ').map((n) => n[0]).join('') || '?'}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className={`flex h-20 w-20 items-center justify-center rounded-full ${
                isRejected ? 'bg-red-500' : 'bg-orange-500'
              }`}>
                {isRejected ? (
                  <XCircle className="h-10 w-10 text-white" />
                ) : (
                  <Clock className="h-10 w-10 text-white" />
                )}
              </div>
            )}
          </div>

          <CardTitle className="text-2xl">
            {isRejected ? 'Registrácia zamietnutá' : 'Čakáme na schválenie'}
          </CardTitle>

          <CardDescription>
            {isRejected
              ? 'Tvoja registrácia nebola schválená administrátorom.'
              : 'Tvoja registrácia čaká na schválenie administrátorom.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Info */}
          {participant && (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-accent/50">
              <Avatar className="h-12 w-12">
                <AvatarImage src={participant.avatar_url ?? undefined} />
                <AvatarFallback>
                  {participant.name?.split(' ').map((n) => n[0]).join('') || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{participant.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Github className="h-3 w-3" />
                  <span>@{participant.github_username}</span>
                </div>
                {participant.role && (
                  <Badge variant="outline" className="mt-1">
                    {participant.role}
                  </Badge>
                )}
              </div>
              <Badge variant={isRejected ? 'destructive' : 'secondary'}>
                {isRejected ? 'Zamietnuté' : 'Pending'}
              </Badge>
            </div>
          )}

          {/* Email info */}
          {user.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
          )}

          {/* Status message */}
          <div className={`p-4 rounded-lg text-sm ${
            isRejected
              ? 'bg-red-500/10 border border-red-500/30'
              : 'bg-orange-500/10 border border-orange-500/30'
          }`}>
            {isRejected ? (
              <>
                <p className="font-medium text-red-500 mb-2">Čo teraz?</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Kontaktuj administrátora pre viac informácií</li>
                  <li>• Skontroluj, či si použil správny GitHub účet</li>
                  <li>• Skús sa zaregistrovať znova s iným účtom</li>
                </ul>
              </>
            ) : (
              <>
                <p className="font-medium text-orange-500 mb-2">Čo sa teraz deje?</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Administrátor overí tvoje údaje</li>
                  <li>• Po schválení dostaneš prístup k dashboardu</li>
                  <li>• Budeme ťa informovať emailom</li>
                </ul>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => refreshParticipant()}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Skontrolovať stav
            </Button>

            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="w-full text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Odhlásiť sa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
