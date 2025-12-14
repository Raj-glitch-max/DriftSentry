/**
 * Badge Component - shadcn-inspired
 */

'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
    `inline-flex items-center rounded-full border px-2.5 py-0.5
   text-xs font-semibold transition-colors
   focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`,
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground',
                secondary: 'border-transparent bg-secondary text-secondary-foreground',
                destructive: 'border-transparent bg-destructive text-destructive-foreground',
                outline: 'text-foreground',
                critical: 'border-transparent bg-foreground text-background',
                warning: 'border-transparent bg-secondary text-secondary-foreground',
                info: 'border-border bg-background text-foreground',
                success: 'border-transparent bg-primary/10 text-primary',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
    dot?: boolean;
    pulse?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    function Badge({ className, variant, dot, pulse, children, ...props }, ref) {
        return (
            <div
                ref={ref}
                className={cn(badgeVariants({ variant }), className)}
                {...props}
            >
                {dot && (
                    <span
                        className={cn(
                            'mr-1 h-1.5 w-1.5 rounded-full bg-current',
                            pulse && 'animate-pulse'
                        )}
                    />
                )}
                {children}
            </div>
        );
    }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
