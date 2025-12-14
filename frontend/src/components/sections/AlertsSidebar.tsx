/**
 * AlertsSidebar Component - Premium B&W alerts list
 */

'use client';

import React from 'react';
import { useAlerts, useMarkAlertAsRead, useMarkAllAlertsAsRead } from '@/hooks/useAlerts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { formatRelativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import { AlertTriangle, Info, AlertCircle, CheckCircle, Bell } from 'lucide-react';
import type { Alert } from '@/types/alerts';

const typeIcons: Record<string, React.ElementType> = {
    drift_detected: AlertTriangle,
    threshold_exceeded: AlertCircle,
    resolution_needed: Info,
    system: CheckCircle,
};

function AlertItem({ alert, index }: { alert: Alert; index: number }) {
    const markAsRead = useMarkAlertAsRead();
    const Icon = typeIcons[alert.type] || Info;

    return (
        <div
            onClick={() => !alert.read && markAsRead.mutate(alert.id)}
            className={cn(
                'p-3 rounded-lg border transition-all duration-200 cursor-pointer animate-fade-up',
                alert.read
                    ? 'border-transparent hover:bg-foreground/5'
                    : 'border-border bg-foreground/[0.02] hover:bg-foreground/5'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    'p-1.5 rounded-md',
                    alert.read ? 'bg-foreground/5' : 'bg-foreground/10'
                )}>
                    <Icon className="h-3.5 w-3.5 text-foreground/60" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn(
                            'text-sm font-medium truncate',
                            !alert.read && 'text-foreground'
                        )}>
                            {alert.title}
                        </span>
                        {alert.severity === 'critical' && (
                            <Badge variant="critical" className="text-[10px] px-1.5 py-0">
                                critical
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{alert.message}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatRelativeTime(alert.timestamp)}
                    </p>
                </div>
                {!alert.read && (
                    <span className="h-2 w-2 rounded-full bg-foreground shrink-0 mt-1.5" />
                )}
            </div>
        </div>
    );
}

export function AlertsSidebar() {
    const { data, isLoading, error } = useAlerts();
    const markAllAsRead = useMarkAllAlertsAsRead();
    const unreadCount = data?.items.filter((a) => !a.read).length || 0;

    if (isLoading) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-40">
                    <Spinner />
                </CardContent>
            </Card>
        );
    }

    if (error || !data?.items.length) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8 text-muted-foreground">
                    {error ? 'Failed to load alerts' : 'No alerts'}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-2">
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Alerts
                    </CardTitle>
                    {unreadCount > 0 && (
                        <Badge variant="default" className="text-[10px]">{unreadCount}</Badge>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={() => markAllAsRead.mutate()}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Mark all read
                    </button>
                )}
            </CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-1 pt-0">
                {data.items.slice(0, 5).map((alert, i) => (
                    <AlertItem key={alert.id} alert={alert} index={i} />
                ))}
            </CardContent>
        </Card>
    );
}
