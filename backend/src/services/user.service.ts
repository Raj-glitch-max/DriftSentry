/**
 * User Service
 * Business logic for user management
 */

import { userRepository } from '../repositories/user.repository';
import { auditService } from './audit.service';
import { logger } from '../utils/logger';
import type { User, UserSettings, UpdateUserSettingsInput } from '../types/domain';
import { NotFoundError, ValidationError } from '../utils/errors';
import * as crypto from 'crypto';

/**
 * UserService
 * Handles user profile, settings, API key management
 */
export class UserService {
    /**
     * Get user by ID
     */
    async getById(id: string): Promise<User | null> {
        return userRepository.getById(id);
    }

    /**
     * Update user settings
     */
    async updateSettings(userId: string, input: UpdateUserSettingsInput): Promise<User> {
        const startTime = Date.now();

        try {
            const user = await userRepository.getById(userId);
            if (!user) {
                throw new NotFoundError(`User ${userId} not found`);
            }

            // Merge with existing settings
            const currentSettings = (user.settings as UserSettings) || {
                emailNotifications: false,
                slackIntegration: false,
                criticalAlertsOnly: false,
            };

            const updatedSettings: UserSettings = {
                emailNotifications: input.emailNotifications ?? currentSettings.emailNotifications,
                slackIntegration: input.slackIntegration ?? currentSettings.slackIntegration,
                criticalAlertsOnly: input.criticalAlertsOnly ?? currentSettings.criticalAlertsOnly,
            };

            // Update user settings (this will be a custom repository method)
            const updatedUser = await userRepository.updateSettings(userId, updatedSettings);

            // Audit log
            await auditService.log({
                action: 'user_settings_updated',
                actorId: userId,
                actorEmail: user.email,
                oldValue: currentSettings as any,
                newValue: updatedSettings as any,
            });

            logger.info('User settings updated', {
                userId,
                duration: Date.now() - startTime,
            });

            return updatedUser;
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            logger.error('Failed to update user settings', { userId, error });
            throw error;
        }
    }

    /**
     * Regenerate API key
     * Returns full key ONCE (user must save it)
     */
    async regenerateApiKey(userId: string): Promise<{ apiKey: string; last4: string; createdAt: Date }> {
        const startTime = Date.now();

        try {
            const user = await userRepository.getById(userId);
            if (!user) {
                throw new NotFoundError(`User ${userId} not found`);
            }

            // Generate new API key (sk_ prefix + 64 hex chars)
            const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
            const last4 = apiKey.slice(-4);
            const createdAt = new Date();

            // Hash the key with bcrypt (same as passwords)
            const bcrypt = require('bcrypt');
            const hash = await bcrypt.hash(apiKey, 10);

            // Store only hash + metadata
            await userRepository.updateApiKey(userId, {
                hash,
                last4,
                createdAt,
            });

            // Audit log
            await auditService.log({
                action: 'user_api_key_regenerated',
                actorId: userId,
                actorEmail: user.email,
                details: { last4, createdAt: createdAt.toISOString() },
            });

            logger.info('API key regenerated', {
                userId,
                last4,
                duration: Date.now() - startTime,
            });

            // Return full key ONCE (this is the only time user will see it)
            return { apiKey, last4, createdAt };
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            logger.error('Failed to regenerate API key', { userId, error });
            throw error;
        }
    }


    /**
     * Soft delete user account
     */
    async deleteAccount(userId: string): Promise<void> {
        const startTime = Date.now();

        try {
            const user = await userRepository.getById(userId);
            if (!user) {
                throw new NotFoundError(`User ${userId} not found`);
            }

            if (user.deletedAt) {
                throw new ValidationError('Account already deleted');
            }

            // Soft delete: set deletedAt timestamp
            await userRepository.softDelete(userId);

            // Audit log
            await auditService.log({
                action: 'user_account_deleted',
                actorId: userId,
                actorEmail: user.email,
                details: { deletedAt: new Date().toISOString() },
            });

            logger.info('User account deleted (soft)', {
                userId,
                email: user.email,
                duration: Date.now() - startTime,
            });
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
            logger.error('Failed to delete user account', { userId, error });
            throw error;
        }
    }
}

// Export singleton
export const userService = new UserService();
