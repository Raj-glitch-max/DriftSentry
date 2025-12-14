/**
 * Input Component - shadcn-inspired
 */

'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helper?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    function Input({ className, type, label, error, helper, id, ...props }, ref) {
        const inputId = id || React.useId();

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium mb-2"
                    >
                        {label}
                    </label>
                )}

                <input
                    type={type}
                    id={inputId}
                    className={cn(
                        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                        'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
                        'placeholder:text-muted-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        error && 'border-destructive focus-visible:ring-destructive',
                        className
                    )}
                    ref={ref}
                    {...props}
                />

                {error && (
                    <p className="mt-2 text-sm text-destructive">{error}</p>
                )}

                {helper && !error && (
                    <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
