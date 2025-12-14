/**
 * MetricsOverlay Component - Premium B&W with animated count-up
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useMetrics } from '@/hooks/useDrifts';
import { Card } from '@/components/common/Card';
import { formatCurrency, formatCompactNumber } from '@/utils/format';
import { cn } from '@/utils/cn';
import { Target, AlertTriangle, DollarSign, CheckCircle, TrendingUp } from 'lucide-react';

function useCountUp(target: number, duration: number = 1000) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4); // Quartic ease-out
            setCount(Math.floor(eased * target));
            if (progress < 1) animationFrame = requestAnimationFrame(animate);
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [target, duration]);

    return count;
}

interface MetricCardProps {
    title: string;
    value: number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    formatter?: (n: number) => string;
    icon: React.ElementType;
    delay?: number;
}

function MetricCard({
    title,
    value,
    change,
    changeType = 'neutral',
    formatter = formatCompactNumber,
    icon: Icon,
    delay = 0
}: MetricCardProps) {
    const animatedValue = useCountUp(value, 1200);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <Card
            className={cn(
                'p-5 transition-all duration-500 hover-lift',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
        >
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-3xl font-semibold tracking-tight">{formatter(animatedValue)}</p>
                    {change && (
                        <div className="flex items-center gap-1 text-xs">
                            <TrendingUp className={cn(
                                'h-3 w-3',
                                changeType === 'positive' && 'text-foreground',
                                changeType === 'negative' && 'text-foreground/50'
                            )} />
                            <span className={cn(
                                changeType === 'positive' && 'text-foreground',
                                changeType === 'negative' && 'text-muted-foreground'
                            )}>
                                {change}
                            </span>
                        </div>
                    )}
                </div>
                <div className="p-2.5 rounded-lg bg-foreground/5">
                    <Icon className="h-5 w-5 text-foreground/70" />
                </div>
            </div>
        </Card>
    );
}

function MetricSkeleton() {
    return (
        <Card className="p-5">
            <div className="flex items-start justify-between">
                <div>
                    <div className="h-4 w-24 skeleton rounded mb-3" />
                    <div className="h-8 w-20 skeleton rounded" />
                </div>
                <div className="h-11 w-11 skeleton rounded-lg" />
            </div>
        </Card>
    );
}

export function MetricsOverlay() {
    const { data: metrics, isLoading, error } = useMetrics();

    if (isLoading) {
        return (
            <section className="py-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <MetricSkeleton key={i} />)}
                </div>
            </section>
        );
    }

    if (error || !metrics) return null;

    return (
        <section className="py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Drifts"
                    value={metrics.totalDrifts}
                    change="+12% this week"
                    changeType="neutral"
                    icon={Target}
                    delay={0}
                />
                <MetricCard
                    title="Critical Issues"
                    value={metrics.criticalCount}
                    change="2 new today"
                    changeType="negative"
                    icon={AlertTriangle}
                    delay={100}
                />
                <MetricCard
                    title="Cost Savings"
                    value={metrics.costSavings}
                    change="+$2.3k saved"
                    changeType="positive"
                    formatter={formatCurrency}
                    icon={DollarSign}
                    delay={200}
                />
                <MetricCard
                    title="Issues Fixed"
                    value={metrics.issuesFixed}
                    change="98% success rate"
                    changeType="positive"
                    icon={CheckCircle}
                    delay={300}
                />
            </div>
        </section>
    );
}
