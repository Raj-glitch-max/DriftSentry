/**
 * User Domain Entity
 * Represents a user in the DriftSentry system
 */

/**
 * User roles with different permission levels
 */
export type UserRole = 'admin' | 'engineer' | 'viewer';

/**
 * Core User entity
 */
export interface User {
    /** Unique identifier (UUID) */
    id: string;
    /** User email address (unique) */
    email: string;
    /** Hashed password (never exposed in API responses) */
    passwordHash: string;
    /** First name */
    firstName?: string;
    /** Last name */
    lastName?: string;
    /** Avatar URL */
    avatarUrl?: string;
    /** User role determining permissions */
    role: UserRole;
    /** Whether user account is active */
    isActive: boolean;
    /** Record creation timestamp */
    createdAt: Date;
    /** Record last update timestamp */
    updatedAt: Date;
    /** Last successful login timestamp */
    lastLoginAt?: Date;
}

/**
 * User without sensitive fields (for API responses)
 */
export interface UserPublic {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
}

/**
 * Input for creating a new user
 */
export interface CreateUserInput {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
}

/**
 * Input for updating user profile
 */
export interface UpdateUserInput {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
}

/**
 * Input for updating user role (admin only)
 */
export interface UpdateUserRoleInput {
    role: UserRole;
}

/**
 * Input for user login
 */
export interface LoginInput {
    email: string;
    password: string;
}

/**
 * User response matching API format
 */
export interface UserResponse extends UserPublic { }

/**
 * Convert User to UserPublic (removes sensitive fields)
 */
export function toUserPublic(user: User): UserPublic {
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
    };
}
