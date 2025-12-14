/**
 * Request/Response Logging Middleware
 * Logs all incoming requests and outgoing responses
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Logging middleware
 * Logs request start and response completion with timing
 */
export function loggingMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const startTime = Date.now();
    const requestId = (req.headers['x-request-id'] as string) ?? `req_${Date.now()}`;

    // Log request start
    logger.debug('Request started', {
        requestId,
        method: req.method,
        path: req.path,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        userAgent: req.headers['user-agent'],
        ip: req.ip ?? req.socket.remoteAddress,
    });

    // Capture response
    const originalSend = res.send;
    res.send = function (body): Response {
        const duration = Date.now() - startTime;

        // Log response
        logger.info('Request completed', {
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
        });

        return originalSend.call(this, body);
    };

    next();
}

/**
 * Create request-scoped logger context
 */
export function getRequestContext(req: Request): Record<string, unknown> {
    return {
        requestId: req.headers['x-request-id'] ?? `req_${Date.now()}`,
        method: req.method,
        path: req.path,
    };
}
