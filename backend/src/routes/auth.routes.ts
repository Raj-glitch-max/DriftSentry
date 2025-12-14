/**
 * Auth Routes
 * Authentication endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { validateRequest } from '../schemas/common.schema';
import { loginSchema, refreshSchema, logoutSchema } from '../schemas/auth.schema';
import { asyncHandler } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { authLimiter } from '../middleware/rateLimiter.middleware'; // Added import for authLimiter

export const authRouter = Router();

// Apply strict rate limiting to all auth routes (5 req/min)
authRouter.use(authLimiter); // Added authLimiter middleware

/**
 * POST /api/v1/auth/login
 * User login with email and password
 *
 * Request Body:
 * {
 *   email: string (valid email),
 *   password: string (min 8 chars)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     accessToken: string (JWT, expires 15m),
 *     refreshToken: string (expires 7d),
 *     user: { id, email, name, role }
 *   }
 * }
 */
authRouter.post(
    '/login',
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const startTime = Date.now();

        // Validate input
        const input = validateRequest(loginSchema, req.body);

        // Get request context
        const ipAddress = req.ip ?? req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        // Call service
        const result = await authService.login({
            email: input.email,
            password: input.password,
            ipAddress: ipAddress as string,
            userAgent: userAgent as string,
        });

        logger.info('POST /api/v1/auth/login', {
            email: input.email,
            role: result.user.role,
            duration: Date.now() - startTime,
        });

        res.status(200).json({
            success: true,
            data: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                user: result.user,
            },
        });
    })
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 *
 * Request Body:
 * {
 *   refreshToken: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     accessToken: string (new JWT)
 *   }
 * }
 */
authRouter.post(
    '/refresh',
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        // Validate input
        const input = validateRequest(refreshSchema, req.body);

        // Call service
        const result = await authService.refresh(input);

        res.status(200).json({
            success: true,
            data: {
                accessToken: result.accessToken,
            },
        });
    })
);

/**
 * POST /api/v1/auth/logout
 * Logout user (revoke refresh token)
 *
 * Request Body:
 * {
 *   refreshToken: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: null
 * }
 */
authRouter.post(
    '/logout',
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        // Validate input
        const input = validateRequest(logoutSchema, req.body);

        // Call service
        await authService.logout(input.refreshToken);

        res.status(200).json({
            success: true,
            data: null,
        });
    })
);

export default authRouter;
