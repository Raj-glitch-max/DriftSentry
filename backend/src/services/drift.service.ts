/**
 * Drift Service
 * Core business logic for drift management
 */

import { driftRepository } from '../repositories/drift.repository';
import { auditService } from './audit.service';
import { alertService } from './alert.service';
import { emitDriftCreated, emitDriftApproved, emitDriftRejected } from '../websocket/events';
import { logger } from '../utils/logger';
import type { Drift, CreateDriftInput, DriftFilters } from '../types/domain/drift';
import {
    ValidationError,
    ConflictError,
    NotFoundError,
} from '../utils/errors';

/**
 * Extended drift with computed fields
 */
export interface DriftWithMeta extends Drift {
    alertCount: number;
    canApprove: boolean;
    canReject: boolean;
}

/**
 * DriftService
 * Handles drift lifecycle: create, list, get, approve, reject
 */
export class DriftService {
    /**
     * Create new drift detection
     *
     * @throws ValidationError if invalid input
     * @throws ConflictError if duplicate recent drift exists
     */
    async createDrift(
        input: CreateDriftInput,
        userId?: string
    ): Promise<Drift> {
        const startTime = Date.now();

        try {
            // 1. Validate business rules
            this.validateDriftInput(input);

            // 2. Check for duplicate recent drifts
            const existing = await driftRepository.findRecentDuplicate(
                input.resourceId,
                input.resourceType,
                { minutes: 60 }
            );

            if (existing) {
                logger.warn('Duplicate drift detected', {
                    existingId: existing.id,
                    resourceId: input.resourceId,
                });
                throw new ConflictError(
                    'Similar drift detected recently. Check existing drift before creating new one.'
                );
            }

            // 3. Create drift in database
            const drift = await driftRepository.create({
                resourceId: input.resourceId,
                resourceType: input.resourceType,
                region: input.region,
                accountId: input.accountId,
                expectedState: input.expectedState,
                actualState: input.actualState,
                severity: input.severity,
                costImpactMonthly: input.costImpactMonthly,
                detectedBy: input.detectedBy,
            });

            // 4. Create audit log
            await auditService.log({
                action: 'drift_created',
                driftId: drift.id,
                actorId: userId,
                newValue: { status: drift.status, severity: drift.severity },
                details: {
                    resourceId: input.resourceId,
                    resourceType: input.resourceType,
                },
            });

            // 5. Create alert if critical
            if (input.severity === 'critical') {
                await alertService.createAlert({
                    driftId: drift.id,
                    type: 'drift_detected',
                    severity: 'critical',
                    title: `🚨 CRITICAL: ${input.resourceId} drift detected`,
                    message: `Critical infrastructure drift in ${input.resourceType} at ${input.region}. Cost impact: $${input.costImpactMonthly}/month`,
                });
            }

            logger.info('Drift created successfully', {
                driftId: drift.id,
                severity: input.severity,
                duration: Date.now() - startTime,
            });

            // 6. Emit WebSocket event
            emitDriftCreated(drift);

            return drift;
        } catch (error) {
            logger.error('Failed to create drift', {
                error: error instanceof Error ? error.message : String(error),
                resourceId: input.resourceId,
                resourceType: input.resourceType,
                duration: Date.now() - startTime,
            });
            throw error;
        }
    }

    /**
     * Get drift by ID with related data
     *
     * @throws NotFoundError if drift doesn't exist
     */
    async getDrift(driftId: string): Promise<DriftWithMeta> {
        try {
            const drift = await driftRepository.getById(driftId);

            if (!drift) {
                throw new NotFoundError(`Drift ${driftId} not found`);
            }

            // Get related data
            const alertCount = await alertService.countByDrift(driftId);

            // Determine what actions are allowed
            const canApprove = ['detected', 'triaged'].includes(drift.status);
            const canReject = ['detected', 'triaged'].includes(drift.status);

            logger.debug('Drift retrieved', { driftId });

            return {
                ...drift,
                alertCount,
                canApprove,
                canReject,
            };
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            logger.error('Failed to get drift', { driftId, error });
            throw error;
        }
    }

    /**
     * List drifts with filtering and pagination
     */
    async listDrifts(filters: {
        page: number;
        limit: number;
        severity?: string;
        status?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        search?: string;
        resourceType?: string;
        region?: string;
    }): Promise<{
        items: Drift[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasMore: boolean;
    }> {
        const startTime = Date.now();

        try {
            // Validate pagination
            if (filters.page < 1 || filters.limit < 1 || filters.limit > 100) {
                throw new ValidationError('Invalid pagination parameters');
            }

            // Build filter object for repository
            const repoFilters: DriftFilters = {
                page: filters.page,
                limit: filters.limit,
                severity: filters.severity as DriftFilters['severity'],
                status: filters.status as DriftFilters['status'],
                sortBy: filters.sortBy as DriftFilters['sortBy'],
                sortOrder: filters.sortOrder,
                search: filters.search,
                resourceType: filters.resourceType as DriftFilters['resourceType'],
                region: filters.region,
            };

            // Query database
            const result = await driftRepository.list(repoFilters);

            logger.debug('Drifts listed', {
                count: result.items.length,
                total: result.total,
                page: filters.page,
                duration: Date.now() - startTime,
            });

            return {
                items: result.items,
                total: result.total,
                page: filters.page,
                pageSize: filters.limit,
                totalPages: Math.ceil(result.total / filters.limit),
                hasMore: filters.page * filters.limit < result.total,
            };
        } catch (error) {
            logger.error('Failed to list drifts', {
                error: error instanceof Error ? error.message : String(error),
                filters,
                duration: Date.now() - startTime,
            });
            throw error;
        }
    }

    /**
     * Approve drift remediation
     *
     * @throws NotFoundError if drift doesn't exist
     * @throws ConflictError if drift can't be approved in current status
     */
    async approveDrift(
        driftId: string,
        input: { reason: string },
        userId?: string
    ): Promise<Drift> {
        const startTime = Date.now();

        try {
            // 1. Fetch drift
            const drift = await driftRepository.getById(driftId);

            if (!drift) {
                throw new NotFoundError(`Drift ${driftId} not found`);
            }

            // 2. Validate state transition
            if (!['detected', 'triaged'].includes(drift.status)) {
                throw new ConflictError(
                    `Cannot approve drift in '${drift.status}' status. Only 'detected' or 'triaged' drifts can be approved.`
                );
            }

            // 3. Update drift status
            const updated = await driftRepository.approve(driftId, input.reason, userId);

            // 4. Create audit log
            await auditService.log({
                action: 'drift_approved',
                driftId,
                actorId: userId,
                oldValue: { status: drift.status },
                newValue: { status: updated.status },
                details: { reason: input.reason },
            });

            // 5. Clear related alerts
            await alertService.markAlertsByDriftAsResolved(driftId);

            logger.info('Drift approved', {
                driftId,
                approvedBy: userId ?? 'system',
                reason: input.reason.substring(0, 50),
                duration: Date.now() - startTime,
            });

            // 6. Emit WebSocket event
            emitDriftApproved(updated, userId);

            return updated;
        } catch (error) {
            logger.error('Failed to approve drift', {
                driftId,
                error: error instanceof Error ? error.message : String(error),
                duration: Date.now() - startTime,
            });
            throw error;
        }
    }

    /**
     * Reject drift remediation
     *
     * @throws NotFoundError if drift doesn't exist
     * @throws ConflictError if drift can't be rejected in current status
     */
    async rejectDrift(
        driftId: string,
        reason: string,
        userId?: string
    ): Promise<Drift> {
        const startTime = Date.now();

        try {
            const drift = await driftRepository.getById(driftId);

            if (!drift) {
                throw new NotFoundError(`Drift ${driftId} not found`);
            }

            if (!['detected', 'triaged'].includes(drift.status)) {
                throw new ConflictError(
                    `Cannot reject drift in '${drift.status}' status.`
                );
            }

            const updated = await driftRepository.reject(driftId, reason, userId);

            await auditService.log({
                action: 'drift_rejected',
                driftId,
                actorId: userId,
                oldValue: { status: drift.status },
                newValue: { status: updated.status },
                details: { reason },
            });

            logger.info('Drift rejected', { driftId, duration: Date.now() - startTime });

            // Emit WebSocket event
            emitDriftRejected(updated, userId);

            return updated;
        } catch (error) {
            logger.error('Failed to reject drift', { driftId, error });
            throw error;
        }
    }

    /**
     * Get drift counts by status
     */
    async countByStatus(): Promise<Record<string, number>> {
        return driftRepository.countByStatus();
    }

    /**
     * Get drift counts by severity
     */
    async countBySeverity(): Promise<Record<string, number>> {
        return driftRepository.countBySeverity();
    }

    // ========= PRIVATE METHODS =========

    private validateDriftInput(input: CreateDriftInput): void {
        // Business rule validation (beyond schema)
        const expectedStr = JSON.stringify(input.expectedState);
        const actualStr = JSON.stringify(input.actualState);

        if (expectedStr === actualStr) {
            throw new ValidationError(
                'No difference between expected and actual state. This is not a drift.'
            );
        }

        if (input.costImpactMonthly < 0) {
            throw new ValidationError('Cost impact cannot be negative');
        }

        // Validate resource type
        const validTypes = ['EC2', 'RDS', 'S3', 'IAM_ROLE', 'SECURITY_GROUP'];
        if (!validTypes.includes(input.resourceType)) {
            throw new ValidationError(
                `Unsupported resource type: ${input.resourceType}. Allowed: ${validTypes.join(', ')}`
            );
        }
    }
}

// Export singleton
export const driftService = new DriftService();
