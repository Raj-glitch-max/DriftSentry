/**
 * Alert Domain Entity
 * Represents notifications for drift events
 */

import type { Severity } from './drift';

/**
 * Alert types
 */
export type AlertType = 'drift_detected' | 'approval_needed' | 'remediation_failed';

/**
 * Core Alert entity
 */
export interface Alert {
    /** Unique identifier (UUID) */
    id: string;
    /** Related drift ID */
    driftId: string;
    /** Type of alert */
    type: AlertType;
    /** Severity level */
    severity: Severity;
    /** Short title */
    title: string;
    /** Detailed message */
    message: string;
    /** Whether alert has been read */
    isRead: boolean;
    /** When alert was read */
    readAt?: Date;
    /** User ID who read the alert */
    readBy?: string;
    /** Record creation timestamp */
    createdAt: Date;
    /** Record last update timestamp */
    updatedAt: Date;
}

/**
 * Input for creating a new alert
 */
export interface CreateAlertInput {
    driftId: string;
    type: AlertType;
    severity: Severity;
    title: string;
    message: string;
}

/**
 * Input for marking alerts as read
 */
export interface MarkAlertReadInput {
    readBy: string;
}

/**
 * Filter options for listing alerts
 */
export interface AlertFilters {
    driftId?: string;
    isRead?: boolean;
    severity?: Severity | 'all';
    type?: AlertType | 'all';
    page: number;
    limit: number;
}

/**
 * Alert response matching API format
 */
export interface AlertResponse extends Alert { }
