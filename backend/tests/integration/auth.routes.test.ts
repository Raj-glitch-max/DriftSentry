/**
 * Auth Routes Integration Tests
 * TEST CASES: 15
 */

import request from 'supertest';
import { app } from '../../src/app';
import { userRepository } from '../../src/repositories/user.repository';
import { sessionRepository } from '../../src/repositories/session.repository';
import * as passwordUtils from '../../src/utils/password';
import * as jwtUtils from '../../src/utils/jwt';

jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/repositories/session.repository');
jest.mock('../../src/utils/password');
jest.mock('../../src/utils/jwt');
jest.mock('../../src/utils/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockUser = {
    id: 'user-123',
    email: 'admin@driftsentry.local',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    passwordHash: '$2b$12$hash',
    isActive: true,
};

const mockSession = {
    id: 'session-123',
    userId: 'user-123',
    refreshToken: 'valid-refresh-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isRevoked: false,
};

describe('Auth Routes Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/v1/auth/login', () => {
        it('should return 200 with tokens for valid credentials', async () => {
            (userRepository.getByEmail as jest.Mock).mockResolvedValue(mockUser);
            (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
            (jwtUtils.signAccessToken as jest.Mock).mockReturnValue('access-token');
            (jwtUtils.signRefreshToken as jest.Mock).mockReturnValue('refresh-token');
            (sessionRepository.create as jest.Mock).mockResolvedValue(mockSession);
            (userRepository.updateLastLogin as jest.Mock).mockResolvedValue(undefined);

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'admin@driftsentry.local', password: 'admin123' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
            expect(res.body).toHaveProperty('user');
        });

        it('should return 401 for invalid password', async () => {
            (userRepository.getByEmail as jest.Mock).mockResolvedValue(mockUser);
            (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(false);

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'admin@driftsentry.local', password: 'wrong' });

            expect(res.status).toBe(401);
        });

        it('should return 401 for non-existent user', async () => {
            (userRepository.getByEmail as jest.Mock).mockResolvedValue(null);

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'noone@driftsentry.local', password: 'test' });

            expect(res.status).toBe(401);
        });

        it('should return 400 for missing email', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ password: 'admin123' });

            expect(res.status).toBe(400);
        });

        it('should return 400 for missing password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'admin@driftsentry.local' });

            expect(res.status).toBe(400);
        });

        it('should return 401 for inactive user', async () => {
            (userRepository.getByEmail as jest.Mock).mockResolvedValue({ ...mockUser, isActive: false });

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'admin@driftsentry.local', password: 'admin123' });

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/v1/auth/refresh', () => {
        it('should return 200 with new access token', async () => {
            (sessionRepository.getByRefreshToken as jest.Mock).mockResolvedValue(mockSession);
            (userRepository.getById as jest.Mock).mockResolvedValue(mockUser);
            (jwtUtils.signAccessToken as jest.Mock).mockReturnValue('new-access-token');
            (sessionRepository.updateLastUsed as jest.Mock).mockResolvedValue(undefined);

            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: 'valid-refresh-token' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('accessToken');
        });

        it('should return 401 for invalid refresh token', async () => {
            (sessionRepository.getByRefreshToken as jest.Mock).mockResolvedValue(null);

            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: 'invalid-token' });

            expect(res.status).toBe(401);
        });

        it('should return 401 for expired refresh token', async () => {
            (sessionRepository.getByRefreshToken as jest.Mock).mockResolvedValue({
                ...mockSession,
                expiresAt: new Date(Date.now() - 1000),
            });

            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: 'expired-token' });

            expect(res.status).toBe(401);
        });

        it('should return 401 for revoked refresh token', async () => {
            (sessionRepository.getByRefreshToken as jest.Mock).mockResolvedValue({
                ...mockSession,
                isRevoked: true,
            });

            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: 'revoked-token' });

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/v1/auth/logout', () => {
        it('should return 200 on successful logout', async () => {
            (jwtUtils.verifyToken as jest.Mock).mockReturnValue({ userId: 'user-123', role: 'admin' });
            (sessionRepository.getByRefreshToken as jest.Mock).mockResolvedValue(mockSession);
            (sessionRepository.revoke as jest.Mock).mockResolvedValue(undefined);

            const res = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', 'Bearer valid-token')
                .send({ refreshToken: 'valid-refresh-token' });

            expect(res.status).toBe(200);
        });

        it('should return 401 without auth header', async () => {
            const res = await request(app)
                .post('/api/v1/auth/logout')
                .send({ refreshToken: 'token' });

            expect(res.status).toBe(401);
        });
    });
});
