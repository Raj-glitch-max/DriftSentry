/**
 * React Query hooks for drifts and metrics
 * 
 * These hooks provide a clean interface for components to access drift data.
 * They handle caching, refetching, and error states internally.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driftApi } from '@/services/driftApi';
import type { DriftQueryParams } from '@/types/drift';
import type { Drift, DriftTimelineEvent, DriftActionResponse } from '@/types/drift';
import type { DashboardMetrics, CostTrendDataPoint } from '@/types/metrics';
import type { PaginatedResponse } from '@/types/api';
import { QUERY_KEYS, CACHE_CONFIG } from '@/types/constants';

// ============================================
// Query Hooks
// ============================================

/**
 * Hook for fetching paginated drifts
 * @param params - Query parameters for filtering and pagination
 * @returns Query result with paginated drifts
 */
export function useDrifts(params: DriftQueryParams = {}) {
    return useQuery<PaginatedResponse<Drift>, Error>({
        queryKey: [QUERY_KEYS.DRIFTS, params],
        queryFn: () => driftApi.list(params),
        staleTime: CACHE_CONFIG.DRIFTS_STALE_TIME,
        gcTime: CACHE_CONFIG.DRIFTS_GC_TIME,
    });
}

/**
 * Hook for fetching a single drift's details
 * @param id - Drift ID (query is disabled if undefined)
 * @returns Query result with drift details
 */
export function useDriftDetails(id: string | undefined) {
    return useQuery<Drift, Error>({
        queryKey: [QUERY_KEYS.DRIFT, id],
        queryFn: () => driftApi.get(id!),
        enabled: !!id,
        staleTime: CACHE_CONFIG.DRIFTS_STALE_TIME,
    });
}

/**
 * Hook for fetching dashboard metrics
 * @returns Query result with dashboard metrics
 */
export function useMetrics() {
    return useQuery<DashboardMetrics, Error>({
        queryKey: [QUERY_KEYS.METRICS],
        queryFn: () => driftApi.getMetrics(),
        staleTime: CACHE_CONFIG.METRICS_STALE_TIME,
        refetchInterval: CACHE_CONFIG.METRICS_REFETCH_INTERVAL,
    });
}

/**
 * Hook for fetching cost trend data
 * @param days - Number of days to fetch (default: 30)
 * @returns Query result with cost trend data points
 */
export function useCostTrend(days: number = 30) {
    return useQuery<CostTrendDataPoint[], Error>({
        queryKey: [QUERY_KEYS.COST_TREND, days],
        queryFn: () => driftApi.getCostTrend(days),
        staleTime: CACHE_CONFIG.COST_TREND_STALE_TIME,
    });
}

/**
 * Hook for fetching drift timeline
 * @param driftId - Drift ID (query is disabled if undefined)
 * @returns Query result with timeline events
 */
export function useDriftTimeline(driftId: string | undefined) {
    return useQuery<DriftTimelineEvent[], Error>({
        queryKey: [QUERY_KEYS.DRIFT_TIMELINE, driftId],
        queryFn: () => driftApi.getTimeline(driftId!),
        enabled: !!driftId,
        staleTime: 2 * 60 * 1000,
    });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Hook for approving a drift
 * @returns Mutation for approving drift with automatic cache invalidation
 */
export function useApproveDrift() {
    const queryClient = useQueryClient();

    return useMutation<DriftActionResponse, Error, { id: string; notes?: string }>({
        mutationFn: ({ id, notes }) => driftApi.approve(id, { notes }),
        onSuccess: () => {
            // Invalidate related queries to refetch fresh data
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DRIFTS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICS] });
        },
    });
}

/**
 * Hook for rejecting a drift
 * @returns Mutation for rejecting drift with automatic cache invalidation
 */
export function useRejectDrift() {
    const queryClient = useQueryClient();

    return useMutation<DriftActionResponse, Error, { id: string; reason: string }>({
        mutationFn: ({ id, reason }) => driftApi.reject(id, { reason }),
        onSuccess: () => {
            // Invalidate related queries to refetch fresh data
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DRIFTS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.METRICS] });
        },
    });
}
