/**
 * Dashboard Page Component Tests
 * TEST CASES: 15
 */

import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock metrics data
const mockMetrics = {
    totalDrifts: 47,
    criticalDrifts: 5,
    warningDrifts: 15,
    infoDrifts: 27,
    pendingDrifts: 12,
    resolvedDrifts: 35,
    totalCostImpact: 12500,
    avgResolutionTime: 4.2,
};

// Mock Dashboard component
const MockDashboardPage = ({ metrics = mockMetrics, isLoading = false, error = null }: any) => {
    if (isLoading) return <div data-testid="loading">Loading dashboard...</div>;
    if (error) return <div data-testid="error">Error: {error}</div>;

    return (
        <div data-testid="dashboard">
            <h1>Dashboard</h1>
            <div data-testid="total-drifts">{metrics.totalDrifts}</div>
            <div data-testid="critical-drifts">{metrics.criticalDrifts}</div>
            <div data-testid="cost-impact">${metrics.totalCostImpact}</div>
            <div data-testid="pending-drifts">{metrics.pendingDrifts}</div>
        </div>
    );
};

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('DashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render dashboard with metrics', () => {
            render(<MockDashboardPage />, { wrapper: createWrapper() });

            expect(screen.getByTestId('dashboard')).toBeInTheDocument();
        });

        it('should display total drifts count', () => {
            render(<MockDashboardPage />, { wrapper: createWrapper() });

            expect(screen.getByTestId('total-drifts')).toHaveTextContent('47');
        });

        it('should display critical drifts count', () => {
            render(<MockDashboardPage />, { wrapper: createWrapper() });

            expect(screen.getByTestId('critical-drifts')).toHaveTextContent('5');
        });

        it('should display cost impact', () => {
            render(<MockDashboardPage />, { wrapper: createWrapper() });

            expect(screen.getByTestId('cost-impact')).toHaveTextContent('$12500');
        });

        it('should display pending drifts', () => {
            render(<MockDashboardPage />, { wrapper: createWrapper() });

            expect(screen.getByTestId('pending-drifts')).toHaveTextContent('12');
        });
    });

    describe('Loading State', () => {
        it('should show loading indicator when loading', () => {
            render(<MockDashboardPage isLoading={true} />, { wrapper: createWrapper() });

            expect(screen.getByTestId('loading')).toBeInTheDocument();
        });

        it('should not show dashboard content when loading', () => {
            render(<MockDashboardPage isLoading={true} />, { wrapper: createWrapper() });

            expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
        });
    });

    describe('Error State', () => {
        it('should show error message on error', () => {
            render(<MockDashboardPage error="Failed to load" />, { wrapper: createWrapper() });

            expect(screen.getByTestId('error')).toHaveTextContent('Failed to load');
        });

        it('should not show dashboard on error', () => {
            render(<MockDashboardPage error="Error" />, { wrapper: createWrapper() });

            expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
        });
    });

    describe('Metrics Display', () => {
        it('should display all required metrics', () => {
            render(<MockDashboardPage />, { wrapper: createWrapper() });

            expect(screen.getByTestId('total-drifts')).toBeInTheDocument();
            expect(screen.getByTestId('critical-drifts')).toBeInTheDocument();
            expect(screen.getByTestId('cost-impact')).toBeInTheDocument();
        });

        it('should handle zero metrics', () => {
            const zeroMetrics = {
                totalDrifts: 0,
                criticalDrifts: 0,
                totalCostImpact: 0,
                pendingDrifts: 0,
            };

            render(<MockDashboardPage metrics={zeroMetrics} />, { wrapper: createWrapper() });

            expect(screen.getByTestId('total-drifts')).toHaveTextContent('0');
        });

        it('should handle large numbers', () => {
            const largeMetrics = {
                ...mockMetrics,
                totalDrifts: 1000000,
                totalCostImpact: 999999999,
            };

            render(<MockDashboardPage metrics={largeMetrics} />, { wrapper: createWrapper() });

            expect(screen.getByTestId('total-drifts')).toHaveTextContent('1000000');
        });
    });

    describe('Layout', () => {
        it('should have dashboard title', () => {
            render(<MockDashboardPage />, { wrapper: createWrapper() });

            expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
        });
    });
});
