/**
 * Auth Validation Schemas
 * Zod schemas for authentication endpoints
 */

import { z } from 'zod';

/**
 * Login request schema
 */
export const loginSchema = z.object({
    email: z.string()
        .email('Invalid email format')
        .max(255, 'Email too long'),

    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(255, 'Password too long'),
});

export type LoginSchemaInput = z.infer<typeof loginSchema>;

/**
 * Refresh token request schema
 */
export const refreshSchema = z.object({
    refreshToken: z.string()
        .min(1, 'Refresh token required'),
});

export type RefreshSchemaInput = z.infer<typeof refreshSchema>;

/**
 * Logout request schema
 */
export const logoutSchema = z.object({
    refreshToken: z.string()
        .min(1, 'Refresh token required'),
});

export type LogoutSchemaInput = z.infer<typeof logoutSchema>;
