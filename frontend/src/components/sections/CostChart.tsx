/**
 * CostChart Component - Premium B&W with smooth animations
 */

'use client';

import React, { useState } from 'react';
import {
    Area,
    AreaChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useCostTrend } from '@/hooks/useDrifts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import { formatCurrency, formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';
import { TrendingUp } from 'lucide-react';

const timeRanges = [
    { value: 7, label: '7d' },
    { value: 30, label: '30d' },
    { value: 90, label: '90d' },
];

function CustomTooltip({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string }>;
    label?: string
}) {
    if (!active || !payload?.length) return null;

    return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
            <p className="text-xs font-medium mb-1">{formatDate(label || '', { short: true })}</p>
            <p className="text-sm font-semibold">{formatCurrency(payload[0].value)}</p>
        </div>
    );
}

export function CostChart() {
    const [days, setDays] = useState(30);
    const { data, isLoading, error } = useCostTrend(days);

    if (isLoading) {
        return (
            <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <CardTitle>Cost Trend</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Cost Trend
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                        Failed to load data
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="animate-fade-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-6">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Cost Trend
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Drift cost impact over time</p>
                </div>

                <div className="flex gap-1 p-1 bg-foreground/5 rounded-lg">
                    {timeRanges.map((range) => (
                        <button
                            key={range.label}
                            onClick={() => setDays(range.value)}
                            className={cn(
                                'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                                days === range.value
                                    ? 'bg-foreground text-background shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </CardHeader>

            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="hsl(var(--border))"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(v) => formatDate(v, { short: true })}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                width={45}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="cost"
                                stroke="hsl(var(--foreground))"
                                strokeWidth={2}
                                fill="url(#colorCost)"
                                dot={false}
                                activeDot={{
                                    r: 4,
                                    strokeWidth: 2,
                                    fill: 'hsl(var(--background))',
                                    stroke: 'hsl(var(--foreground))'
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
