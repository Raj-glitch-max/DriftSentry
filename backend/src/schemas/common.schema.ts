/**
 * Common Validation Schemas
 * Shared schemas and validation helpers
 */

import { z } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * UUID schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Pagination query schema
 */
export const paginationSchema = z.object({
    page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
    limit: z.coerce.number().min(1).max(100, 'Limit cannot exceed 100').default(20),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

/**
 * Sort order schema
 */
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

/**
 * Validate and parse request data
 * Uses z.output to ensure default values are included in return type
 * @throws ValidationError with field-level details if invalid
 */
export function validateRequest<T extends z.ZodTypeAny>(
    schema: T,
    data: unknown
): z.output<T> {
    try {
        return schema.parse(data) as z.output<T>;
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new ValidationError('Invalid request', {
                errors: error.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            });
        }
        throw error;
    }
}

/**
 * Validate path parameters
 */
export function validateParams<T extends z.ZodTypeAny>(
    schema: T,
    params: Record<string, string>
): z.output<T> {
    return validateRequest(schema, params);
}

/**
 * ID param schema
 */
export const idParamSchema = z.object({
    id: uuidSchema,
});

export type IdParam = z.infer<typeof idParamSchema>;
