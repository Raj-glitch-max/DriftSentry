/**
 * Footer Component - Minimal
 */

'use client';

import React from 'react';

export function Footer() {
    return (
        <footer className="border-t border-border py-6 px-4 lg:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} DriftSentry. All rights reserved.</p>
                <div className="flex items-center gap-6">
                    <a href="#" className="hover:text-foreground transition-colors">Docs</a>
                    <a href="#" className="hover:text-foreground transition-colors">Support</a>
                    <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                </div>
            </div>
        </footer>
    );
}
