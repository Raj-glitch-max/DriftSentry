/**
 * Custom Error Classes for DriftSentry Backend
 * All errors extend BaseError for consistent handling
 */

/**
 * Base error class with status code support
 */
export class BaseError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: Record<string, unknown>;
    public readonly timestamp: string;

    constructor(
        message: string,
        statusCode: number,
        code: string,
        details?: Record<string, unknown>
    ) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();

        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Convert error to API response format
     */
    toJSON(): Record<string, unknown> {
        return {
            success: false,
            error: {
                code: this.code,
                message: this.message,
                details: this.details,
                timestamp: this.timestamp,
            },
        };
    }
}

/**
 * Validation error for invalid input data
 * HTTP 400 Bad Request
 */
export class ValidationError extends BaseError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

/**
 * Authentication error for invalid/missing credentials
 * HTTP 401 Unauthorized
 */
export class AuthenticationError extends BaseError {
    constructor(message: string = 'Authentication required', details?: Record<string, unknown>) {
        super(message, 401, 'AUTH_ERROR', details);
    }
}

/**
 * Authorization error for insufficient permissions
 * HTTP 403 Forbidden
 */
export class AuthorizationError extends BaseError {
    constructor(message: string = 'Insufficient permissions', details?: Record<string, unknown>) {
        super(message, 403, 'FORBIDDEN', details);
    }
}

/**
 * Not found error for missing resources
 * HTTP 404 Not Found
 */
export class NotFoundError extends BaseError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 404, 'NOT_FOUND', details);
    }
}

/**
 * Conflict error for duplicate resources or invalid state transitions
 * HTTP 409 Conflict
 */
export class ConflictError extends BaseError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 409, 'CONFLICT', details);
    }
}

/**
 * Database error for database operation failures
 * HTTP 500 Internal Server Error
 */
export class DatabaseError extends BaseError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 500, 'DATABASE_ERROR', details);
    }
}

/**
 * Rate limit error for too many requests
 * HTTP 429 Too Many Requests
 */
export class RateLimitError extends BaseError {
    constructor(message: string = 'Too many requests', details?: Record<string, unknown>) {
        super(message, 429, 'RATE_LIMIT', details);
    }
}

/**
 * Internal server error for unexpected failures
 * HTTP 500 Internal Server Error
 */
export class InternalError extends BaseError {
    constructor(message: string = 'Internal server error', details?: Record<string, unknown>) {
        super(message, 500, 'SERVER_ERROR', details);
    }
}

/**
 * Type guard to check if error is a BaseError
 */
export function isBaseError(error: unknown): error is BaseError {
    return error instanceof BaseError;
}

/**
 * Convert unknown error to BaseError
 */
export function toBaseError(error: unknown): BaseError {
    if (isBaseError(error)) {
        return error;
    }

    if (error instanceof Error) {
        return new InternalError(error.message);
    }

    return new InternalError(String(error));
}

/**
 * Convenient alias for AuthenticationError
 */
export const AuthError = AuthenticationError;

