/**
 * Auth Service
 * Handles user authentication and token management
 */

import { userRepository } from '../repositories/user.repository';
import { sessionRepository } from '../repositories/session.repository';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt';
import { verifyPassword } from '../utils/password';
import { AuthError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Login input
 */
export interface LoginInput {
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Login result
 */
export interface LoginResult {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}

/**
 * Refresh input
 */
export interface RefreshInput {
    refreshToken: string;
}

/**
 * AuthService
 * Handles login, refresh, logout
 */
export class AuthService {
    /**
     * User login
     * @throws AuthError if credentials invalid
     */
    async login(input: LoginInput): Promise<LoginResult> {
        const startTime = Date.now();

        try {
            // 1. Find user by email
            const user = await userRepository.getByEmail(input.email);

            if (!user) {
                logger.warn('Login failed: user not found', {
                    email: input.email,
                    duration: Date.now() - startTime,
                });
                // Use generic error to prevent email enumeration
                throw new AuthError('Invalid email or password');
            }

            // 2. Check if user is active
            if (!user.isActive) {
                logger.warn('Login failed: user inactive', {
                    userId: user.id,
                    duration: Date.now() - startTime,
                });
                throw new AuthError('Account is disabled');
            }

            // 3. Verify password
            const passwordMatch = await verifyPassword(input.password, user.passwordHash);

            if (!passwordMatch) {
                logger.warn('Login failed: invalid password', {
                    userId: user.id,
                    duration: Date.now() - startTime,
                });
                throw new AuthError('Invalid email or password');
            }

            // 4. Generate tokens
            const accessToken = signAccessToken({
                userId: user.id,
                email: user.email,
                role: user.role as 'admin' | 'engineer' | 'viewer',
            });

            const refreshToken = signRefreshToken(user.id);

            // 5. Create session in database
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

            await sessionRepository.create({
                userId: user.id,
                refreshToken,
                expiresAt,
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
            });

            // 6. Update last login
            await userRepository.updateLastLogin(user.id);

            logger.info('User logged in', {
                userId: user.id,
                email: user.email,
                role: user.role,
                duration: Date.now() - startTime,
            });

            return {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
                    role: user.role,
                },
            };
        } catch (error) {
            if (error instanceof AuthError) throw error;

            logger.error('Login failed', {
                error: error instanceof Error ? error.message : String(error),
                email: input.email,
                duration: Date.now() - startTime,
            });
            throw error;
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refresh(input: RefreshInput): Promise<{ accessToken: string }> {
        try {
            // 1. Find session
            const session = await sessionRepository.getByRefreshToken(input.refreshToken);

            if (!session) {
                throw new AuthError('Invalid refresh token');
            }

            // 2. Check if revoked or expired
            if (session.isRevoked) {
                throw new AuthError('Refresh token has been revoked');
            }

            if (new Date() > session.expiresAt) {
                throw new AuthError('Refresh token has expired');
            }

            // 3. Get user
            const user = await userRepository.getById(session.userId);

            if (!user) {
                throw new AuthError('User not found');
            }

            if (!user.isActive) {
                throw new AuthError('Account is disabled');
            }

            // 4. Generate new access token
            const accessToken = signAccessToken({
                userId: user.id,
                email: user.email,
                role: user.role as 'admin' | 'engineer' | 'viewer',
            });

            // 5. Update session last used
            await sessionRepository.updateLastUsed(session.id);

            logger.debug('Token refreshed', { userId: user.id });

            return { accessToken };
        } catch (error) {
            if (error instanceof AuthError) throw error;

            logger.error('Refresh failed', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw new AuthError('Token refresh failed');
        }
    }

    /**
     * Logout user (revoke refresh token)
     */
    async logout(refreshToken: string): Promise<void> {
        try {
            const session = await sessionRepository.getByRefreshToken(refreshToken);

            if (session) {
                await sessionRepository.revoke(session.id);
                logger.debug('User logged out', { sessionId: session.id });
            }
        } catch (error) {
            logger.warn('Logout failed', {
                error: error instanceof Error ? error.message : String(error),
            });
            // Don't throw on logout - it's a "best effort" operation
        }
    }

    /**
     * Validate token and return user info
     */
    async validateToken(token: string): Promise<{
        userId: string;
        email: string;
        role: string;
    }> {
        const payload = verifyToken(token);

        return {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
        };
    }
}

// Export singleton
export const authService = new AuthService();
