/**
 * Drift Timeline Types
 * Timeline representation of drift history from audit logs
 */

/**
 * Timeline action types (mapped from audit actions)
 */
export type TimelineAction =
    | 'created'
    | 'detected'
    | 'triaged'
    | 'approved'
    | 'rejected'
    | 'resolved'
    | 'commented'
    | 'login'
    | 'other';

/**
 * Actor role in the system
 */
export type ActorRole = 'admin' | 'engineer' | 'viewer' | 'system';

/**
 * Single entry in a drift's timeline
 */
export interface DriftTimelineEntry {
    /** Unique identifier for this timeline entry */
    id: string;
    /** ISO 8601 timestamp when the action occurred */
    timestamp: string;
    /** Email of the actor (null for system actions) */
    actorEmail: string | null;
    /** Role of the actor */
    actorRole: ActorRole;
    /** Type of action performed */
    action: TimelineAction;
    /** Human-readable message describing the action */
    message: string;
    /** Additional metadata about the action */
    metadata: Record<string, any>;
}
