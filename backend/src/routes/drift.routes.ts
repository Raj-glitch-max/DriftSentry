/**
 * Drift Routes
 * All endpoints for managing drifts
 */

import { Router, Request, Response, NextFunction } from 'express';
import { driftService } from '../services/drift.service';
import {
    listDriftsSchema,
    approveDriftSchema,
    rejectDriftSchema,
    validateRequest,
} from '../schemas';
import { asyncHandler } from '../middleware/error.middleware';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

export const driftRouter = Router();

/**
 * GET /api/v1/drifts
 * List all drifts with filtering and pagination
 * Public - no auth required
 */
driftRouter.get(
    '/',
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const startTime = Date.now();

        const filters = validateRequest(listDriftsSchema, req.query);

        const result = await driftService.listDrifts({
            page: filters.page,
            limit: filters.limit,
            severity: filters.severity,
            status: filters.status,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            search: filters.search,
            resourceType: filters.resourceType,
            region: filters.region,
        });

        logger.debug('GET /api/v1/drifts', {
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
 * GET /api/v1/drifts/:id
 * Get single drift with related data
 * Public - no auth required
 */
driftRouter.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const { id } = req.params;

        const drift = await driftService.getDrift(id as string);

        res.status(200).json({
            success: true,
            data: drift,
        });
    })
);

/**
 * POST /api/v1/drifts/:id/approve
 * Approve drift remediation
 * Protected - requires auth + admin or engineer role
 */
driftRouter.post(
    '/:id/approve',
    authMiddleware,
    requireRole('admin', 'engineer'),
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const { id } = req.params;
        const userId = req.user?.id;

        const input = validateRequest(approveDriftSchema, req.body);

        const drift = await driftService.approveDrift(id as string, input, userId);

        res.status(200).json({
            success: true,
            data: drift,
        });
    })
);

/**
 * POST /api/v1/drifts/:id/reject
 * Reject drift remediation
 * Protected - requires auth + admin or engineer role
 */
driftRouter.post(
    '/:id/reject',
    authMiddleware,
    requireRole('admin', 'engineer'),
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const { id } = req.params;
        const userId = req.user?.id;

        const input = validateRequest(rejectDriftSchema, req.body);

        const drift = await driftService.rejectDrift(id as string, input.reason, userId);

        res.status(200).json({
            success: true,
            data: drift,
        });
    })
);

export default driftRouter;
