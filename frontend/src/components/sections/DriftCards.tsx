/**
 * DriftCards Component - Premium B&W with cool transitions
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { useDrifts, useApproveDrift, useRejectDrift } from '@/hooks/useDrifts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatRelativeTime, formatCurrency } from '@/utils/format';
import { cn } from '@/utils/cn';
import { Server, Database, Cloud, Lock, User, ArrowRight, Check, X } from 'lucide-react';
import type { Drift } from '@/types/drift';

const resourceIcons: Record<string, React.ElementType> = {
    ec2_instance: Server,
    s3_bucket: Cloud,
    rds_instance: Database,
    lambda_function: Cloud,
    security_group: Lock,
    iam_role: User,
};

function DriftCard({ drift, index }: { drift: Drift; index: number }) {
    const approveMutation = useApproveDrift();
    const rejectMutation = useRejectDrift();
    const isProcessing = approveMutation.isPending || rejectMutation.isPending;
    const Icon = resourceIcons[drift.resourceType] || Server;

    return (
        <div
            className={cn(
                'group relative overflow-hidden rounded-xl',
                'bg-card border border-border',
                'transition-all duration-300 ease-out',
                'hover:border-foreground/20 hover:shadow-xl hover:-translate-y-1',
                'animate-fade-up'
            )}
            style={{ animationDelay: `${index * 75}ms` }}
        >
            <Link href={`/drift/${drift.id}`} className="block p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-foreground/5 group-hover:bg-foreground/10 transition-colors">
                            <Icon className="h-4 w-4 text-foreground/70" />
                        </div>
                        <div>
                            <h3 className="font-medium text-sm line-clamp-1 group-hover:text-foreground transition-colors">
                                {drift.resource}
                            </h3>
                            <p className="text-xs text-muted-foreground">{drift.type}</p>
                        </div>
                    </div>
                    <Badge
                        variant={drift.severity === 'critical' ? 'critical' : 'secondary'}
                        dot
                        pulse={drift.status === 'detected'}
                    >
                        {drift.severity}
                    </Badge>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm mb-5">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Region</span>
                        <span className="font-medium">{drift.region}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost Impact</span>
                        <span className={cn('font-medium', drift.costImpact > 1000 && 'text-foreground')}>
                            {formatCurrency(drift.costImpact)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Detected</span>
                        <span>{formatRelativeTime(drift.detectedAt)}</span>
                    </div>
                </div>

                {/* Actions */}
                {drift.status !== 'resolved' ? (
                    <div className="flex gap-2 pt-4 border-t border-border">
                        <Button
                            variant="default"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={(e) => {
                                e.preventDefault();
                                approveMutation.mutateAsync({ id: drift.id });
                            }}
                            isLoading={approveMutation.isPending}
                            disabled={isProcessing}
                        >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={(e) => {
                                e.preventDefault();
                                rejectMutation.mutateAsync({ id: drift.id, reason: 'Rejected' });
                            }}
                            isLoading={rejectMutation.isPending}
                            disabled={isProcessing}
                        >
                            <X className="h-3.5 w-3.5" />
                            Reject
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 pt-4 border-t border-border text-sm text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-foreground/30" />
                        Resolved
                    </div>
                )}
            </Link>
        </div>
    );
}

function DriftCardSkeleton() {
    return (
        <div className="rounded-xl border border-border p-5">
            <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg skeleton" />
                <div className="flex-1">
                    <div className="h-4 w-32 skeleton rounded mb-2" />
                    <div className="h-3 w-24 skeleton rounded" />
                </div>
                <div className="h-5 w-16 skeleton rounded-full" />
            </div>
            <div className="space-y-2">
                <div className="h-4 w-full skeleton rounded" />
                <div className="h-4 w-full skeleton rounded" />
                <div className="h-4 w-3/4 skeleton rounded" />
            </div>
        </div>
    );
}

export function DriftCards() {
    const { data, isLoading, error, refetch } = useDrifts({ limit: 6 });

    if (isLoading) {
        return (
            <section className="py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Recent Drifts</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <DriftCardSkeleton key={i} />)}
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="py-8">
                <Card className="p-8 text-center">
                    <p className="text-muted-foreground mb-4">Failed to load drifts</p>
                    <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
                </Card>
            </section>
        );
    }

    if (!data?.items.length) {
        return (
            <section className="py-8">
                <Card className="p-12 text-center">
                    <h3 className="text-lg font-semibold mb-2">No Drifts Detected</h3>
                    <p className="text-muted-foreground">Your infrastructure is in sync.</p>
                </Card>
            </section>
        );
    }

    return (
        <section className="py-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Recent Drifts</h2>
                <Link
                    href="/drifts"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                    View all ({data.total})
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.items.map((drift, i) => <DriftCard key={drift.id} drift={drift} index={i} />)}
            </div>
        </section>
    );
}
