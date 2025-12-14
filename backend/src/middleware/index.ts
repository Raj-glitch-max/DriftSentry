/**
 * Middleware Barrel Export
 */

export { errorMiddleware, asyncHandler } from './error.middleware';
export { loggingMiddleware, getRequestContext } from './logging.middleware';
export {
    authMiddleware,
    requireRole,
    optionalAuthMiddleware,
    type AuthenticatedUser,
} from './auth.middleware';
export { metricsMiddleware, metricsEndpoint } from './metrics.middleware';
export { correlationIdMiddleware } from './correlation-id.middleware';
