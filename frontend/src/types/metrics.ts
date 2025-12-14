/**
 * Metrics-related TypeScript types for DriftSentry
 */

/**
 * Dashboard summary metrics
 */
export interface DashboardMetrics {
    readonly totalDrifts: number;
    readonly criticalCount: number;
    readonly warningCount: number;
    readonly infoCount: number;
    readonly resolvedToday: number;
    readonly pendingApproval: number;
    readonly costSavings: number;
    readonly issuesFixed: number;
}

/**
 * Cost trend data point for charts
 */
export interface CostTrendDataPoint {
    readonly date: string;
    readonly cost: number;
    readonly savings: number;
    readonly projected?: number;
}

/**
 * Cost trend query parameters
 */
export interface CostTrendQueryParams {
    readonly days?: 7 | 30 | 90 | 365;
    readonly granularity?: 'day' | 'week' | 'month';
}

/**
 * Metrics summary for a specific time period
 */
export interface MetricsSummary {
    readonly period: string;
    readonly startDate: string;
    readonly endDate: string;
    readonly metrics: DashboardMetrics;
    readonly previousPeriodComparison?: {
        readonly driftsChange: number;
        readonly costChange: number;
        readonly resolutionRateChange: number;
    };
}
