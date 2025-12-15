/**
 * User Domain Entity
 * Represents a user in the DriftSentry system
 */

/**
 * User roles with different permission levels
 */
export type UserRole = 'admin' | 'engineer' | 'viewer';

/**
 * User settings/preferences
 */
export interface UserSettings {
    /** Enable email notifications */
    emailNotifications: boolean;
    /** Enable Slack integration */
    slackIntegration: boolean;
    /** Show critical alerts only */
    criticalAlertsOnly: boolean;
}

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
    /** User preferences/settings */
    settings?: UserSettings;
    /** API key hash (bcrypt, never expose) */
    apiKeyHash?: string;
    /** Last 4 chars of API key (for display) */
    apiKeyLast4?: string;
    /** When API key was created */
    apiKeyCreatedAt?: Date;
    /** Soft delete timestamp */
    deletedAt?: Date;
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
    settings?: UserSettings;
    apiKey?: { // Masked API key info
        last4?: string;
        createdAt?: Date;
        exists: boolean;
    };
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
 * Input for updating user settings
 */
export interface UpdateUserSettingsInput {
    emailNotifications?: boolean;
    slackIntegration?: boolean;
    criticalAlertsOnly?: boolean;
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
        settings: user.settings,
        apiKey: user.apiKeyLast4 ? {
            last4: user.apiKeyLast4,
            createdAt: user.apiKeyCreatedAt,
            exists: true,
        } : { exists: false },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
    };
}
