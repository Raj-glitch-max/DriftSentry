/**
 * Metrics Service
 * Dashboard metrics and cost calculations
 */

import { driftRepository } from '../repositories/drift.repository';
import { costMetricRepository } from '../repositories/cost.repository';
import { alertRepository } from '../repositories/alert.repository';
import { cacheService, CacheKeys, CacheTTL } from './cache.service';
import { logger } from '../utils/logger';
import type { CostSummary, CostTrendPoint } from '../types/domain/cost';

/**
 * Dashboard summary metrics
 */
export interface DashboardSummary {
    drifts: {
        total: number;
        byStatus: Record<string, number>;
        bySeverity: Record<string, number>;
    };
    alerts: {
        total: number;
        unread: number;
    };
    cost: {
        totalMonthlyImpact: number;
        projectedSavings: number;
    };
}

/**
 * MetricsService
 * Handles dashboard metrics and cost calculations
 */
export class MetricsService {
    /**
     * Get dashboard summary metrics (with caching)
     */
    async getSummary(days: number = 30, accountId?: string): Promise<DashboardSummary> {
        const startTime = Date.now();

        // Try cache first
        const cacheKey = CacheKeys.metrics.summary(accountId);
        const cached = await cacheService.get<DashboardSummary>(cacheKey);

        if (cached) {
            logger.debug('Metrics summary served from cache', {
                accountId,
                duration: Date.now() - startTime
            });
            return cached;
        }

        try {
            // Get drift counts
            const [statusCounts, severityCounts] = await Promise.all([
                driftRepository.countByStatus(),
                driftRepository.countBySeverity(),
            ]);

            // Calculate totals
            const totalDrifts = Object.values(statusCounts).reduce((a, b) => a + b, 0);

            // Get alert counts
            const alertResult = await alertRepository.list({ page: 1, limit: 1 });
            const unreadCount = await alertRepository.getUnreadCount();

            // Get cost summary
            const costSummary = await costMetricRepository.getCostSummary(days);

            const summary: DashboardSummary = {
                drifts: {
                    total: totalDrifts,
                    byStatus: statusCounts,
                    bySeverity: severityCounts,
                },
                alerts: {
                    total: alertResult.total,
                    unread: unreadCount,
                },
                cost: {
                    totalMonthlyImpact: costSummary.totalCostUsd,
                    projectedSavings: costSummary.savingsPotential,
                },
            };

            // Cache the result
            await cacheService.set(cacheKey, summary, CacheTTL.METRICS_SUMMARY);

            logger.debug('Dashboard summary calculated', {
                totalDrifts,
                unreadAlerts: unreadCount,
                duration: Date.now() - startTime,
            });

            return summary;
        } catch (error) {
            logger.error('Failed to get dashboard summary', {
                error: error instanceof Error ? error.message : String(error),
                duration: Date.now() - startTime,
            });
            throw error;
        }
    }

    /**
     * Get cost trend data for charts
     */
    async getCostTrend(days: number = 30): Promise<{
        trend: CostTrendPoint[];
        summary: CostSummary;
    }> {
        const startTime = Date.now();

        try {
            const summary = await costMetricRepository.getCostSummary(days);

            logger.debug('Cost trend calculated', {
                days,
                dataPoints: summary.trend.length,
                duration: Date.now() - startTime,
            });

            return {
                trend: summary.trend,
                summary,
            };
        } catch (error) {
            logger.error('Failed to get cost trend', {
                error: error instanceof Error ? error.message : String(error),
                days,
            });
            throw error;
        }
    }

    /**
     * Get severity distribution for charts
     */
    async getSeverityDistribution(): Promise<{
        data: Array<{ severity: string; count: number; percentage: number }>;
        total: number;
    }> {
        try {
            const counts = await driftRepository.countBySeverity();
            const total = Object.values(counts).reduce((a, b) => a + b, 0);

            const data = Object.entries(counts).map(([severity, count]) => ({
                severity,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            }));

            return { data, total };
        } catch (error) {
            logger.error('Failed to get severity distribution', { error });
            throw error;
        }
    }

    /**
     * Get status distribution for charts
     */
    async getStatusDistribution(): Promise<{
        data: Array<{ status: string; count: number; percentage: number }>;
        total: number;
    }> {
        try {
            const counts = await driftRepository.countByStatus();
            const total = Object.values(counts).reduce((a, b) => a + b, 0);

            const data = Object.entries(counts).map(([status, count]) => ({
                status,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            }));

            return { data, total };
        } catch (error) {
            logger.error('Failed to get status distribution', { error });
            throw error;
        }
    }
}

// Export singleton
export const metricsService = new MetricsService();
