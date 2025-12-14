/**
 * Sidebar Component - Clean B&W navigation
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/useUIStore';
import { useMetrics } from '@/hooks/useDrifts';
import { cn } from '@/utils/cn';
import {
    LayoutDashboard,
    AlertTriangle,
    BarChart3,
    Settings,
    Zap
} from 'lucide-react';

const navItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { id: 'drifts', label: 'Drifts', href: '/drifts', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { sidebarOpen, setSidebarOpen } = useUIStore();
    const { data: metrics } = useMetrics();

    return (
        <>
            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed lg:sticky top-14 left-0 z-40 lg:z-auto',
                    'w-56 h-[calc(100vh-3.5rem)]',
                    'bg-black border-r border-white/10',
                    'transition-transform duration-200 ease-out',
                    'lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <nav className="flex flex-col h-full p-4">
                    <ul className="space-y-1 flex-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            const badge = item.id === 'drifts' ? metrics?.pendingApproval : undefined;

                            return (
                                <li key={item.id}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-white/10 text-white'
                                                : 'text-white/50 hover:text-white hover:bg-white/5'
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="flex-1">{item.label}</span>
                                        {badge !== undefined && badge > 0 && (
                                            <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-white text-black">
                                                {badge}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Status */}
                    <div className="pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-white/40">
                            <Zap className="h-3 w-3 text-white/60" />
                            <span>All systems operational</span>
                        </div>
                    </div>
                </nav>
            </aside>
        </>
    );
}
