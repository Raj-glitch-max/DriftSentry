/**
 * Drift Detail Page
 */

'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header, Sidebar, Footer } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { useDriftDetails, useApproveDrift, useRejectDrift, useDriftTimeline } from '@/hooks/useDrifts';
import { formatDate, formatCurrency, formatRelativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';

export default function DriftDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { data: drift, isLoading, error } = useDriftDetails(id);
    const { data: timeline } = useDriftTimeline(id);
    const approveMutation = useApproveDrift();
    const rejectMutation = useRejectDrift();

    const isProcessing = approveMutation.isPending || rejectMutation.isPending;

    const handleApprove = async () => {
        await approveMutation.mutateAsync({ id });
        router.push('/');
    };

    const handleReject = async () => {
        await rejectMutation.mutateAsync({ id, reason: 'Rejected by user' });
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex flex-1">
                    <Sidebar />
                    <main className="flex-1 flex items-center justify-center">
                        <Spinner size="xl" />
                    </main>
                </div>
            </div>
        );
    }

    if (error || !drift) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex flex-1">
                    <Sidebar />
                    <main className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-4">Drift Not Found</h2>
                            <p className="text-gray-500 mb-6">The drift you&apos;re looking for doesn&apos;t exist.</p>
                            <Link href="/">
                                <Button>Back to Dashboard</Button>
                            </Link>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    const resourceTypeIcons: Record<string, string> = {
        ec2_instance: '🖥️',
        s3_bucket: '📦',
        rds_instance: '🗄️',
        lambda_function: 'λ',
        security_group: '🔒',
        iam_role: '👤',
        vpc: '🌐',
        dynamodb_table: '📊',
        unknown: '❓',
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <div className="flex flex-1">
                <Sidebar />

                <main className="flex-1 overflow-x-hidden">
                    <div className="px-4 lg:px-8 py-8 max-w-5xl mx-auto">
                        {/* Breadcrumb */}
                        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                            <Link href="/" className="hover:text-gray-900 dark:hover:text-white">
                                Dashboard
                            </Link>
                            <span>/</span>
                            <span className="text-gray-900 dark:text-white">Drift Details</span>
                        </nav>

                        {/* Header */}
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
                            <div className="flex items-start gap-4">
                                <span className="text-4xl">
                                    {resourceTypeIcons[drift.resourceType] || '❓'}
                                </span>
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-bold mb-2">{drift.resource}</h1>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Badge variant={drift.severity === 'critical' ? 'critical' : drift.severity === 'warning' ? 'warning' : 'secondary'} dot pulse={drift.status === 'detected'}>
                                            {drift.severity}
                                        </Badge>
                                        <span className="text-gray-500">{drift.type}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-500">{drift.region}</span>
                                    </div>
                                </div>
                            </div>

                            {drift.status !== 'resolved' && (
                                <div className="flex gap-3">
                                    <Button
                                        variant="default"
                                        onClick={handleApprove}
                                        isLoading={approveMutation.isPending}
                                        disabled={isProcessing}
                                    >
                                        Approve Remediation
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleReject}
                                        isLoading={rejectMutation.isPending}
                                        disabled={isProcessing}
                                    >
                                        Reject
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main content */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Overview */}
                                <Card>
                                    <h2 className="text-lg font-semibold mb-4">Overview</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                            <p className="font-medium capitalize">{drift.status}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Cost Impact</p>
                                            <p className={cn(
                                                'font-medium',
                                                drift.costImpact > 1000 ? 'text-red-500' : ''
                                            )}>
                                                {formatCurrency(drift.costImpact)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Detected</p>
                                            <p className="font-medium">{formatDate(drift.detectedAt, { includeTime: true })}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Account</p>
                                            <p className="font-medium">{drift.account}</p>
                                        </div>
                                    </div>
                                </Card>

                                {/* State Comparison */}
                                <Card>
                                    <h2 className="text-lg font-semibold mb-4">State Comparison</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                Expected State
                                            </h3>
                                            <pre className="p-3 bg-gray-50 dark:bg-black/20 rounded-lg text-sm overflow-x-auto">
                                                <code>{JSON.stringify(drift.expectedState, null, 2)}</code>
                                            </pre>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                Actual State
                                            </h3>
                                            <pre className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg text-sm overflow-x-auto">
                                                <code>{JSON.stringify(drift.actualState, null, 2)}</code>
                                            </pre>
                                        </div>
                                    </div>
                                </Card>

                                {/* Difference */}
                                <Card>
                                    <h2 className="text-lg font-semibold mb-4">Changes Detected</h2>
                                    <pre className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg text-sm overflow-x-auto">
                                        <code>{JSON.stringify(drift.difference, null, 2)}</code>
                                    </pre>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Timeline */}
                                <Card>
                                    <h2 className="text-lg font-semibold mb-4">Activity Timeline</h2>
                                    {timeline && timeline.length > 0 ? (
                                        <div className="space-y-4">
                                            {timeline.map((event, index) => (
                                                <div key={event.id} className="flex gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <div className={cn(
                                                            'w-3 h-3 rounded-full',
                                                            event.action === 'detected' && 'bg-amber-500',
                                                            event.action === 'approved' && 'bg-emerald-500',
                                                            event.action === 'rejected' && 'bg-red-500',
                                                            event.action === 'resolved' && 'bg-blue-500',
                                                            event.action === 'escalated' && 'bg-purple-500'
                                                        )} />
                                                        {index < timeline.length - 1 && (
                                                            <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 my-1" />
                                                        )}
                                                    </div>
                                                    <div className="pb-4">
                                                        <p className="text-sm font-medium capitalize">{event.action}</p>
                                                        <p className="text-xs text-gray-500">{event.description}</p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {formatRelativeTime(event.timestamp)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">No activity yet</p>
                                    )}
                                </Card>

                                {/* Quick Actions */}
                                <Card>
                                    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                                    <div className="space-y-2">
                                        <Button variant="ghost" size="sm" className="w-full justify-start">
                                            📋 Copy Resource ARN
                                        </Button>
                                        <Button variant="ghost" size="sm" className="w-full justify-start">
                                            🔗 View in AWS Console
                                        </Button>
                                        <Button variant="ghost" size="sm" className="w-full justify-start">
                                            📊 View History
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>

                    <Footer />
                </main>
            </div>
        </div>
    );
}
