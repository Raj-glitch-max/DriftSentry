/**
 * Metrics Middleware
 * Collect request metrics for Prometheus
 */

import type { Request, Response, NextFunction } from 'express';
import { PrometheusService } from '../services/prometheus.service';

/**
 * Metrics collection middleware
 * Records HTTP request count and duration
 */
export function metricsMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1_000_000;

        PrometheusService.recordRequest(
            req.method,
            req.path,
            res.statusCode,
            durationMs
        );

        // Record errors
        if (res.statusCode >= 400) {
            const code = res.statusCode >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR';
            PrometheusService.recordError(code, req.path);
        }
    });

    next();
}

/**
 * Metrics endpoint handler
 * GET /metrics - returns Prometheus format
 */
export async function metricsEndpoint(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const metrics = await PrometheusService.getMetrics();
        res.set('Content-Type', PrometheusService.getContentType());
        res.end(metrics);
    } catch (error) {
        res.status(500).end(
            error instanceof Error ? error.message : 'Failed to collect metrics'
        );
    }
}
