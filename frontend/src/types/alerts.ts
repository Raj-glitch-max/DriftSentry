/**
 * Alert-related TypeScript types for DriftSentry
 */

import type { AlertType, DriftSeverity } from './constants';

/**
 * Represents a notification/alert in the system
 */
export interface Alert {
    readonly id: string;
    readonly driftId?: string;
    readonly type: AlertType;
    readonly severity: DriftSeverity;
    readonly title: string;
    readonly message: string;
    readonly timestamp: string;
    readonly read: boolean;
    readonly acknowledged: boolean;
    readonly snoozedUntil?: string;
}

/**
 * Alert list query parameters
 */
export interface AlertQueryParams {
    readonly page?: number;
    readonly limit?: number;
    readonly unreadOnly?: boolean;
    readonly severity?: DriftSeverity;
    readonly type?: AlertType;
}

/**
 * Snooze alert request
 */
export interface SnoozeAlertRequest {
    readonly durationMinutes: number;
}
