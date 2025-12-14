/**
 * Spinner Component - minimal loading indicator
 */

'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
};

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
    function Spinner({ size = 'md', className }, ref) {
        return (
            <div ref={ref} role="status" aria-label="Loading" className={cn('inline-flex', className)}>
                <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size])} />
                <span className="sr-only">Loading...</span>
            </div>
        );
    }
);

Spinner.displayName = 'Spinner';

export { Spinner };
