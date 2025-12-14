/**
 * React Query hooks for alerts
 * 
 * These hooks provide a clean interface for components to access alert data.
 * They handle caching, refetching, and error states internally.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/services/alertsApi';
import type { Alert } from '@/types/alerts';
import type { PaginatedResponse } from '@/types/api';
import { QUERY_KEYS, CACHE_CONFIG, UI } from '@/types/constants';

// ============================================
// Query Hooks
// ============================================

/**
 * Hook for fetching paginated alerts
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 * @returns Query result with paginated alerts
 */
export function useAlerts(page: number = 1, limit: number = UI.DEFAULT_PAGE_SIZE) {
    return useQuery<PaginatedResponse<Alert>, Error>({
        queryKey: [QUERY_KEYS.ALERTS, page, limit],
        queryFn: () => alertsApi.list(page, limit),
        staleTime: CACHE_CONFIG.ALERTS_STALE_TIME,
        refetchInterval: CACHE_CONFIG.ALERTS_REFETCH_INTERVAL,
    });
}

/**
 * Hook for getting unread alert count
 * @returns Query result with unread count
 */
export function useUnreadAlertCount() {
    return useQuery<number, Error>({
        queryKey: [QUERY_KEYS.ALERTS_UNREAD_COUNT],
        queryFn: () => alertsApi.getUnreadCount(),
        staleTime: CACHE_CONFIG.ALERTS_UNREAD_STALE_TIME,
        refetchInterval: CACHE_CONFIG.ALERTS_UNREAD_STALE_TIME,
    });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Hook for marking an alert as read
 * @returns Mutation for marking alert as read with automatic cache invalidation
 */
export function useMarkAlertAsRead() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: (id: string) => alertsApi.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALERTS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALERTS_UNREAD_COUNT] });
        },
    });
}

/**
 * Hook for acknowledging an alert
 * @returns Mutation for acknowledging alert with automatic cache invalidation
 */
export function useAcknowledgeAlert() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: (id: string) => alertsApi.acknowledge(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALERTS] });
        },
    });
}

/**
 * Hook for snoozing an alert
 * @returns Mutation for snoozing alert with automatic cache invalidation
 */
export function useSnoozeAlert() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, { id: string; duration?: number }>({
        mutationFn: ({ id, duration }) => alertsApi.snooze(id, duration),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALERTS] });
        },
    });
}

/**
 * Hook for marking all alerts as read
 * @returns Mutation for marking all alerts as read with automatic cache invalidation
 */
export function useMarkAllAlertsAsRead() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, void>({
        mutationFn: () => alertsApi.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALERTS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALERTS_UNREAD_COUNT] });
        },
    });
}
