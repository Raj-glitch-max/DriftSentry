/**
 * Centralized constants for DriftSentry
 * All magic strings and enums that are used in multiple places
 */

// ============================================
// Domain Enums
// ============================================

/** Severity levels for infrastructure drifts */
export const DRIFT_SEVERITY = {
    CRITICAL: 'critical',
    WARNING: 'warning',
    INFO: 'info',
} as const;

export type DriftSeverity = (typeof DRIFT_SEVERITY)[keyof typeof DRIFT_SEVERITY];

/** Status of a drift */
export const DRIFT_STATUS = {
    DETECTED: 'detected',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    RESOLVED: 'resolved',
} as const;

export type DriftStatus = (typeof DRIFT_STATUS)[keyof typeof DRIFT_STATUS];

/** Resource types that can have drifts */
export const RESOURCE_TYPE = {
    EC2_INSTANCE: 'ec2_instance',
    S3_BUCKET: 's3_bucket',
    RDS_INSTANCE: 'rds_instance',
    LAMBDA_FUNCTION: 'lambda_function',
    SECURITY_GROUP: 'security_group',
    IAM_ROLE: 'iam_role',
    VPC: 'vpc',
    CLOUDFRONT: 'cloudfront',
    DYNAMODB_TABLE: 'dynamodb_table',
    UNKNOWN: 'unknown',
} as const;

export type ResourceType = (typeof RESOURCE_TYPE)[keyof typeof RESOURCE_TYPE];

/** Alert types */
export const ALERT_TYPE = {
    DRIFT_DETECTED: 'drift_detected',
    THRESHOLD_EXCEEDED: 'threshold_exceeded',
    RESOLUTION_NEEDED: 'resolution_needed',
    SYSTEM: 'system',
} as const;

export type AlertType = (typeof ALERT_TYPE)[keyof typeof ALERT_TYPE];

/** Timeline event actions */
export const TIMELINE_ACTION = {
    DETECTED: 'detected',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    RESOLVED: 'resolved',
    ESCALATED: 'escalated',
} as const;

export type TimelineAction = (typeof TIMELINE_ACTION)[keyof typeof TIMELINE_ACTION];

// ============================================
// React Query Keys
// ============================================

export const QUERY_KEYS = {
    DRIFTS: 'drifts',
    DRIFT: 'drift',
    DRIFT_TIMELINE: 'driftTimeline',
    METRICS: 'metrics',
    COST_TREND: 'costTrend',
    ALERTS: 'alerts',
    ALERTS_UNREAD_COUNT: 'alertsUnreadCount',
} as const;

// ============================================
// Routes
// ============================================

export const ROUTES = {
    HOME: '/',
    DASHBOARD: '/',
    DRIFTS: '/drifts',
    DRIFT_DETAIL: (id: string) => `/drift/${id}` as const,
    ANALYTICS: '/analytics',
    SETTINGS: '/settings',
} as const;

// ============================================
// API Endpoints (for backend integration)
// ============================================

export const API_ENDPOINTS = {
    DRIFTS: {
        LIST: '/drifts',
        GET: (id: string) => `/drifts/${id}`,
        APPROVE: (id: string) => `/drifts/${id}/approve`,
        REJECT: (id: string) => `/drifts/${id}/reject`,
        TIMELINE: (id: string) => `/drifts/${id}/timeline`,
    },
    METRICS: '/metrics',
    COST_TREND: '/cost/trend',
    ALERTS: {
        LIST: '/alerts',
        UNREAD_COUNT: '/alerts/unread/count',
        MARK_READ: (id: string) => `/alerts/${id}/read`,
        ACKNOWLEDGE: (id: string) => `/alerts/${id}/acknowledge`,
        SNOOZE: (id: string) => `/alerts/${id}/snooze`,
        MARK_ALL_READ: '/alerts/read-all',
    },
} as const;

// ============================================
// Time Constants
// ============================================

export const TIME = {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
} as const;

// ============================================
// Stale Time / Cache Config
// ============================================

export const CACHE_CONFIG = {
    DRIFTS_STALE_TIME: 5 * TIME.MINUTE,
    DRIFTS_GC_TIME: 10 * TIME.MINUTE,
    METRICS_STALE_TIME: TIME.MINUTE,
    METRICS_REFETCH_INTERVAL: TIME.MINUTE,
    ALERTS_STALE_TIME: 30 * TIME.SECOND,
    ALERTS_REFETCH_INTERVAL: 30 * TIME.SECOND,
    ALERTS_UNREAD_STALE_TIME: 10 * TIME.SECOND,
    COST_TREND_STALE_TIME: 5 * TIME.MINUTE,
} as const;

// ============================================
// UI Constants
// ============================================

export const UI = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_ALERTS_DISPLAY: 5,
    ANIMATION_DURATION_FAST: 150,
    ANIMATION_DURATION_NORMAL: 300,
    ANIMATION_DURATION_SLOW: 500,
} as const;
