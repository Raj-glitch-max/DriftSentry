/**
 * JWT Utilities
 * Token generation and verification
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthError } from './errors';

/**
 * JWT secret - must be set in production
 */
const JWT_SECRET = process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production';

/**
 * Token expiration times
 */
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

/**
 * JWT payload structure
 */
export interface JwtPayload {
    userId: string;
    email: string;
    role: 'admin' | 'engineer' | 'viewer';
    iat?: number;
    exp?: number;
}

/**
 * Sign JWT access token (short-lived, for API calls)
 */
export function signAccessToken(payload: {
    userId: string;
    email: string;
    role: 'admin' | 'engineer' | 'viewer';
}): string {
    return jwt.sign(
        {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
        },
        JWT_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
            audience: 'api',
            issuer: 'driftsentry',
        }
    );
}

/**
 * Sign JWT refresh token (long-lived, for getting new access tokens)
 */
export function signRefreshToken(userId: string): string {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRES_IN,
            audience: 'api',
            issuer: 'driftsentry',
        }
    );
}

/**
 * Verify JWT token and extract payload
 * @throws AuthError if token is invalid or expired
 */
export function verifyToken(token: string): JwtPayload {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            audience: 'api',
            issuer: 'driftsentry',
        }) as Record<string, unknown>;

        return {
            userId: (decoded['userId'] as string) ?? (decoded['sub'] as string),
            email: decoded['email'] as string,
            role: decoded['role'] as 'admin' | 'engineer' | 'viewer',
            iat: decoded['iat'] as number | undefined,
            exp: decoded['exp'] as number | undefined,
        };
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new AuthError('Token has expired');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new AuthError('Invalid token');
        }
        throw new AuthError('Token verification failed');
    }
}

/**
 * Extract token from Authorization header
 * Expected format: "Bearer <token>"
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1] ?? null;
}
