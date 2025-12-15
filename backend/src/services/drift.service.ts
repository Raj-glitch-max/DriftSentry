/**
 * Drift Service
 * Core business logic for drift management
 */

import { driftRepository } from '../repositories/drift.repository';
import { alertRepository } from '../repositories/alert.repository';
import { alertService } from './alert.service';
import { auditService } from './audit.service';
import { auditLogRepository } from '../repositories/audit.repository';
import { emitDriftCreated, emitDriftApproved, emitDriftRejected } from '../websocket/events';
import { cacheService, CacheKeys } from './cache.service';
import { logger } from '../utils/logger';
import type {
    Drift,
    CreateDriftInput,
    DriftFilters,
    ApproveDriftInput,
    RejectDriftInput,
} from '../types/domain';
import type { PaginatedResult } from '../types/api/responses';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import type { DriftTimelineEntry, TimelineAction, ActorRole } from '../types/domain/timeline';

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

            // 6. Emit WebSocket event
            emitDriftCreated(drift);

            // 7. Invalidate related caches
            await Promise.all([
                cacheService.deletePattern('metrics:*'),
                cacheService.deletePattern('drifts:*'),
            ]);

            logger.info('Drift created', {
                driftId: drift.id,
                resourceId: input.resourceId,
                severity: input.severity,
                duration: Date.now() - startTime,
            });

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
     * Get drift timeline (audit history)
     * Transforms audit logs into user-friendly timeline entries
     *
     * @throws NotFoundError if drift doesn't exist
     */
    async getDriftTimeline(driftId: string): Promise<DriftTimelineEntry[]> {
        try {
            // Verify drift exists
            const drift = await driftRepository.getById(driftId);
            if (!drift) {
                throw new NotFoundError(`Drift ${driftId} not found`);
            }

            // Get audit logs with actor information
            const auditLogs = await auditLogRepository.getTimelineForDrift(driftId);

            // Transform to timeline entries
            const timeline = auditLogs.map((log) => {
                const actorEmail = log.actor?.email || log.actorEmail || null;
                const actorRole = (log.actor?.role || 'system') as ActorRole;
                const action = this.mapAuditActionToTimelineAction(log.action);
                const message = this.generateTimelineMessage(log, actorEmail);

                return {
                    id: log.id,
                    timestamp: log.createdAt.toISOString(),
                    actorEmail,
                    actorRole,
                    action,
                    message,
                    metadata: {
                        oldValue: log.oldValue,
                        newValue: log.newValue,
                        details: log.details,
                        ipAddress: log.ipAddress,
                    },
                } as DriftTimelineEntry;
            });

            logger.debug('Timeline retrieved', { driftId, entries: timeline.length });
            return timeline;
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            logger.error('Failed to get drift timeline', { driftId, error });
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

            // 6. Emit WebSocket event
            emitDriftApproved(updated, userId);

            // 7. Invalidate caches
            await Promise.all([
                cacheService.delete(CacheKeys.drifts.detail(driftId)),
                cacheService.deletePattern('metrics:*'),
                cacheService.deletePattern('drifts:list:*'),
            ]);

            logger.info('Drift approved', {
                driftId,
                approvedBy: userId ?? 'system',
                reason: input.reason.substring(0, 50),
                duration: Date.now() - startTime,
            });

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

    /**
     * Map audit action to timeline action type
     */
    private mapAuditActionToTimelineAction(auditAction: string): TimelineAction {
        const actionMap: Record<string, TimelineAction> = {
            'drift_created': 'created',
            'drift_approved': 'approved',
            'drift_rejected': 'rejected',
            'drift_resolved': 'resolved',
            'user_login': 'login',
        };
        return actionMap[auditAction] || 'other';
    }

    /**
     * Generate human-readable message from audit log
     */
    private generateTimelineMessage(log: any, actorEmail: string | null): string {
        const actor = actorEmail || 'System';

        switch (log.action) {
            case 'drift_created':
                return `Drift detected by ${log.details?.source || 'system scanner'}`;

            case 'drift_approved':
                return `Drift approved by ${actor}`;

            case 'drift_rejected':
                return `Drift rejected by ${actor}`;

            case 'drift_resolved':
                return `Drift resolved via ${log.newValue?.resolvedHow || 'manual fix'}`;

            case 'user_login':
                return `${actor} logged in`;

            default:
                // Generate message from state changes
                if (log.oldValue?.status && log.newValue?.status) {
                    return `State changed: ${log.oldValue.status} → ${log.newValue.status}`;
                }
                return `Action performed: ${log.action}`;
        }
    }

}

// Export singleton
export const driftService = new DriftService();
