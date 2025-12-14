/**
 * Modal Component - shadcn-inspired dialog
 */

'use client';

import React, { useEffect, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    footer?: React.ReactNode;
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
};

function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    footer,
}: ModalProps) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Content */}
            <div
                className={cn(
                    'relative w-full bg-background border border-border rounded-lg shadow-lg',
                    'animate-scale-in',
                    sizeClasses[size]
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
                aria-describedby={description ? 'modal-description' : undefined}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4">
                    <div>
                        {title && (
                            <h2 id="modal-title" className="text-lg font-semibold">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p id="modal-description" className="text-sm text-muted-foreground mt-1">
                                {description}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 pb-6">{children}</div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-3 p-6 pt-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

Modal.displayName = 'Modal';

export { Modal };
