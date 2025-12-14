/**
 * Auth Service Unit Tests
 * Tests for user authentication and token management
 * 
 * TEST CASES: 10
 * Coverage Target: 95%+
 */

import { AuthService } from '../../../src/services/auth.service';
import { userRepository } from '../../../src/repositories/user.repository';
import { sessionRepository } from '../../../src/repositories/session.repository';
import * as jwtUtils from '../../../src/utils/jwt';
import * as passwordUtils from '../../../src/utils/password';
import { AuthError } from '../../../src/utils/errors';

// Mock dependencies
jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/repositories/session.repository');
jest.mock('../../../src/utils/jwt');
jest.mock('../../../src/utils/password');
jest.mock('../../../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

describe('AuthService', () => {
    let authService: AuthService;

    const mockUser = {
        id: 'user-123',
        email: 'admin@driftsentry.local',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        passwordHash: '$2b$12$hashedPassword',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days ahead
        isRevoked: false,
        createdAt: new Date(),
        lastUsedAt: new Date(),
    };

    beforeEach(() => {
        authService = new AuthService();
        jest.clearAllMocks();
    });

    describe('login()', () => {
        // TEST CASE 1: Valid credentials return tokens
        it('should return tokens for valid email and password', async () => {
            // Setup
            (userRepository.getByEmail as jest.Mock).mockResolvedValue(mockUser);
            (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
            (jwtUtils.signAccessToken as jest.Mock).mockReturnValue('access-token-123');
            (jwtUtils.signRefreshToken as jest.Mock).mockReturnValue('refresh-token-123');
            (sessionRepository.create as jest.Mock).mockResolvedValue(mockSession);
            (userRepository.updateLastLogin as jest.Mock).mockResolvedValue(undefined);

            // Execute
            const result = await authService.login({
                email: 'admin@driftsentry.local',
                password: 'admin123',
            });

            // Assert
            expect(result).toHaveProperty('accessToken', 'access-token-123');
            expect(result).toHaveProperty('refreshToken', 'refresh-token-123');
            expect(result.user).toHaveProperty('id', 'user-123');
            expect(result.user).toHaveProperty('email', 'admin@driftsentry.local');
            expect(result.user).toHaveProperty('role', 'admin');
            expect(userRepository.getByEmail).toHaveBeenCalledWith('admin@driftsentry.local');
            expect(passwordUtils.verifyPassword).toHaveBeenCalled();
        });

        // TEST CASE 2: Invalid email throws error
        it('should throw error for non-existent email', async () => {
            // Setup
            (userRepository.getByEmail as jest.Mock).mockResolvedValue(null);

            // Execute & Assert
            await expect(
                authService.login({
                    email: 'nonexistent@driftsentry.local',
                    password: 'admin123',
                })
            ).rejects.toThrow(AuthError);

            await expect(
                authService.login({
                    email: 'nonexistent@driftsentry.local',
                    password: 'admin123',
                })
            ).rejects.toThrow('Invalid email or password');
        });

        // TEST CASE 3: Invalid password throws error
        it('should throw error for wrong password', async () => {
            // Setup
            (userRepository.getByEmail as jest.Mock).mockResolvedValue(mockUser);
            (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(false);

            // Execute & Assert
            await expect(
                authService.login({
                    email: 'admin@driftsentry.local',
                    password: 'wrongpassword',
                })
            ).rejects.toThrow(AuthError);

            await expect(
                authService.login({
                    email: 'admin@driftsentry.local',
                    password: 'wrongpassword',
                })
            ).rejects.toThrow('Invalid email or password');
        });

        // TEST CASE 4: Inactive user throws error
        it('should throw error for inactive user account', async () => {
            // Setup
            const inactiveUser = { ...mockUser, isActive: false };
            (userRepository.getByEmail as jest.Mock).mockResolvedValue(inactiveUser);

            // Execute & Assert
            await expect(
                authService.login({
                    email: 'admin@driftsentry.local',
                    password: 'admin123',
                })
            ).rejects.toThrow(AuthError);

            await expect(
                authService.login({
                    email: 'admin@driftsentry.local',
                    password: 'admin123',
                })
            ).rejects.toThrow('Account is disabled');
        });
    });

    describe('refresh()', () => {
        // TEST CASE 5: Valid refresh token returns new access token
        it('should issue new access token for valid refresh token', async () => {
            // Setup
            (sessionRepository.getByRefreshToken as jest.Mock).mockResolvedValue(mockSession);
            (userRepository.getById as jest.Mock).mockResolvedValue(mockUser);
            (jwtUtils.signAccessToken as jest.Mock).mockReturnValue('new-access-token');
            (sessionRepository.updateLastUsed as jest.Mock).mockResolvedValue(undefined);

            // Execute
            const result = await authService.refresh({
                refreshToken: 'valid-refresh-token',
            });

            // Assert
            expect(result).toHaveProperty('accessToken', 'new-access-token');
            expect(sessionRepository.updateLastUsed).toHaveBeenCalledWith('session-123');
        });

        // TEST CASE 6: Expired refresh token rejected
        it('should reject expired refresh token', async () => {
            // Setup
            const expiredSession = {
                ...mockSession,
                expiresAt: new Date(Date.now() - 1000), // 1 second ago
            };
            (sessionRepository.getByRefreshToken as jest.Mock).mockResolvedValue(expiredSession);

            // Execute & Assert
            await expect(
                authService.refresh({ refreshToken: 'expired-token' })
            ).rejects.toThrow(AuthError);

            await expect(
                authService.refresh({ refreshToken: 'expired-token' })
            ).rejects.toThrow('Refresh token has expired');
        });

        // TEST CASE 7: Revoked refresh token rejected
        it('should reject revoked refresh token', async () => {
            // Setup
            const revokedSession = { ...mockSession, isRevoked: true };
            (sessionRepository.getByRefreshToken as jest.Mock).mockResolvedValue(revokedSession);

            // Execute & Assert
            await expect(
                authService.refresh({ refreshToken: 'revoked-token' })
            ).rejects.toThrow(AuthError);

            await expect(
                authService.refresh({ refreshToken: 'revoked-token' })
            ).rejects.toThrow('Refresh token has been revoked');
        });

        // TEST CASE 8: Invalid refresh token rejected
        it('should reject invalid refresh token', async () => {
            // Setup
            (sessionRepository.getByRefreshToken as jest.Mock).mockResolvedValue(null);

            // Execute & Assert
            await expect(
                authService.refresh({ refreshToken: 'invalid-token' })
            ).rejects.toThrow(AuthError);

            await expect(
                authService.refresh({ refreshToken: 'invalid-token' })
            ).rejects.toThrow('Invalid refresh token');
        });
    });

    describe('logout()', () => {
        // TEST CASE 9: Valid logout revokes session
        it('should revoke session on logout', async () => {
            // Setup
            (sessionRepository.getByRefreshToken as jest.Mock).mockResolvedValue(mockSession);
            (sessionRepository.revoke as jest.Mock).mockResolvedValue(undefined);

            // Execute
            await authService.logout('valid-refresh-token');

            // Assert
            expect(sessionRepository.revoke).toHaveBeenCalledWith('session-123');
        });

        // TEST CASE 10: Logout with invalid token doesn't throw
        it('should not throw error on logout with invalid token', async () => {
            // Setup
            (sessionRepository.getByRefreshToken as jest.Mock).mockResolvedValue(null);

            // Execute & Assert - should not throw
            await expect(
                authService.logout('invalid-token')
            ).resolves.toBeUndefined();

            // Revoke should not be called
            expect(sessionRepository.revoke).not.toHaveBeenCalled();
        });
    });

    describe('validateToken()', () => {
        it('should validate token and return user info', async () => {
            // Setup
            const mockPayload = {
                userId: 'user-123',
                email: 'admin@driftsentry.local',
                role: 'admin',
            };
            (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockPayload);

            // Execute
            const result = await authService.validateToken('valid-access-token');

            // Assert
            expect(result).toEqual({
                userId: 'user-123',
                email: 'admin@driftsentry.local',
                role: 'admin',
            });
        });
    });
});
