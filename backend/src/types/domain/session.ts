/**
 * Session Domain Entity
 * JWT refresh token management
 */

/**
 * Core Session entity
 */
export interface Session {
    /** Unique identifier (UUID) */
    id: string;
    /** User ID this session belongs to */
    userId: string;
    /** Refresh token (hashed in database) */
    refreshToken: string;
    /** IP address of the client */
    ipAddress?: string;
    /** User agent string */
    userAgent?: string;
    /** Whether session has been revoked */
    isRevoked: boolean;
    /** When session expires */
    expiresAt: Date;
    /** Record creation timestamp */
    createdAt: Date;
    /** Last time session was used */
    lastUsedAt?: Date;
}

/**
 * Input for creating a new session
 */
export interface CreateSessionInput {
    userId: string;
    refreshToken: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
}

/**
 * Session response (without sensitive token)
 */
export interface SessionResponse {
    id: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    isRevoked: boolean;
    expiresAt: Date;
    createdAt: Date;
    lastUsedAt?: Date;
}
