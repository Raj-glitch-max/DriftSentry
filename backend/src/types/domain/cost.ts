/**
 * Cost Metric Domain Entity
 * Time-series data for cost tracking
 */

/**
 * Core CostMetric entity
 */
export interface CostMetric {
    /** Unique identifier (UUID) */
    id: string;
    /** Related drift ID (if applicable) */
    driftId?: string;
    /** Cost in USD */
    costUsd: number;
    /** Projected monthly cost in USD */
    costProjectedMonthly?: number;
    /** When the metric was recorded */
    recordedAt: Date;
    /** Start of the cost period */
    periodStart: Date;
    /** End of the cost period */
    periodEnd: Date;
    /** Record creation timestamp */
    createdAt: Date;
}

/**
 * Input for creating a cost metric
 */
export interface CreateCostMetricInput {
    driftId?: string;
    costUsd: number;
    costProjectedMonthly?: number;
    recordedAt: Date;
    periodStart: Date;
    periodEnd: Date;
}

/**
 * Filter options for listing cost metrics
 */
export interface CostMetricFilters {
    driftId?: string;
    startDate?: Date;
    endDate?: Date;
    page: number;
    limit: number;
}

/**
 * Cost trend data point
 */
export interface CostTrendPoint {
    date: string;
    cost: number;
    projectedCost: number;
}

/**
 * Cost summary for dashboard
 */
export interface CostSummary {
    totalCostUsd: number;
    projectedMonthlyCost: number;
    savingsPotential: number;
    trend: CostTrendPoint[];
}

/**
 * Cost metric response matching API format
 */
export interface CostMetricResponse extends CostMetric { }
