/**
 * Audit Service
 * Immutable audit trail logging
 */

import { auditLogRepository } from '../repositories/audit.repository';
import { logger } from '../utils/logger';
import type { AuditLog, CreateAuditLogInput, AuditAction } from '../types/domain/audit';

/**
 * AuditService
 * Handles immutable audit logging for all actions
 */
export class AuditService {
    /**
     * Log an action to the audit trail
     * Never throws - logging should not break main flow
     */
    async log(input: {
        action: AuditAction;
        driftId?: string;
        actorId?: string;
        actorEmail?: string;
        oldValue?: Record<string, unknown>;
        newValue?: Record<string, unknown>;
        details?: Record<string, unknown>;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<AuditLog | null> {
        try {
            const auditLog = await auditLogRepository.create({
                action: input.action,
                driftId: input.driftId,
                actorId: input.actorId,
                actorEmail: input.actorEmail,
                oldValue: input.oldValue,
                newValue: input.newValue,
                details: input.details,
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
            });

            logger.debug('Audit log created', {
                auditLogId: auditLog.id,
                action: input.action,
                driftId: input.driftId,
            });

            return auditLog;
        } catch (error) {
            // Don't throw - audit logging should not break main flow
            logger.error('Failed to create audit log', {
                error: error instanceof Error ? error.message : String(error),
                action: input.action,
                driftId: input.driftId,
            });
            return null;
        }
    }

    /**
     * Get audit trail for a drift
     */
    async getByDriftId(driftId: string, limit: number = 50): Promise<AuditLog[]> {
        return auditLogRepository.getByDriftId(driftId, limit);
    }
}

// Export singleton
export const auditService = new AuditService();
