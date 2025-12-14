/**
 * Alert Repository
 * Data access layer for Alert entity
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';
import { BaseRepository } from './base.repository';
import type {
    Alert,
    CreateAlertInput,
    AlertFilters,
    AlertType,
} from '../types/domain/alert';
import type { Severity } from '../types/domain/drift';
import type { PaginatedResult } from '../types/api/responses';
import { DatabaseError, NotFoundError, ValidationError } from '../utils/errors';

/**
 * AlertRepository
 * All database access for Alert entity
 */
export class AlertRepository extends BaseRepository<Alert, AlertFilters, Alert> {
    constructor() {
        super('Alert');
    }

    /**
     * Create new alert
     */
    async create(input: CreateAlertInput): Promise<Alert> {
        try {
            const result = await prisma.alert.create({
                data: {
                    driftId: input.driftId,
                    type: input.type,
                    severity: input.severity,
                    title: input.title,
                    message: input.message,
                },
            });

            this.logSuccess('create', { alertId: result.id, driftId: input.driftId });
            return this.toDomain(result);
        } catch (error) {
            this.logError('create', error, { input });
            throw new DatabaseError(`Failed to create alert: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get alert by ID
     */
    async getById(id: string): Promise<Alert | null> {
        try {
            const result = await prisma.alert.findUnique({
                where: { id },
            });

            if (result) {
                this.logSuccess('getById', { alertId: id });
            }
            return result ? this.toDomain(result) : null;
        } catch (error) {
            this.logError('getById', error, { alertId: id });
            throw new DatabaseError(`Failed to get alert: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * List alerts with filters and pagination
     */
    async list(filters: AlertFilters): Promise<PaginatedResult<Alert>> {
        try {
            if (!this.validatePagination(filters.page, filters.limit)) {
                throw new ValidationError('Invalid pagination parameters');
            }

            const where: Prisma.AlertWhereInput = {};

            if (filters.driftId) {
                where.driftId = filters.driftId;
            }
            if (filters.isRead !== undefined) {
                where.isRead = filters.isRead;
            }
            if (filters.severity && filters.severity !== 'all') {
                where.severity = filters.severity;
            }
            if (filters.type && filters.type !== 'all') {
                where.type = filters.type;
            }

            const total = await prisma.alert.count({ where });

            const results = await prisma.alert.findMany({
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
            throw new DatabaseError(`Failed to list alerts: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get unread alert count
     */
    async getUnreadCount(): Promise<number> {
        try {
            const count = await prisma.alert.count({
                where: { isRead: false },
            });

            this.logSuccess('getUnreadCount', { count });
            return count;
        } catch (error) {
            this.logError('getUnreadCount', error);
            throw new DatabaseError(`Failed to get unread count: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Mark alert as read
     */
    async markAsRead(id: string, userId: string): Promise<Alert> {
        try {
            const result = await prisma.alert.update({
                where: { id },
                data: {
                    isRead: true,
                    readAt: new Date(),
                    readBy: userId,
                },
            });

            this.logSuccess('markAsRead', { alertId: id, userId });
            return this.toDomain(result);
        } catch (error) {
            if (String(error).includes('Record to update not found')) {
                throw new NotFoundError(`Alert ${id} not found`);
            }
            this.logError('markAsRead', error, { alertId: id, userId });
            throw new DatabaseError(`Failed to mark as read: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Mark all alerts for a drift as read
     */
    async markAllByDriftAsRead(driftId: string, userId: string): Promise<number> {
        try {
            const result = await prisma.alert.updateMany({
                where: { driftId, isRead: false },
                data: {
                    isRead: true,
                    readAt: new Date(),
                    readBy: userId,
                },
            });

            this.logSuccess('markAllByDriftAsRead', { driftId, count: result.count });
            return result.count;
        } catch (error) {
            this.logError('markAllByDriftAsRead', error, { driftId, userId });
            throw new DatabaseError(`Failed to mark alerts as read: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Delete alert by ID
     */
    async delete(id: string): Promise<boolean> {
        try {
            await prisma.alert.delete({
                where: { id },
            });

            this.logSuccess('delete', { alertId: id });
            return true;
        } catch (error) {
            if (String(error).includes('Record to delete does not exist')) {
                return false;
            }
            this.logError('delete', error, { alertId: id });
            throw new DatabaseError(`Failed to delete alert: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // ========= PRIVATE METHODS =========

    /**
     * Transform Prisma model to domain type
     */
    private toDomain(raw: Record<string, unknown>): Alert {
        return {
            id: raw['id'] as string,
            driftId: raw['driftId'] as string,
            type: raw['type'] as AlertType,
            severity: raw['severity'] as Severity,
            title: raw['title'] as string,
            message: raw['message'] as string,
            isRead: raw['isRead'] as boolean,
            readAt: (raw['readAt'] as Date) ?? undefined,
            readBy: (raw['readBy'] as string) ?? undefined,
            createdAt: raw['createdAt'] as Date,
            updatedAt: raw['updatedAt'] as Date,
        };
    }
}

// Export singleton
export const alertRepository = new AlertRepository();
