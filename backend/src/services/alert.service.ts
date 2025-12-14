/**
 * Alert Service
 * Business logic for alert management
 */

import { alertRepository } from '../repositories/alert.repository';
import { logger } from '../utils/logger';
import type { Alert, CreateAlertInput, AlertFilters } from '../types/domain/alert';
import type { PaginatedResult } from '../types/api/responses';
import { NotFoundError } from '../utils/errors';

/**
 * AlertService
 * Handles alert creation, listing, and status updates
 */
export class AlertService {
    /**
     * Create new alert
     */
    async createAlert(input: CreateAlertInput): Promise<Alert> {
        const startTime = Date.now();

        try {
            const alert = await alertRepository.create(input);

            logger.info('Alert created', {
                alertId: alert.id,
                driftId: input.driftId,
                severity: input.severity,
                duration: Date.now() - startTime,
            });

            return alert;
        } catch (error) {
            logger.error('Failed to create alert', {
                error: error instanceof Error ? error.message : String(error),
                driftId: input.driftId,
            });
            throw error;
        }
    }

    /**
     * List alerts with filtering and pagination
     */
    async listAlerts(filters: AlertFilters): Promise<{
        items: Alert[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasMore: boolean;
    }> {
        const startTime = Date.now();

        try {
            const result = await alertRepository.list(filters);

            logger.debug('Alerts listed', {
                count: result.items.length,
                total: result.total,
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
            logger.error('Failed to list alerts', {
                error: error instanceof Error ? error.message : String(error),
                filters,
            });
            throw error;
        }
    }

    /**
     * Get alert by ID
     */
    async getAlert(alertId: string): Promise<Alert> {
        const alert = await alertRepository.getById(alertId);

        if (!alert) {
            throw new NotFoundError(`Alert ${alertId} not found`);
        }

        return alert;
    }

    /**
     * Mark alert as read
     */
    async markAsRead(alertId: string, userId: string): Promise<Alert> {
        const startTime = Date.now();

        try {
            const alert = await alertRepository.markAsRead(alertId, userId);

            logger.info('Alert marked as read', {
                alertId,
                userId,
                duration: Date.now() - startTime,
            });

            return alert;
        } catch (error) {
            logger.error('Failed to mark alert as read', {
                alertId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * Mark all alerts for a drift as resolved (read)
     */
    async markAlertsByDriftAsResolved(driftId: string): Promise<number> {
        try {
            // Mark as read with system user
            const count = await alertRepository.markAllByDriftAsRead(driftId, 'system');

            logger.debug('Alerts marked as resolved', { driftId, count });

            return count;
        } catch (error) {
            logger.warn('Failed to mark alerts as resolved', {
                driftId,
                error: error instanceof Error ? error.message : String(error),
            });
            // Don't throw - this is a side effect
            return 0;
        }
    }

    /**
     * Count alerts for a drift
     */
    async countByDrift(driftId: string): Promise<number> {
        const result = await alertRepository.list({
            driftId,
            page: 1,
            limit: 1,
        });
        return result.total;
    }

    /**
     * Get unread alert count
     */
    async getUnreadCount(): Promise<number> {
        return alertRepository.getUnreadCount();
    }
}

// Export singleton
export const alertService = new AlertService();
