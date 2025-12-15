/**
 * Drift Repository
 * Data access layer for Drift entity
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';
import { BaseRepository, type BaseFilters } from './base.repository';
import type {
    Drift,
    CreateDriftInput,
    DriftFilters,
    ResourceType,
    Severity,
    DriftStatus,
    DetectedBy,
    ResolvedHow,
} from '../types/domain/drift';
import type { PaginatedResult } from '../types/api/responses';
import { DatabaseError, NotFoundError, ValidationError } from '../utils/errors';

/**
 * DriftRepository
 * All database access for Drift entity
 *
 * Contract:
 * - Never returns Prisma models directly
 * - Always transforms to domain types
 * - All methods are async
 * - Always handles errors
 * - Always logs (debug for queries, error for failures)
 */
export class DriftRepository extends BaseRepository<Drift, DriftFilters, Drift> {
    constructor() {
        super('Drift');
    }

    /**
     * Create new drift
     */
    async create(input: CreateDriftInput): Promise<Drift> {
        try {
            // accountId is required for multi-tenancy
            if (!input.accountId) {
                throw new ValidationError('accountId is required for drift creation');
            }

            const difference = this.computeDifference(input.expectedState, input.actualState);

            const result = await prisma.drift.create({
                data: {
                    resourceId: input.resourceId,
                    resourceType: input.resourceType,
                    region: input.region,
                    accountId: input.accountId,
                    expectedState: input.expectedState as Prisma.InputJsonValue,
                    actualState: input.actualState as Prisma.InputJsonValue,
                    difference: difference as Prisma.InputJsonValue,
                    severity: input.severity,
                    costImpactMonthly: input.costImpactMonthly,
                    detectedAt: new Date(),
                    detectedBy: input.detectedBy,
                    status: 'detected',
                },
            });

            this.logSuccess('create', { driftId: result.id });
            return this.toDomain(result);
        } catch (error) {
            this.logError('create', error, { input });
            throw new DatabaseError(`Failed to create drift: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get drift by ID
     */
    async getById(id: string): Promise<Drift | null> {
        try {
            const result = await prisma.drift.findUnique({
                where: { id },
            });

            if (result) {
                this.logSuccess('getById', { driftId: id });
            }
            return result ? this.toDomain(result) : null;
        } catch (error) {
            this.logError('getById', error, { driftId: id });
            throw new DatabaseError(`Failed to get drift: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get drift by ID or throw NotFoundError
     */
    async getByIdOrThrow(id: string): Promise<Drift> {
        const drift = await this.getById(id);
        if (!drift) {
            throw new NotFoundError(`Drift ${id} not found`);
        }
        return drift;
    }

    /**
     * List drifts with filters and pagination
     */
    async list(filters: DriftFilters): Promise<PaginatedResult<Drift>> {
        try {
            if (!this.validatePagination(filters.page, filters.limit)) {
                throw new ValidationError('Invalid pagination parameters');
            }

            // Build where clause
            const where: Prisma.DriftWhereInput = {};

            if (filters.status && filters.status !== 'all') {
                where.status = filters.status;
            }
            if (filters.severity && filters.severity !== 'all') {
                where.severity = filters.severity;
            }
            if (filters.resourceType) {
                where.resourceType = filters.resourceType;
            }
            if (filters.region) {
                where.region = filters.region;
            }
            if (filters.search) {
                where.resourceId = { contains: filters.search, mode: 'insensitive' };
            }

            // Build order by
            const orderBy: Prisma.DriftOrderByWithRelationInput = {};
            const sortField = filters.sortBy ?? 'createdAt';
            const sortOrder = filters.sortOrder ?? 'desc';
            (orderBy as Record<string, 'asc' | 'desc'>)[sortField] = sortOrder;

            // Get count
            const total = await prisma.drift.count({ where });

            // Get paginated results
            const results = await prisma.drift.findMany({
                where,
                skip: this.calculateOffset(filters.page, filters.limit),
                take: filters.limit,
                orderBy,
            });

            this.logSuccess('list', {
                count: results.length,
                total,
                filters,
            });

            return {
                items: results.map((r: Record<string, unknown>) => this.toDomain(r)),
                total,
            };
        } catch (error) {
            if (error instanceof ValidationError) throw error;
            this.logError('list', error, { filters });
            throw new DatabaseError(`Failed to list drifts: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update drift status
     */
    async updateStatus(
        id: string,
        status: DriftStatus,
        metadata: Record<string, unknown> = {}
    ): Promise<Drift> {
        try {
            const result = await prisma.drift.update({
                where: { id },
                data: {
                    status,
                    ...metadata,
                },
            });

            this.logSuccess('updateStatus', { driftId: id, status });
            return this.toDomain(result);
        } catch (error) {
            if (String(error).includes('Record to update not found')) {
                throw new NotFoundError(`Drift ${id} not found`);
            }
            this.logError('updateStatus', error, { driftId: id, status });
            throw new DatabaseError(`Failed to update drift: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Approve drift
     */
    async approve(id: string, reason: string, approvedBy?: string): Promise<Drift> {
        return this.updateStatus(id, 'approved', {
            approvedAt: new Date(),
            approvedBy: approvedBy ?? null,
            approvalReason: reason,
        });
    }

    /**
     * Reject drift
     */
    async reject(id: string, reason: string, rejectedBy?: string): Promise<Drift> {
        return this.updateStatus(id, 'rejected', {
            rejectedAt: new Date(),
            rejectedBy: rejectedBy ?? null,
            rejectionReason: reason,
        });
    }

    /**
     * Resolve drift
     */
    async resolve(id: string, resolvedHow: ResolvedHow): Promise<Drift> {
        return this.updateStatus(id, 'resolved', {
            resolvedAt: new Date(),
            resolvedHow,
        });
    }

    /**
     * Check for duplicate recent drifts
     */
    async findRecentDuplicate(
        resourceId: string,
        resourceType: string,
        options: { minutes?: number } = {}
    ): Promise<Drift | null> {
        try {
            const minutes = options.minutes ?? 60;
            const since = new Date(Date.now() - minutes * 60 * 1000);

            const result = await prisma.drift.findFirst({
                where: {
                    resourceId,
                    resourceType,
                    detectedAt: { gte: since },
                    status: { in: ['detected', 'triaged'] },
                },
                orderBy: { detectedAt: 'desc' },
            });

            this.logSuccess('findRecentDuplicate', { resourceId, found: !!result });
            return result ? this.toDomain(result) : null;
        } catch (error) {
            this.logError('findRecentDuplicate', error, { resourceId });
            throw new DatabaseError(`Failed to find duplicate: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get drift count by status
     */
    async countByStatus(): Promise<Record<DriftStatus, number>> {
        try {
            const results = await prisma.drift.groupBy({
                by: ['status'],
                _count: { status: true },
            });

            const counts: Record<DriftStatus, number> = {
                detected: 0,
                triaged: 0,
                approved: 0,
                rejected: 0,
                resolved: 0,
            };

            for (const result of results) {
                counts[result.status as DriftStatus] = result._count.status;
            }

            this.logSuccess('countByStatus', counts);
            return counts;
        } catch (error) {
            this.logError('countByStatus', error);
            throw new DatabaseError(`Failed to count by status: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get drift count by severity
     */
    async countBySeverity(): Promise<Record<Severity, number>> {
        try {
            const results = await prisma.drift.groupBy({
                by: ['severity'],
                _count: { severity: true },
            });

            const counts: Record<Severity, number> = {
                critical: 0,
                warning: 0,
                info: 0,
            };

            for (const result of results) {
                counts[result.severity as Severity] = result._count.severity;
            }

            this.logSuccess('countBySeverity', counts);
            return counts;
        } catch (error) {
            this.logError('countBySeverity', error);
            throw new DatabaseError(`Failed to count by severity: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Delete drift by ID
     */
    async delete(id: string): Promise<boolean> {
        try {
            await prisma.drift.delete({
                where: { id },
            });

            this.logSuccess('delete', { driftId: id });
            return true;
        } catch (error) {
            if (String(error).includes('Record to delete does not exist')) {
                return false;
            }
            this.logError('delete', error, { driftId: id });
            throw new DatabaseError(`Failed to delete drift: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // ========= PRIVATE METHODS =========

    /**
     * Transform Prisma model to domain type
     */
    private toDomain(raw: Record<string, unknown>): Drift {
        return {
            id: raw['id'] as string,
            resourceId: raw['resourceId'] as string,
            resourceType: raw['resourceType'] as ResourceType,
            region: raw['region'] as string,
            accountId: (raw['accountId'] as string) ?? undefined,
            expectedState: raw['expectedState'] as Record<string, unknown>,
            actualState: raw['actualState'] as Record<string, unknown>,
            difference: raw['difference'] as Record<string, unknown>,
            severity: raw['severity'] as Severity,
            costImpactMonthly: Number(raw['costImpactMonthly']),
            status: raw['status'] as DriftStatus,
            detectedAt: raw['detectedAt'] as Date,
            detectedBy: raw['detectedBy'] as DetectedBy,
            approvedAt: (raw['approvedAt'] as Date) ?? undefined,
            approvedBy: (raw['approvedBy'] as string) ?? undefined,
            approvalReason: (raw['approvalReason'] as string) ?? undefined,
            rejectedAt: (raw['rejectedAt'] as Date) ?? undefined,
            rejectedBy: (raw['rejectedBy'] as string) ?? undefined,
            rejectionReason: (raw['rejectionReason'] as string) ?? undefined,
            resolvedAt: (raw['resolvedAt'] as Date) ?? undefined,
            resolvedHow: (raw['resolvedHow'] as ResolvedHow) ?? undefined,
            createdAt: raw['createdAt'] as Date,
            updatedAt: raw['updatedAt'] as Date,
        };
    }

    /**
     * Compute human-readable difference
     */
    private computeDifference(
        expected: Record<string, unknown>,
        actual: Record<string, unknown>
    ): Record<string, unknown> {
        const diff: Record<string, unknown> = {};

        Object.keys(expected).forEach((key) => {
            if (JSON.stringify(expected[key]) !== JSON.stringify(actual[key])) {
                diff[key] = {
                    expected: expected[key],
                    actual: actual[key],
                };
            }
        });

        return diff;
    }
}

// Export singleton
export const driftRepository = new DriftRepository();
