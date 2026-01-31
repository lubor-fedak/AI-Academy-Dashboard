'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to our logging system
    logger.error('Application error', {
      errorName: error.name,
      errorDigest: error.digest,
      path: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    }, error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-900 border border-red-500/30 rounded-lg p-8 text-center">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-white mb-2">
            Mission Compromised
          </h1>
          <p className="text-slate-400 mb-6">
            An unexpected error occurred. Our systems are analyzing the situation.
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-slate-950 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs font-mono text-red-400 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs font-mono text-slate-500 mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              variant="default"
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Mission
            </Button>
            <Button
              onClick={() => (window.location.href = '/')}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to HQ
            </Button>
          </div>

          {/* Support Info */}
          <p className="text-xs text-slate-500 mt-6">
            If this problem persists, contact mission support with error code:{' '}
            <code className="text-slate-400">{error.digest || 'UNKNOWN'}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
