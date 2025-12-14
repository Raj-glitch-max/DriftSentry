/**
 * API Error Response Types
 * Standard error envelope for all API errors
 */

/**
 * Error codes for API responses
 */
export type ErrorCode =
    | 'VALIDATION_ERROR'
    | 'AUTH_ERROR'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'RATE_LIMIT'
    | 'DATABASE_ERROR'
    | 'SERVER_ERROR';

/**
 * Error response structure
 */
export interface ErrorResponse {
    success: false;
    error: {
        code: ErrorCode;
        message: string;
        details?: Record<string, unknown>;
        timestamp: string;
        traceId?: string;
    };
}

/**
 * Create error response object
 */
export function createErrorResponse(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
    traceId?: string
): ErrorResponse {
    return {
        success: false,
        error: {
            code,
            message,
            details,
            timestamp: new Date().toISOString(),
            traceId,
        },
    };
}
