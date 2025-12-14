/**
 * Alerts API service
 * 
 * This service handles all alert-related API calls.
 * In mock mode (USE_MOCK=true), it returns mock data.
 * When backend is ready, set USE_MOCK=false to use real endpoints.
 */

import { api } from './api';
import type { Alert } from '@/types/alerts';
import type { PaginatedResponse } from '@/types/api';
import { API_ENDPOINTS } from '@/types/constants';

// ============================================
// Configuration
// ============================================

/** Set to false when backend is ready */
const USE_MOCK = true;

/** Simulated network delay for mock responses (ms) */
const MOCK_DELAY = {
    SHORT: 100,
    MEDIUM: 200,
    LONG: 300,
} as const;

// ============================================
// Mock Data
// ============================================

const MOCK_ALERTS: Alert[] = [
    {
        id: '1',
        driftId: '1',
        type: 'drift_detected',
        severity: 'critical',
        title: 'Critical Security Drift',
        message: 'Security group on web-server-prod-1 was modified',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        read: false,
        acknowledged: false,
    },
    {
        id: '2',
        driftId: '5',
        type: 'drift_detected',
        severity: 'critical',
        title: 'IAM Permission Escalation',
        message: 'payment-processor-role gained admin access',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        read: false,
        acknowledged: false,
    },
    {
        id: '3',
        type: 'threshold_exceeded',
        severity: 'warning',
        title: 'Cost Threshold Exceeded',
        message: 'Monthly drift cost impact exceeded $10,000',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: true,
        acknowledged: false,
    },
    {
        id: '4',
        driftId: '4',
        type: 'drift_detected',
        severity: 'critical',
        title: 'Database Instance Modified',
        message: 'RDS instance type changed unexpectedly',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        read: true,
        acknowledged: true,
    },
    {
        id: '5',
        type: 'system',
        severity: 'info',
        title: 'Scan Complete',
        message: 'Daily infrastructure scan completed successfully',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        read: true,
        acknowledged: true,
    },
];

// ============================================
// Helper
// ============================================

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// API Service
// ============================================

export const alertsApi = {
    /**
     * Fetch paginated list of alerts
     * @param page - Page number (default: 1)
     * @param limit - Items per page (default: 20)
     * @returns Paginated list of alerts
     */
    async list(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Alert>> {
        if (USE_MOCK) {
            await delay(MOCK_DELAY.MEDIUM);

            const start = (page - 1) * limit;
            const items = MOCK_ALERTS.slice(start, start + limit);

            return {
                items,
                total: MOCK_ALERTS.length,
                page,
                pageSize: limit,
                hasMore: start + limit < MOCK_ALERTS.length,
            };
        }

        const response = await api.get<PaginatedResponse<Alert>>(API_ENDPOINTS.ALERTS.LIST, {
            params: { page, limit },
        });
        return response.data;
    },

    /**
     * Get unread alert count
     * @returns Number of unread alerts
     */
    async getUnreadCount(): Promise<number> {
        if (USE_MOCK) {
            await delay(MOCK_DELAY.SHORT);
            return MOCK_ALERTS.filter((a) => !a.read).length;
        }

        const response = await api.get<{ count: number }>(API_ENDPOINTS.ALERTS.UNREAD_COUNT);
        return response.data.count;
    },

    /**
     * Mark alert as read
     * @param id - Alert ID
     */
    async markAsRead(id: string): Promise<void> {
        if (USE_MOCK) {
            await delay(MOCK_DELAY.MEDIUM);
            return;
        }

        await api.post(API_ENDPOINTS.ALERTS.MARK_READ(id));
    },

    /**
     * Acknowledge alert
     * @param id - Alert ID
     */
    async acknowledge(id: string): Promise<void> {
        if (USE_MOCK) {
            await delay(MOCK_DELAY.MEDIUM);
            return;
        }

        await api.post(API_ENDPOINTS.ALERTS.ACKNOWLEDGE(id));
    },

    /**
     * Snooze alert
     * @param id - Alert ID
     * @param durationMinutes - Snooze duration in minutes (default: 60)
     */
    async snooze(id: string, durationMinutes: number = 60): Promise<void> {
        if (USE_MOCK) {
            await delay(MOCK_DELAY.MEDIUM);
            return;
        }

        await api.post(API_ENDPOINTS.ALERTS.SNOOZE(id), { durationMinutes });
    },

    /**
     * Mark all alerts as read
     */
    async markAllAsRead(): Promise<void> {
        if (USE_MOCK) {
            await delay(MOCK_DELAY.LONG);
            return;
        }

        await api.post(API_ENDPOINTS.ALERTS.MARK_ALL_READ);
    },
};
