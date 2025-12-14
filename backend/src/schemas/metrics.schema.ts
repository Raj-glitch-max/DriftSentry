/**
 * Metrics Validation Schemas
 * Zod schemas for metrics-related endpoints
 */

import { z } from 'zod';

/**
 * Cost trend query parameters
 */
export const costTrendSchema = z.object({
    days: z.coerce.number().min(1).max(365).default(30),
});

export type CostTrendQuery = z.infer<typeof costTrendSchema>;

/**
 * Summary query parameters
 */
export const summarySchema = z.object({
    days: z.coerce.number().min(1).max(365).default(30),
});

export type SummaryQuery = z.infer<typeof summarySchema>;
