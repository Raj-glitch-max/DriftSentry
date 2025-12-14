/**
 * Drift Domain Entity
 * Represents a detected infrastructure divergence from expected state
 */

/**
 * Resource types that can have drift detection
 */
export type ResourceType = 'EC2' | 'RDS' | 'S3' | 'IAM_ROLE' | 'SECURITY_GROUP';

/**
 * Severity levels for drift detection
 */
export type Severity = 'critical' | 'warning' | 'info';

/**
 * Status lifecycle for drift resolution
 */
export type DriftStatus = 'detected' | 'triaged' | 'approved' | 'rejected' | 'resolved';

/**
 * How drift was detected
 */
export type DetectedBy = 'scheduler' | 'manual' | 'api';

/**
 * How drift was resolved
 */
export type ResolvedHow = 'auto-remediate' | 'manual-fix' | 'acknowledged';

/**
 * Core Drift entity
 * Represents detected configuration divergence from expected state
 */
export interface Drift {
    /** Unique identifier (UUID) */
    id: string;
    /** AWS resource identifier (e.g., "i-0123456789abcdef0") */
    resourceId: string;
    /** Type of AWS resource */
    resourceType: ResourceType;
    /** AWS region code (e.g., "us-east-1") */
    region: string;
    /** AWS account ID */
    accountId?: string;

    /** Expected state from IaC definition */
    expectedState: Record<string, unknown>;
    /** Actual state from AWS */
    actualState: Record<string, unknown>;
    /** Computed difference between expected and actual */
    difference: Record<string, unknown>;

    /** Severity level */
    severity: Severity;
    /** Monthly cost impact in USD */
    costImpactMonthly: number;

    /** Current status in lifecycle */
    status: DriftStatus;

    /** When drift was detected */
    detectedAt: Date;
    /** How drift was detected */
    detectedBy: DetectedBy;

    /** When drift was approved (optional) */
    approvedAt?: Date;
    /** User ID who approved (optional) */
    approvedBy?: string;
    /** Reason for approval (optional) */
    approvalReason?: string;

    /** When drift was rejected (optional) */
    rejectedAt?: Date;
    /** User ID who rejected (optional) */
    rejectedBy?: string;
    /** Reason for rejection (optional) */
    rejectionReason?: string;

    /** When drift was resolved (optional) */
    resolvedAt?: Date;
    /** How drift was resolved (optional) */
    resolvedHow?: ResolvedHow;

    /** Record creation timestamp */
    createdAt: Date;
    /** Record last update timestamp */
    updatedAt: Date;
}

/**
 * Input for creating a new drift
 */
export interface CreateDriftInput {
    resourceId: string;
    resourceType: ResourceType;
    region: string;
    accountId?: string;
    expectedState: Record<string, unknown>;
    actualState: Record<string, unknown>;
    severity: Severity;
    costImpactMonthly: number;
    detectedBy: DetectedBy;
}

/**
 * Input for approving a drift
 */
export interface ApproveDriftInput {
    /** Reason for approval (min 10 chars) */
    reason: string;
    /** User ID who is approving */
    approvedBy: string;
}

/**
 * Input for rejecting a drift
 */
export interface RejectDriftInput {
    /** Reason for rejection (min 10 chars) */
    reason: string;
    /** User ID who is rejecting */
    rejectedBy: string;
}

/**
 * Input for resolving a drift
 */
export interface ResolveDriftInput {
    /** How the drift was resolved */
    resolvedHow: ResolvedHow;
}

/**
 * Filter options for listing drifts
 */
export interface DriftFilters {
    status?: DriftStatus | 'all';
    severity?: Severity | 'all';
    resourceType?: ResourceType;
    region?: string;
    page: number;
    limit: number;
    sortBy?: 'createdAt' | 'detectedAt' | 'costImpactMonthly' | 'severity';
    sortOrder?: 'asc' | 'desc';
    search?: string;
}

/**
 * Drift response matching API format
 */
export interface DriftResponse extends Drift { }
