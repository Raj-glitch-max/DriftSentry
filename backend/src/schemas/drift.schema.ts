/**
 * Drift Validation Schemas
 * Zod schemas for drift-related endpoints
 */

import { z } from 'zod';
import { DRIFT } from '../config/constants';

/**
 * List drifts query parameters
 */
export const listDriftsSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    severity: z.enum([...DRIFT.VALID_SEVERITIES, 'all']).default('all'),
    status: z.enum([...DRIFT.VALID_STATUSES, 'all']).default('all'),
    sortBy: z.enum(['createdAt', 'detectedAt', 'costImpactMonthly', 'severity']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().optional(),
    resourceType: z.enum(DRIFT.VALID_RESOURCE_TYPES).optional(),
    region: z.string().optional(),
});

export type ListDriftsQuery = z.infer<typeof listDriftsSchema>;

/**
 * Create drift request body
 * Used internally (by scheduler, API triggers)
 */
export const createDriftSchema = z.object({
    resourceId: z.string()
        .min(1, 'Resource ID required')
        .max(255, 'Resource ID too long'),

    resourceType: z.enum(DRIFT.VALID_RESOURCE_TYPES),

    region: z.string()
        .min(1, 'Region required')
        .max(50, 'Region too long'),

    accountId: z.string().max(12).optional(),

    expectedState: z.record(z.unknown())
        .refine((val) => Object.keys(val).length > 0, 'Expected state cannot be empty'),

    actualState: z.record(z.unknown()),

    severity: z.enum(DRIFT.VALID_SEVERITIES),

    costImpactMonthly: z.number()
        .nonnegative('Cost cannot be negative')
        .max(999999, 'Cost too high')
        .default(0),

    detectedBy: z.enum(DRIFT.VALID_DETECTED_BY),
});

export type CreateDriftInput = z.infer<typeof createDriftSchema>;

/**
 * Approve drift request body
 */
export const approveDriftSchema = z.object({
    reason: z.string()
        .min(10, 'Reason must be at least 10 characters')
        .max(1000, 'Reason too long'),
});

export type ApproveDriftInput = z.infer<typeof approveDriftSchema>;

/**
 * Reject drift request body
 */
export const rejectDriftSchema = z.object({
    reason: z.string()
        .min(10, 'Reason must be at least 10 characters')
        .max(1000, 'Reason too long'),
});

export type RejectDriftInput = z.infer<typeof rejectDriftSchema>;

/**
 * Resolve drift request body
 */
export const resolveDriftSchema = z.object({
    resolvedHow: z.enum(['auto-remediate', 'manual-fix', 'acknowledged']),
});

export type ResolveDriftInput = z.infer<typeof resolveDriftSchema>;
