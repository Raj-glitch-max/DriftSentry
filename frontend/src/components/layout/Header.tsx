/**
 * Header Component - Clean B&W navigation
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useUIStore } from '@/store/useUIStore';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useUnreadAlertCount } from '@/hooks/useAlerts';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';
import { Menu, X, Bell, Sun, Moon, Shield } from 'lucide-react';

export function Header() {
    const { sidebarOpen, toggleSidebar } = useUIStore();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const { data: unreadCount } = useUnreadAlertCount();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80">
            <div className="flex h-14 items-center justify-between px-4 lg:px-6">
                {/* Left */}
                <div className="flex items-center gap-4">
                    {/* Mobile menu */}
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
                    >
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 font-semibold text-white">
                        <Shield className="h-5 w-5" />
                        <span className="hidden sm:inline">DriftSentry</span>
                    </Link>
                </div>

                {/* Center nav - Desktop */}
                <nav className="hidden lg:flex items-center gap-1">
                    <NavLink href="/" label="Dashboard" />
                    <NavLink href="/drifts" label="Drifts" />
                    <NavLink href="/settings" label="Settings" />
                </nav>

                {/* Right */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <button
                        className="relative p-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount && unreadCount > 0 && (
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-white" />
                        )}
                    </button>

                    {/* Theme toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label={isDarkMode ? 'Light mode' : 'Dark mode'}
                    >
                        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>

                    {/* User */}
                    <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 text-white/80 hover:text-white hover:bg-white/10">
                        <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium text-white">
                            A
                        </div>
                        <span>Admin</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}

function NavLink({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                'text-white/50 hover:text-white hover:bg-white/10'
            )}
        >
            {label}
        </Link>
    );
}
