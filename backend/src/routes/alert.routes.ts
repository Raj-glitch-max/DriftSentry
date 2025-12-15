/**
 * Alert Routes
 * All endpoints for managing alerts
 */

import { Router, Request, Response, NextFunction } from 'express';
import { alertService } from '../services/alert.service';
import { listAlertsSchema, validateRequest } from '../schemas';
import { asyncHandler } from '../middleware/error.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

export const alertRouter = Router();

/**
 * GET /api/v1/alerts
 * List all alerts with filtering and pagination
 *
 * Query Parameters:
 * - page: number (default 1)
 * - limit: number (default 20, max 100)
 * - driftId: UUID (optional)
 * - isRead: boolean (optional)
 * - severity: critical|warning|info|all (default all)
 * - type: drift_detected|approval_needed|remediation_failed|all (default all)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     items: Alert[],
 *     pagination: { total, page, pageSize, totalPages, hasMore }
 *   }
 * }
 */
alertRouter.get(
    '/',
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const startTime = Date.now();

        // Validate query parameters
        const filters = validateRequest(listAlertsSchema, req.query);

        // Get alerts
        const result = await alertService.listAlerts({
            page: filters.page,
            limit: filters.limit,
            driftId: filters.driftId,
            isRead: filters.isRead as boolean | undefined,
            severity: filters.severity,
            type: filters.type,
        });

        logger.debug('GET /api/v1/alerts', {
            count: result.items.length,
            duration: Date.now() - startTime,
        });

        res.status(200).json({
            success: true,
            data: {
                items: result.items,
                pagination: {
                    total: result.total,
                    page: result.page,
                    pageSize: result.pageSize,
                    totalPages: result.totalPages,
                    hasMore: result.hasMore,
                },
            },
        });
    })
);

/**
 * GET /api/v1/alerts/unread-count
 * Get count of unread alerts
 *
 * Response:
 * {
 *   success: true,
 *   data: { count: number }
 * }
 */
alertRouter.get(
    '/unread-count',
    asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
        const count = await alertService.getUnreadCount();

        res.status(200).json({
            success: true,
            data: { count },
        });
    })
);

/**
 * POST /api/v1/alerts/:id/mark-read
 * Mark alert as read
 *
 * Path Parameters:
 * - id: UUID
 *
 * Response:
 * {
 *   success: true,
 *   data: Alert
 * }
 */
alertRouter.post(
    '/:id/mark-read',
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const { id } = req.params;
        // In Phase 3, this comes from auth middleware
        const userId = (req as Request & { user?: { id: string } }).user?.id ?? 'system';

        const alert = await alertService.markAsRead(id as string, userId);

        res.status(200).json({
            success: true,
            data: alert,
        });
    })
);

/**
 * POST /api/v1/alerts/mark-all-read
 * Mark all unread alerts as read
 * Protected - requires authentication
 *
 * Response:
 * {
 *   success: true,
 *   data: { markedCount: number }
 * }
 */
alertRouter.post(
    '/mark-all-read',
    authMiddleware,
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const userId = (req as Request & { user?: { id: string } }).user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required' },
            });
            return;
        }

        const markedCount = await alertService.markAllAlertsAsRead(userId);

        logger.info('All alerts marked as read', { userId, count: markedCount });

        res.status(200).json({
            success: true,
            data: { markedCount },
        });
    })
);

export default alertRouter;

