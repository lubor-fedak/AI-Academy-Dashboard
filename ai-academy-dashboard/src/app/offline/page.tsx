'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  if (isOnline) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
              <WifiOff className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">You are back online!</h1>
            <p className="text-muted-foreground mb-6">
              Your connection has been restored.
            </p>
            <Link href="/">
              <Button className="bg-[#0062FF] hover:bg-[#0052D9]">
                <Home className="mr-2 h-4 w-4" />
                Back to dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-4">
            <WifiOff className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">You are offline</h1>
          <p className="text-muted-foreground mb-6">
            It looks like you don&apos;t have an internet connection. Check your connection and try again.
          </p>
          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              className="w-full bg-[#0062FF] hover:bg-[#0052D9]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <p className="text-xs text-muted-foreground">
              Some features may be available offline thanks to cache.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
