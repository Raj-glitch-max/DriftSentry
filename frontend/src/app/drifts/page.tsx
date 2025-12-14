'use client';

import React from 'react';
import { Header, Sidebar, Footer } from '@/components/layout';
import { useDrifts } from '@/hooks/useDrifts';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatRelativeTime, formatCurrency } from '@/utils/format';
import { Server, Database, Cloud, Lock, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/utils/cn';

const resourceIcons: Record<string, React.ElementType> = {
    ec2_instance: Server,
    s3_bucket: Cloud,
    rds_instance: Database,
    lambda_function: Cloud,
    security_group: Lock,
    iam_role: User,
};

export default function DriftsPage() {
    const { data, isLoading, error } = useDrifts({ limit: 50 });

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <div className="flex flex-1">
                <Sidebar />

                <main className="flex-1 overflow-x-hidden">
                    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-bold">Drifts</h1>
                                <p className="text-muted-foreground mt-1">
                                    Monitor and manage infrastructure configuration drifts
                                </p>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-16 bg-card border border-border rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : error ? (
                            <Card className="p-8 text-center">
                                <p className="text-muted-foreground mb-4">Failed to load drifts</p>
                                <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
                            </Card>
                        ) : !data?.items.length ? (
                            <Card className="p-12 text-center">
                                <h3 className="text-lg font-semibold mb-2">No Drifts Detected</h3>
                                <p className="text-muted-foreground">Your infrastructure is in sync.</p>
                            </Card>
                        ) : (
                            <div className="bg-card border border-border rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                                            <tr>
                                                <th className="px-6 py-4">Resource</th>
                                                <th className="px-6 py-4">Type</th>
                                                <th className="px-6 py-4">Severity</th>
                                                <th className="px-6 py-4">Cost Impact</th>
                                                <th className="px-6 py-4">Detected</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {data.items.map((drift) => {
                                                const Icon = resourceIcons[drift.resourceType] || Server;
                                                return (
                                                    <tr key={drift.id} className="group hover:bg-muted/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-lg bg-background border border-border">
                                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                                </div>
                                                                <span className="font-medium text-foreground">
                                                                    {drift.resource}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-muted-foreground">
                                                            {drift.type}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge
                                                                variant={drift.severity === 'critical' ? 'critical' : 'secondary'}
                                                                dot
                                                            >
                                                                {drift.severity}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={cn(drift.costImpact > 1000 && 'text-foreground font-medium')}>
                                                                {formatCurrency(drift.costImpact)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-muted-foreground">
                                                            {formatRelativeTime(drift.detectedAt)}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge variant="outline" className="capitalize">
                                                                {drift.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <Link
                                                                href={`/drift/${drift.id}`}
                                                                className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-background hover:border border-border transition-all text-muted-foreground hover:text-foreground"
                                                            >
                                                                <ArrowRight className="h-4 w-4" />
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <Footer />
                </main>
            </div>
        </div>
    );
}
