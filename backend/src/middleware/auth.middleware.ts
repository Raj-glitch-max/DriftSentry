/**
 * Auth Middleware
 * JWT verification and role-based access control
 */

import type { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';

/**
 * User attached to request by auth middleware
 */
export interface AuthenticatedUser {
    id: string;
    email: string;
    role: 'admin' | 'engineer' | 'viewer';
}

/**
 * Extend Express Request to include user
 */
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

/**
 * JWT verification middleware
 * Extracts token from Authorization header, verifies it, and attaches user to request
 *
 * Usage:
 * app.use('/api/v1/protected', authMiddleware, routes);
 */
export function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_ERROR',
                    message: 'Missing authorization token',
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        const payload = verifyToken(token);

        // Attach user to request
        req.user = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
        };

        logger.debug('Token verified', {
            userId: payload.userId,
            path: req.path,
        });

        next();
    } catch (error) {
        logger.warn('Authentication failed', {
            error: error instanceof Error ? error.message : String(error),
            path: req.path,
        });

        res.status(401).json({
            success: false,
            error: {
                code: 'AUTH_ERROR',
                message: 'Invalid or expired token',
                timestamp: new Date().toISOString(),
            },
        });
    }
}

/**
 * Role-based access control middleware
 *
 * Usage:
 * router.post('/approve', authMiddleware, requireRole('admin', 'engineer'), handler);
 */
export function requireRole(...allowedRoles: Array<'admin' | 'engineer' | 'viewer'>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = req.user;

        if (!user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_ERROR',
                    message: 'Not authenticated',
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        if (!allowedRoles.includes(user.role)) {
            logger.warn('Authorization failed', {
                userId: user.id,
                role: user.role,
                requiredRoles: allowedRoles,
                path: req.path,
            });

            res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Insufficient permissions for this action',
                    timestamp: new Date().toISOString(),
                },
            });
            return;
        }

        next();
    };
}

/**
 * Optional auth middleware
 * Sets user if token present, allows request to continue if not
 *
 * Usage:
 * app.use(optionalAuthMiddleware); // All routes can check req.user
 */
export function optionalAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);

        if (token) {
            const payload = verifyToken(token);
            req.user = {
                id: payload.userId,
                email: payload.email,
                role: payload.role,
            };
        }
    } catch (error) {
        // Ignore auth errors, allow unauthenticated access
        logger.debug('Optional auth skipped', {
            reason: error instanceof Error ? error.message : 'No token',
        });
    }

    next();
}
