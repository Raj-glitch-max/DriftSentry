/**
 * Metrics Routes
 * Dashboard metrics and cost trend endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metrics.service';
import { costTrendSchema, summarySchema, validateRequest } from '../schemas';
import { asyncHandler } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export const metricsRouter = Router();

/**
 * GET /api/v1/metrics/summary
 * Get dashboard summary metrics
 *
 * Query Parameters:
 * - days: number (default 30, max 365)
 *
 * Response:
 * {
 *   success: true,
 *   data: DashboardSummary
 * }
 */
metricsRouter.get(
    '/summary',
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const startTime = Date.now();

        const { days } = validateRequest(summarySchema, req.query);

        const summary = await metricsService.getSummary(days);

        logger.debug('GET /api/v1/metrics/summary', {
            days,
            duration: Date.now() - startTime,
        });

        res.status(200).json({
            success: true,
            data: summary,
        });
    })
);

/**
 * GET /api/v1/metrics/cost-trend
 * Get cost trend data for charts
 *
 * Query Parameters:
 * - days: number (default 30, max 365)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     trend: CostTrendPoint[],
 *     summary: CostSummary
 *   }
 * }
 */
metricsRouter.get(
    '/cost-trend',
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const startTime = Date.now();

        const { days } = validateRequest(costTrendSchema, req.query);

        const result = await metricsService.getCostTrend(days);

        logger.debug('GET /api/v1/metrics/cost-trend', {
            days,
            dataPoints: result.trend.length,
            duration: Date.now() - startTime,
        });

        res.status(200).json({
            success: true,
            data: result,
        });
    })
);

/**
 * GET /api/v1/metrics/severity-distribution
 * Get severity distribution for charts
 *
 * Response:
 * {
 *   success: true,
 *   data: { data: Array, total: number }
 * }
 */
metricsRouter.get(
    '/severity-distribution',
    asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
        const result = await metricsService.getSeverityDistribution();

        res.status(200).json({
            success: true,
            data: result,
        });
    })
);

/**
 * GET /api/v1/metrics/status-distribution
 * Get status distribution for charts
 *
 * Response:
 * {
 *   success: true,
 *   data: { data: Array, total: number }
 * }
 */
metricsRouter.get(
    '/status-distribution',
    asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
        const result = await metricsService.getStatusDistribution();

        res.status(200).json({
            success: true,
            data: result,
        });
    })
);

export default metricsRouter;
