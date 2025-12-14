/**
 * WebSocket Events
 * Event emission functions for real-time updates
 */

import { getIO, isIOInitialized } from './socket';
import type { Drift } from '../types/domain/drift';
import type { Alert } from '../types/domain/alert';
import { logger } from '../utils/logger';

/**
 * Emit drift:created event to relevant clients
 */
export function emitDriftCreated(drift: Drift): void {
    if (!isIOInitialized()) {
        logger.debug('WebSocket not initialized, skipping drift:created emit');
        return;
    }

    try {
        const io = getIO();

        const event = {
            id: drift.id,
            resourceId: drift.resourceId,
            resourceType: drift.resourceType,
            region: drift.region,
            severity: drift.severity,
            costImpactMonthly: drift.costImpactMonthly,
            detectedAt: drift.detectedAt,
            status: drift.status,
        };

        // Emit to all subscribers
        io.to('drifts').emit('drift:created', event);
        io.to('global').emit('drift:created', event);

        logger.debug('Emitted drift:created', { driftId: drift.id });
    } catch (error) {
        logger.error('Failed to emit drift:created', {
            error: error instanceof Error ? error.message : String(error),
        });
    }
}

/**
 * Emit drift:approved event
 */
export function emitDriftApproved(drift: Drift, approvedBy?: string): void {
    if (!isIOInitialized()) return;

    try {
        const io = getIO();

        io.to('drifts').emit('drift:approved', {
            id: drift.id,
            status: drift.status,
            approvedAt: drift.approvedAt,
            approvedBy: approvedBy ?? 'system',
        });

        logger.debug('Emitted drift:approved', { driftId: drift.id });
    } catch (error) {
        logger.error('Failed to emit drift:approved', { error });
    }
}

/**
 * Emit drift:rejected event
 */
export function emitDriftRejected(drift: Drift, rejectedBy?: string): void {
    if (!isIOInitialized()) return;

    try {
        const io = getIO();

        io.to('drifts').emit('drift:rejected', {
            id: drift.id,
            status: drift.status,
            rejectedAt: drift.rejectedAt,
            rejectedBy: rejectedBy ?? 'system',
        });

        logger.debug('Emitted drift:rejected', { driftId: drift.id });
    } catch (error) {
        logger.error('Failed to emit drift:rejected', { error });
    }
}

/**
 * Emit alert:created event
 */
export function emitAlertCreated(alert: Alert): void {
    if (!isIOInitialized()) return;

    try {
        const io = getIO();

        io.to('alerts').emit('alert:created', {
            id: alert.id,
            driftId: alert.driftId,
            type: alert.type,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            createdAt: alert.createdAt,
        });

        logger.debug('Emitted alert:created', { alertId: alert.id });
    } catch (error) {
        logger.error('Failed to emit alert:created', { error });
    }
}

/**
 * Emit alert:read event
 */
export function emitAlertRead(alertId: string): void {
    if (!isIOInitialized()) return;

    try {
        const io = getIO();

        io.to('alerts').emit('alert:read', { id: alertId });

        logger.debug('Emitted alert:read', { alertId });
    } catch (error) {
        logger.error('Failed to emit alert:read', { error });
    }
}
