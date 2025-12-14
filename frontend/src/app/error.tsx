/**
 * Error Page - Clean B&W
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { RefreshCw, Home } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="text-center max-w-md">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">⚠️</span>
                </div>
                <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
                <p className="text-muted-foreground mb-8">
                    An unexpected error occurred. Our team has been notified.
                </p>
                <div className="flex gap-3 justify-center">
                    <Button onClick={reset}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = '/'}>
                        <Home className="h-4 w-4 mr-2" />
                        Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
