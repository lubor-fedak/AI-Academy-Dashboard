'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
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
            <h1 className="text-2xl font-bold mb-2">Si späť online!</h1>
            <p className="text-muted-foreground mb-6">
              Tvoje pripojenie bolo obnovené.
            </p>
            <Link href="/">
              <Button className="bg-[#0062FF] hover:bg-[#0052D9]">
                <Home className="mr-2 h-4 w-4" />
                Späť na dashboard
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
          <h1 className="text-2xl font-bold mb-2">Si offline</h1>
          <p className="text-muted-foreground mb-6">
            Zdá sa, že nemáš pripojenie k internetu. Skontroluj svoje pripojenie a skús to znova.
          </p>
          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              className="w-full bg-[#0062FF] hover:bg-[#0052D9]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Skúsiť znova
            </Button>
            <p className="text-xs text-muted-foreground">
              Niektoré funkcie môžu byť dostupné v offline režime vďaka cache.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
