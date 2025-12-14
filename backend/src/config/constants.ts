/**
 * API Constants
 * Shared configuration values for the API
 */

/**
 * API version prefix
 */
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

/**
 * Pagination defaults
 */
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

/**
 * Request size limits
 */
export const REQUEST_LIMITS = {
    JSON_SIZE: '10mb',
    URL_ENCODED_SIZE: '10mb',
} as const;

/**
 * Rate limiting (for Phase 3)
 */
export const RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
} as const;

/**
 * Drift-related constants
 */
export const DRIFT = {
    VALID_STATUSES: ['detected', 'triaged', 'approved', 'rejected', 'resolved'] as const,
    VALID_SEVERITIES: ['critical', 'warning', 'info'] as const,
    VALID_RESOURCE_TYPES: ['EC2', 'RDS', 'S3', 'IAM_ROLE', 'SECURITY_GROUP'] as const,
    VALID_DETECTED_BY: ['scheduler', 'manual', 'api'] as const,
    DUPLICATE_CHECK_MINUTES: 60,
} as const;

/**
 * Alert-related constants
 */
export const ALERT = {
    VALID_TYPES: ['drift_detected', 'approval_needed', 'remediation_failed'] as const,
} as const;
