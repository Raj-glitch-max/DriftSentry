/**
 * Audit Log Repository
 * Data access layer for AuditLog entity (immutable)
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';
import { BaseRepository } from './base.repository';
import type {
    AuditLog,
    CreateAuditLogInput,
    AuditLogFilters,
    AuditAction,
} from '../types/domain/audit';
import type { PaginatedResult } from '../types/api/responses';
import { DatabaseError, ValidationError } from '../utils/errors';

/**
 * AuditLogRepository
 * All database access for AuditLog entity
 * Note: AuditLogs are immutable - no update or delete operations
 */
export class AuditLogRepository extends BaseRepository<AuditLog, AuditLogFilters, AuditLog> {
    constructor() {
        super('AuditLog');
    }

    /**
     * Create new audit log entry
     */
    async create(input: CreateAuditLogInput): Promise<AuditLog> {
        try {
            const result = await prisma.auditLog.create({
                data: {
                    driftId: input.driftId,
                    action: input.action,
                    actorId: input.actorId,
                    actorEmail: input.actorEmail,
                    oldValue: input.oldValue as Prisma.InputJsonValue | undefined,
                    newValue: input.newValue as Prisma.InputJsonValue | undefined,
                    details: input.details as Prisma.InputJsonValue | undefined,
                    ipAddress: input.ipAddress,
                    userAgent: input.userAgent,
                },
            });

            this.logSuccess('create', { auditLogId: result.id, action: input.action });
            return this.toDomain(result);
        } catch (error) {
            this.logError('create', error, { input });
            throw new DatabaseError(`Failed to create audit log: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Log an action (convenience method)
     */
    async log(input: CreateAuditLogInput): Promise<AuditLog> {
        return this.create(input);
    }

    /**
     * Get audit log by ID
     */
    async getById(id: string): Promise<AuditLog | null> {
        try {
            const result = await prisma.auditLog.findUnique({
                where: { id },
            });

            if (result) {
                this.logSuccess('getById', { auditLogId: id });
            }
            return result ? this.toDomain(result) : null;
        } catch (error) {
            this.logError('getById', error, { auditLogId: id });
            throw new DatabaseError(`Failed to get audit log: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * List audit logs with filters and pagination
     */
    async list(filters: AuditLogFilters): Promise<PaginatedResult<AuditLog>> {
        try {
            if (!this.validatePagination(filters.page, filters.limit)) {
                throw new ValidationError('Invalid pagination parameters');
            }

            const where: Prisma.AuditLogWhereInput = {};

            if (filters.driftId) {
                where.driftId = filters.driftId;
            }
            if (filters.actorId) {
                where.actorId = filters.actorId;
            }
            if (filters.action && filters.action !== 'all') {
                where.action = filters.action;
            }

            const total = await prisma.auditLog.count({ where });

            const results = await prisma.auditLog.findMany({
                where,
                skip: this.calculateOffset(filters.page, filters.limit),
                take: filters.limit,
                orderBy: { createdAt: 'desc' },
            });

            this.logSuccess('list', { count: results.length, total });

            return {
                items: results.map((r) => this.toDomain(r)),
                total,
            };
        } catch (error) {
            if (error instanceof ValidationError) throw error;
            this.logError('list', error, { filters });
            throw new DatabaseError(`Failed to list audit logs: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get audit trail for a drift
     */
    async getByDriftId(driftId: string, limit: number = 50): Promise<AuditLog[]> {
        try {
            const results = await prisma.auditLog.findMany({
                where: { driftId },
                orderBy: { createdAt: 'desc' },
                take: limit,
            });

            this.logSuccess('getByDriftId', { driftId, count: results.length });
            return results.map((r) => this.toDomain(r));
        } catch (error) {
            this.logError('getByDriftId', error, { driftId });
            throw new DatabaseError(`Failed to get audit trail: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Delete is not supported for audit logs (immutable)
     * @throws Error always
     */
    async delete(_id: string): Promise<boolean> {
        throw new Error('AuditLogs are immutable and cannot be deleted');
    }

    // ========= PRIVATE METHODS =========

    /**
     * Transform Prisma model to domain type
     */
    private toDomain(raw: Record<string, unknown>): AuditLog {
        return {
            id: raw['id'] as string,
            driftId: (raw['driftId'] as string) ?? undefined,
            action: raw['action'] as AuditAction,
            actorId: (raw['actorId'] as string) ?? undefined,
            actorEmail: (raw['actorEmail'] as string) ?? undefined,
            oldValue: (raw['oldValue'] as Record<string, unknown>) ?? undefined,
            newValue: (raw['newValue'] as Record<string, unknown>) ?? undefined,
            details: (raw['details'] as Record<string, unknown>) ?? undefined,
            ipAddress: (raw['ipAddress'] as string) ?? undefined,
            userAgent: (raw['userAgent'] as string) ?? undefined,
            createdAt: raw['createdAt'] as Date,
        };
    }
}

// Export singleton
export const auditLogRepository = new AuditLogRepository();
