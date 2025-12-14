/**
 * Cost Metric Repository
 * Data access layer for CostMetric entity
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';
import { BaseRepository } from './base.repository';
import type {
    CostMetric,
    CreateCostMetricInput,
    CostMetricFilters,
    CostSummary,
    CostTrendPoint,
} from '../types/domain/cost';
import type { PaginatedResult } from '../types/api/responses';
import { DatabaseError, ValidationError } from '../utils/errors';

/**
 * CostMetricRepository
 * All database access for CostMetric entity
 */
export class CostMetricRepository extends BaseRepository<CostMetric, CostMetricFilters, CostMetric> {
    constructor() {
        super('CostMetric');
    }

    /**
     * Create new cost metric
     */
    async create(input: CreateCostMetricInput): Promise<CostMetric> {
        try {
            const result = await prisma.costMetric.create({
                data: {
                    driftId: input.driftId,
                    costUsd: input.costUsd,
                    costProjectedMonthly: input.costProjectedMonthly,
                    recordedAt: input.recordedAt,
                    periodStart: input.periodStart,
                    periodEnd: input.periodEnd,
                },
            });

            this.logSuccess('create', { costMetricId: result.id });
            return this.toDomain(result);
        } catch (error) {
            this.logError('create', error, { input });
            throw new DatabaseError(`Failed to create cost metric: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get cost metric by ID
     */
    async getById(id: string): Promise<CostMetric | null> {
        try {
            const result = await prisma.costMetric.findUnique({
                where: { id },
            });

            if (result) {
                this.logSuccess('getById', { costMetricId: id });
            }
            return result ? this.toDomain(result) : null;
        } catch (error) {
            this.logError('getById', error, { costMetricId: id });
            throw new DatabaseError(`Failed to get cost metric: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * List cost metrics with filters and pagination
     */
    async list(filters: CostMetricFilters): Promise<PaginatedResult<CostMetric>> {
        try {
            if (!this.validatePagination(filters.page, filters.limit)) {
                throw new ValidationError('Invalid pagination parameters');
            }

            const where: Prisma.CostMetricWhereInput = {};

            if (filters.driftId) {
                where.driftId = filters.driftId;
            }
            if (filters.startDate || filters.endDate) {
                where.recordedAt = {};
                if (filters.startDate) {
                    where.recordedAt.gte = filters.startDate;
                }
                if (filters.endDate) {
                    where.recordedAt.lte = filters.endDate;
                }
            }

            const total = await prisma.costMetric.count({ where });

            const results = await prisma.costMetric.findMany({
                where,
                skip: this.calculateOffset(filters.page, filters.limit),
                take: filters.limit,
                orderBy: { recordedAt: 'desc' },
            });

            this.logSuccess('list', { count: results.length, total });

            return {
                items: results.map((r) => this.toDomain(r)),
                total,
            };
        } catch (error) {
            if (error instanceof ValidationError) throw error;
            this.logError('list', error, { filters });
            throw new DatabaseError(`Failed to list cost metrics: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get cost metrics for a drift
     */
    async getByDriftId(driftId: string): Promise<CostMetric[]> {
        try {
            const results = await prisma.costMetric.findMany({
                where: { driftId },
                orderBy: { recordedAt: 'desc' },
            });

            this.logSuccess('getByDriftId', { driftId, count: results.length });
            return results.map((r) => this.toDomain(r));
        } catch (error) {
            this.logError('getByDriftId', error, { driftId });
            throw new DatabaseError(`Failed to get cost metrics: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get cost summary for dashboard
     */
    async getCostSummary(days: number = 30): Promise<CostSummary> {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // Get total and projected cost from drifts
            const driftCosts = await prisma.drift.aggregate({
                where: {
                    status: { in: ['detected', 'triaged'] },
                },
                _sum: { costImpactMonthly: true },
                _count: true,
            });

            // Calculate savings potential (from resolved drifts)
            const resolvedCosts = await prisma.drift.aggregate({
                where: {
                    status: 'resolved',
                    resolvedAt: { gte: startDate },
                },
                _sum: { costImpactMonthly: true },
            });

            // Get trend data (last N days)
            const trendData = await this.getTrendData(startDate);

            const summary: CostSummary = {
                totalCostUsd: Number(driftCosts._sum.costImpactMonthly ?? 0),
                projectedMonthlyCost: Number(driftCosts._sum.costImpactMonthly ?? 0),
                savingsPotential: Number(resolvedCosts._sum.costImpactMonthly ?? 0),
                trend: trendData,
            };

            this.logSuccess('getCostSummary', { days, totalCost: summary.totalCostUsd });
            return summary;
        } catch (error) {
            this.logError('getCostSummary', error, { days });
            throw new DatabaseError(`Failed to get cost summary: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get cost trend data points
     */
    private async getTrendData(startDate: Date): Promise<CostTrendPoint[]> {
        const metrics = await prisma.costMetric.findMany({
            where: { recordedAt: { gte: startDate } },
            orderBy: { recordedAt: 'asc' },
        });

        // Group by date
        const grouped = new Map<string, { cost: number; projected: number }>();

        for (const metric of metrics) {
            const date = metric.recordedAt.toISOString().split('T')[0];
            if (!date) continue;

            const existing = grouped.get(date) ?? { cost: 0, projected: 0 };
            grouped.set(date, {
                cost: existing.cost + Number(metric.costUsd),
                projected: existing.projected + Number(metric.costProjectedMonthly ?? 0),
            });
        }

        return Array.from(grouped.entries()).map(([date, data]) => ({
            date,
            cost: data.cost,
            projectedCost: data.projected,
        }));
    }

    /**
     * Delete cost metric by ID
     */
    async delete(id: string): Promise<boolean> {
        try {
            await prisma.costMetric.delete({
                where: { id },
            });

            this.logSuccess('delete', { costMetricId: id });
            return true;
        } catch (error) {
            if (String(error).includes('Record to delete does not exist')) {
                return false;
            }
            this.logError('delete', error, { costMetricId: id });
            throw new DatabaseError(`Failed to delete cost metric: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // ========= PRIVATE METHODS =========

    /**
     * Transform Prisma model to domain type
     */
    private toDomain(raw: Record<string, unknown>): CostMetric {
        return {
            id: raw['id'] as string,
            driftId: (raw['driftId'] as string) ?? undefined,
            costUsd: Number(raw['costUsd']),
            costProjectedMonthly: raw['costProjectedMonthly'] ? Number(raw['costProjectedMonthly']) : undefined,
            recordedAt: raw['recordedAt'] as Date,
            periodStart: raw['periodStart'] as Date,
            periodEnd: raw['periodEnd'] as Date,
            createdAt: raw['createdAt'] as Date,
        };
    }
}

// Export singleton
export const costMetricRepository = new CostMetricRepository();
