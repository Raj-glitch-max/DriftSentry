/**
 * Health Check Routes
 * Liveness, readiness, and detailed health probes
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';

export const healthRouter = Router();

/**
 * GET /health/live
 * Liveness probe - is the process running?
 * 
 * Used by: Kubernetes, Docker, load balancers
 * Always returns 200 if process is alive
 */
healthRouter.get('/live', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
    });
});

/**
 * GET /health/ready
 * Readiness probe - can the app handle requests?
 * 
 * Checks database connectivity
 * Returns 200 if ready, 503 if not
 */
healthRouter.get('/ready', async (_req: Request, res: Response) => {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            status: 'ready',
            checks: {
                database: 'ok',
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('Health check failed', {
            error: error instanceof Error ? error.message : String(error),
        });

        res.status(503).json({
            status: 'not_ready',
            checks: {
                database: 'error',
            },
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        });
    }
});

/**
 * GET /health/detailed
 * Detailed health check with system info
 * 
 * Returns memory usage, uptime, and query duration
 */
healthRouter.get('/detailed', async (_req: Request, res: Response) => {
    try {
        const startTime = process.hrtime.bigint();

        // Check database
        await prisma.$queryRaw`SELECT 1`;

        const endTime = process.hrtime.bigint();
        const queryDurationMs = Number(endTime - startTime) / 1_000_000;

        // Memory usage
        const memUsage = process.memoryUsage();

        // Uptime
        const uptime = process.uptime();

        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: Math.round(uptime),
            version: process.env['npm_package_version'] ?? '1.0.0',
            checks: {
                database: {
                    status: 'ok',
                    queryDurationMs: Math.round(queryDurationMs * 100) / 100,
                },
            },
            memory: {
                heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
                externalMB: Math.round(memUsage.external / 1024 / 1024),
                rssMB: Math.round(memUsage.rss / 1024 / 1024),
            },
            environment: process.env['NODE_ENV'] ?? 'development',
        });
    } catch (error) {
        logger.error('Detailed health check failed', {
            error: error instanceof Error ? error.message : String(error),
        });

        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default healthRouter;
