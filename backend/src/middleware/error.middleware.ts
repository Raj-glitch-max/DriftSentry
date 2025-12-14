/**
 * Error Handling Middleware
 * Global error handler - MUST be registered LAST in middleware stack
 */

import type { Request, Response, NextFunction } from 'express';
import { BaseError, isBaseError, toBaseError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Global error handling middleware
 * Converts all errors to standard error response:
 * {
 *   success: false,
 *   error: {
 *     code: string,
 *     message: string,
 *     details?: object,
 *     traceId: string,
 *     timestamp: string
 *   }
 * }
 */
export function errorMiddleware(
    error: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
): void {
    // Generate trace ID for debugging
    const traceId = (req.headers['x-trace-id'] as string) ?? `trace_${Date.now()}`;

    // Convert to BaseError if needed
    const baseError: BaseError = isBaseError(error) ? error : toBaseError(error);
    const statusCode = baseError.statusCode;

    // Log based on severity
    if (statusCode >= 500) {
        logger.error('Server error', {
            code: baseError.code,
            message: baseError.message,
            statusCode,
            traceId,
            path: req.path,
            method: req.method,
            stack: error.stack,
        });
    } else {
        logger.warn('Client error', {
            code: baseError.code,
            message: baseError.message,
            statusCode,
            traceId,
            path: req.path,
            method: req.method,
        });
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: {
            code: baseError.code,
            message: baseError.message,
            details: baseError.details,
            traceId,
            timestamp: baseError.timestamp,
        },
    });
}

/**
 * Async handler wrapper to catch async errors
 * Use this for all async route handlers
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
