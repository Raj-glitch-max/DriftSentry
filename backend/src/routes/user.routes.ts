/**
 * User Routes
 * Endpoints for user profile and settings management
 */

import { Router, Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { apiKeyLimiter } from '../middleware/rateLimiter.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { validateRequest } from '../schemas';

export const userRouter = Router();

// ============================================
// SCHEMAS
// ============================================

const updateSettingsSchema = z.object({
    emailNotifications: z.boolean().optional(),
    slackIntegration: z.boolean().optional(),
    criticalAlertsOnly: z.boolean().optional(),
});

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/v1/users/me
 * Get current user profile
 * Protected - requires authentication
  */
userRouter.get(
    '/me',
    authMiddleware,
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const userId = (req as Request & { user?: { id: string } }).user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required' },
            });
            return;
        }

        const user = await userService.getById(userId);

        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found' },
            });
            return;
        }

        // Check if soft-deleted
        if (user.deletedAt) {
            res.status(401).json({
                success: false,
                error: { message: 'Account has been deleted' },
            });
            return;
        }

        // Return user without password hash
        const { passwordHash, ...userPublic } = user;

        res.status(200).json({
            success: true,
            data: userPublic,
        });
    })
);

/**
 * PUT /api/v1/users/me/settings
 * Update user settings
 * Protected - requires authentication
 */
userRouter.put(
    '/me/settings',
    authMiddleware,
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const userId = (req as Request & { user?: { id: string } }).user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required' },
            });
            return;
        }

        const input = validateRequest(updateSettingsSchema, req.body);

        const updatedUser = await userService.updateSettings(userId, input);

        logger.info('User settings updated', { userId });

        res.status(200).json({
            success: true,
            data: { settings: updatedUser.settings },
        });
    })
);

/**
 * POST /api/v1/users/me/api-key/regenerate
 * Regenerate API key
 * Protected - requires authentication
 * Rate limited - 10 requests per hour
 * 
 * IMPORTANT: Returns full key ONCE. User must save it immediately.
 */
userRouter.post(
    '/me/api-key/regenerate',
    authMiddleware,
    apiKeyLimiter, // Strict rate limit: 10/hour
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const userId = (req as Request & { user?: { id: string } }).user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required' },
            });
            return;
        }

        const result = await userService.regenerateApiKey(userId);

        logger.info('API key regenerated', { userId, last4: result.last4 });

        res.status(200).json({
            success: true,
            data: {
                apiKey: result.apiKey, // FULL KEY - shown once
                last4: result.last4,
                createdAt: result.createdAt.toISOString(),
                message: 'Save this key now. You won\'t see it again.',
            },
        });
    })
);

/**
 * DELETE /api/v1/users/me
 * Soft delete user account
 * Protected - requires authentication
 */
userRouter.delete(
    '/me',
    authMiddleware,
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const userId = (req as Request & { user?: { id: string } }).user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required' },
            });
            return;
        }

        await userService.deleteAccount(userId);

        logger.info('User account deleted', { userId });

        res.status(200).json({
            success: true,
            data: { message: 'Account deleted successfully' },
        });
    })
);

export default userRouter;
