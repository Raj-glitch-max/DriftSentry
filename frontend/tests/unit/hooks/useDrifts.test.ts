/**
 * useDrifts Hook Unit Tests
 * TEST CASES: 15
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { useDrifts, useDriftDetails, useMetrics, useCostTrend, useApproveDrift, useRejectDrift } from '@/hooks/useDrifts';
import { driftApi } from '@/services/driftApi';
import { ReactNode } from 'react';

vi.mock('@/services/driftApi', () => ({
    driftApi: {
        list: vi.fn(),
        get: vi.fn(),
        getMetrics: vi.fn(),
        getCostTrend: vi.fn(),
        approve: vi.fn(),
        reject: vi.fn(),
        getTimeline: vi.fn(),
    },
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client= { queryClient } > { children } </QueryClientProvider>
  );
};

const mockDrift = {
    id: 'drift-123',
    resourceId: 'i-1234567890',
    resourceType: 'EC2',
    status: 'detected',
    severity: 'warning',
    costImpactMonthly: 100,
    createdAt: new Date().toISOString(),
};

const mockMetrics = {
    totalDrifts: 50,
    criticalDrifts: 5,
    pendingDrifts: 15,
    resolvedDrifts: 30,
    totalCostImpact: 5000,
};

describe('useDrifts hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useDrifts()', () => {
        it('should fetch paginated drifts', async () => {
            const mockResponse = { items: [mockDrift], total: 50, page: 1, pageSize: 10 };
            vi.mocked(driftApi.list).mockResolvedValue(mockResponse);

            const { result } = renderHook(() => useDrifts({ page: 1, limit: 10 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data?.items).toHaveLength(1);
            expect(result.current.data?.total).toBe(50);
        });

        it('should handle fetch error', async () => {
            vi.mocked(driftApi.list).mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useDrifts(), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.isError).toBe(true));

            expect(result.current.error?.message).toBe('Network error');
        });

        it('should refetch when params change', async () => {
            vi.mocked(driftApi.list).mockResolvedValue({ items: [], total: 0 });

            const { result, rerender } = renderHook(
                ({ params }) => useDrifts(params),
                { wrapper: createWrapper(), initialProps: { params: { page: 1 } } }
            );

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            rerender({ params: { page: 2 } });

            await waitFor(() => expect(driftApi.list).toHaveBeenCalledTimes(2));
        });
    });

    describe('useDriftDetails()', () => {
        it('should fetch drift details', async () => {
            vi.mocked(driftApi.get).mockResolvedValue(mockDrift);

            const { result } = renderHook(() => useDriftDetails('drift-123'), {
                wrapper: createWrapper(),
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data?.id).toBe('drift-123');
        });

        it('should not fetch when id is undefined', () => {
            const { result } = renderHook(() => useDriftDetails(undefined), {
                wrapper: createWrapper(),
            });

            expect(result.current.isFetching).toBe(false);
            expect(driftApi.get).not.toHaveBeenCalled();
        });
    });

    describe('useMetrics()', () => {
        it('should fetch dashboard metrics', async () => {
            vi.mocked(driftApi.getMetrics).mockResolvedValue(mockMetrics);

            const { result } = renderHook(() => useMetrics(), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data?.totalDrifts).toBe(50);
        });
    });

    describe('useCostTrend()', () => {
        it('should fetch cost trend for specified days', async () => {
            const mockTrend = [
                { date: '2024-01-01', cost: 100 },
                { date: '2024-01-02', cost: 150 },
            ];
            vi.mocked(driftApi.getCostTrend).mockResolvedValue(mockTrend);

            const { result } = renderHook(() => useCostTrend(7), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data).toHaveLength(2);
        });
    });

    describe('useApproveDrift()', () => {
        it('should approve drift and invalidate queries', async () => {
            vi.mocked(driftApi.approve).mockResolvedValue({ success: true, drift: mockDrift });

            const { result } = renderHook(() => useApproveDrift(), { wrapper: createWrapper() });

            result.current.mutate({ id: 'drift-123', notes: 'Approved' });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(driftApi.approve).toHaveBeenCalledWith('drift-123', { notes: 'Approved' });
        });
    });

    describe('useRejectDrift()', () => {
        it('should reject drift with reason', async () => {
            vi.mocked(driftApi.reject).mockResolvedValue({ success: true, drift: mockDrift });

            const { result } = renderHook(() => useRejectDrift(), { wrapper: createWrapper() });

            result.current.mutate({ id: 'drift-123', reason: 'Not applicable' });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(driftApi.reject).toHaveBeenCalledWith('drift-123', { reason: 'Not applicable' });
        });
    });
});
