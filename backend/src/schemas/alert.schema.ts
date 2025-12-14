/**
 * Alert Validation Schemas
 * Zod schemas for alert-related endpoints
 */

import { z } from 'zod';
import { ALERT, DRIFT } from '../config/constants';

/**
 * List alerts query parameters
 */
export const listAlertsSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    driftId: z.string().uuid().optional(),
    isRead: z.preprocess(
        (val) => val === 'true' ? true : val === 'false' ? false : val,
        z.boolean().optional()
    ),
    severity: z.enum([...DRIFT.VALID_SEVERITIES, 'all']).default('all'),
    type: z.enum([...ALERT.VALID_TYPES, 'all']).default('all'),
});

export type ListAlertsQuery = z.infer<typeof listAlertsSchema>;

/**
 * Create alert request body
 */
export const createAlertSchema = z.object({
    driftId: z.string().uuid('Invalid drift ID'),
    type: z.enum(ALERT.VALID_TYPES),
    severity: z.enum(DRIFT.VALID_SEVERITIES),
    title: z.string()
        .min(1, 'Title required')
        .max(255, 'Title too long'),
    message: z.string()
        .min(1, 'Message required')
        .max(2000, 'Message too long'),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
