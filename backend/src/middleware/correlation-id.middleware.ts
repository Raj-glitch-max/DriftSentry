/**
 * Correlation ID Middleware
 * Adds unique trace IDs to all requests for distributed tracing
 */

import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extend Express Request to include correlationId
 */
declare global {
    namespace Express {
        interface Request {
            correlationId?: string;
        }
    }
}

/**
 * Add correlation ID to request for distributed tracing
 * Every log entry includes this ID for request tracking
 */
export function correlationIdMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Use header if provided (from upstream service), or generate new
    const correlationId =
        (req.headers['x-correlation-id'] as string) ||
        (req.headers['x-request-id'] as string) ||
        `trace_${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Attach to request
    req.correlationId = correlationId;

    // Add to response header
    res.setHeader('X-Correlation-ID', correlationId);

    next();
}
