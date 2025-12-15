/**
 * Audit Log Domain Entity
 * Immutable record of actions for compliance and debugging
 */

/**
 * Audit action types
 */
export type AuditAction =
    | 'drift_created'
    | 'drift_approved'
    | 'drift_rejected'
    | 'drift_resolved'
    | 'user_login'
    | 'user_logout'
    | 'user_settings_updated'
    | 'user_api_key_regenerated'
    | 'user_account_deleted'
    | 'alerts_marked_all_read';

/**
 * Core AuditLog entity
 * Records are immutable after creation
 */
export interface AuditLog {
    /** Unique identifier (UUID) */
    id: string;
    /** Related drift ID (if applicable) */
    driftId?: string;
    /** Action that was performed */
    action: AuditAction;
    /** User ID who performed the action */
    actorId?: string;
    /** User email (denormalized for deleted users) */
    actorEmail?: string;
    /** State before the action */
    oldValue?: Record<string, unknown>;
    /** State after the action */
    newValue?: Record<string, unknown>;
    /** Additional action details */
    details?: Record<string, unknown>;
    /** IP address of the request */
    ipAddress?: string;
    /** User agent string */
    userAgent?: string;
    /** When the action occurred (immutable) */
    createdAt: Date;
}

/**
 * Input for creating an audit log entry
 */
export interface CreateAuditLogInput {
    driftId?: string;
    action: AuditAction;
    actorId?: string;
    actorEmail?: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Filter options for listing audit logs
 */
export interface AuditLogFilters {
    driftId?: string;
    actorId?: string;
    action?: AuditAction | 'all';
    page: number;
    limit: number;
}

/**
 * Audit log response matching API format
 */
export interface AuditLogResponse extends AuditLog { }
