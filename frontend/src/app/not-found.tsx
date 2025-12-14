/**
 * 404 Not Found - Clean B&W
 */

import Link from 'next/link';
import { Button } from '@/components/common/Button';
import { Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="text-center max-w-md">
                <h1 className="text-8xl font-bold text-muted-foreground/20 mb-4">404</h1>
                <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
                <p className="text-muted-foreground mb-8">
                    The page you&apos;re looking for doesn&apos;t exist.
                </p>
                <Link href="/">
                    <Button>
                        <Home className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
