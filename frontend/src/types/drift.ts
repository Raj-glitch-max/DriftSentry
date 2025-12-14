/**
 * Drift-related TypeScript types for DriftSentry
 */

import type { DriftSeverity, DriftStatus, ResourceType, TimelineAction } from './constants';

/**
 * Represents a single infrastructure drift event
 */
export interface Drift {
    readonly id: string;
    readonly resource: string;
    readonly resourceType: ResourceType;
    readonly type: string;
    readonly severity: DriftSeverity;
    readonly status: DriftStatus;
    readonly expectedState: Record<string, unknown>;
    readonly actualState: Record<string, unknown>;
    readonly difference: Record<string, unknown>;
    readonly detectedAt: string;
    readonly resolvedAt?: string;
    readonly costImpact: number;
    readonly region: string;
    readonly account: string;
    readonly tags?: Record<string, string>;
}

/**
 * Extended drift with full details (for detail view)
 */
export interface DriftDetail extends Drift {
    readonly remediationSteps?: string[];
    readonly relatedDrifts?: readonly string[];
    readonly history?: readonly DriftTimelineEvent[];
}

/**
 * Timeline event for drift history
 */
export interface DriftTimelineEvent {
    readonly id: string;
    readonly driftId: string;
    readonly action: TimelineAction;
    readonly timestamp: string;
    readonly description: string;
    readonly user?: string;
    readonly metadata?: Record<string, unknown>;
}

/**
 * Query parameters for drift list
 */
export interface DriftQueryParams {
    readonly page?: number;
    readonly limit?: number;
    readonly severity?: DriftSeverity;
    readonly status?: DriftStatus;
    readonly resourceType?: ResourceType;
    readonly search?: string;
    readonly sortBy?: 'detectedAt' | 'severity' | 'costImpact';
    readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Approve drift request
 */
export interface ApproveDriftRequest {
    readonly notes?: string;
    readonly autoRemediate?: boolean;
}

/**
 * Reject drift request
 */
export interface RejectDriftRequest {
    readonly reason: string;
    readonly createException?: boolean;
}

/**
 * Drift action response
 */
export interface DriftActionResponse {
    readonly id: string;
    readonly status: DriftStatus;
    readonly message?: string;
}
