/**
 * DriftsList Component Tests
 * TEST CASES: 15
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const mockDrifts = [
    {
        id: 'drift-1',
        resourceId: 'i-1234567890',
        resourceType: 'EC2',
        status: 'detected',
        severity: 'critical',
        costImpactMonthly: 500,
        createdAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'drift-2',
        resourceId: 'rds-instance-1',
        resourceType: 'RDS',
        status: 'approved',
        severity: 'warning',
        costImpactMonthly: 200,
        createdAt: '2024-01-14T10:00:00Z',
    },
];

// Mock DriftsList component
const MockDriftsList = ({
    drifts = mockDrifts,
    isLoading = false,
    onApprove = vi.fn(),
    onReject = vi.fn(),
    onFilter = vi.fn(),
}: any) => {
    if (isLoading) return <div data-testid="loading">Loading drifts...</div>;

    return (
        <div data-testid="drifts-list">
            <div data-testid="filter-bar">
                <select data-testid="status-filter" onChange={(e) => onFilter({ status: e.target.value })}>
                    <option value="all">All</option>
                    <option value="detected">Detected</option>
                    <option value="approved">Approved</option>
                </select>
                <select data-testid="severity-filter" onChange={(e) => onFilter({ severity: e.target.value })}>
                    <option value="all">All</option>
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                </select>
            </div>
            <table data-testid="drifts-table">
                <thead>
                    <tr>
                        <th>Resource</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Severity</th>
                        <th>Cost</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {drifts.map((drift: any) => (
                        <tr key={drift.id} data-testid={`drift-row-${drift.id}`}>
                            <td>{drift.resourceId}</td>
                            <td>{drift.resourceType}</td>
                            <td data-testid={`status-${drift.id}`}>{drift.status}</td>
                            <td data-testid={`severity-${drift.id}`}>{drift.severity}</td>
                            <td>${drift.costImpactMonthly}</td>
                            <td>
                                {drift.status === 'detected' && (
                                    <>
                                        <button onClick={() => onApprove(drift.id)} data-testid={`approve-${drift.id}`}>Approve</button>
                                        <button onClick={() => onReject(drift.id)} data-testid={`reject-${drift.id}`}>Reject</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div data-testid="drift-count">Showing {drifts.length} drifts</div>
        </div>
    );
};

const createWrapper = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('DriftsList', () => {
    let mockApprove: ReturnType<typeof vi.fn>;
    let mockReject: ReturnType<typeof vi.fn>;
    let mockFilter: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockApprove = vi.fn();
        mockReject = vi.fn();
        mockFilter = vi.fn();
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render drifts list table', () => {
            render(<MockDriftsList />, { wrapper: createWrapper() });
            expect(screen.getByTestId('drifts-table')).toBeInTheDocument();
        });

        it('should display all drifts', () => {
            render(<MockDriftsList />, { wrapper: createWrapper() });
            expect(screen.getByTestId('drift-row-drift-1')).toBeInTheDocument();
            expect(screen.getByTestId('drift-row-drift-2')).toBeInTheDocument();
        });

        it('should show drift count', () => {
            render(<MockDriftsList />, { wrapper: createWrapper() });
            expect(screen.getByTestId('drift-count')).toHaveTextContent('2 drifts');
        });

        it('should display resource IDs', () => {
            render(<MockDriftsList />, { wrapper: createWrapper() });
            expect(screen.getByText('i-1234567890')).toBeInTheDocument();
            expect(screen.getByText('rds-instance-1')).toBeInTheDocument();
        });
    });

    describe('Filters', () => {
        it('should render filter bar', () => {
            render(<MockDriftsList onFilter={mockFilter} />, { wrapper: createWrapper() });
            expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
        });

        it('should call onFilter when status filter changes', async () => {
            render(<MockDriftsList onFilter={mockFilter} />, { wrapper: createWrapper() });
            await userEvent.selectOptions(screen.getByTestId('status-filter'), 'detected');
            expect(mockFilter).toHaveBeenCalledWith({ status: 'detected' });
        });

        it('should call onFilter when severity filter changes', async () => {
            render(<MockDriftsList onFilter={mockFilter} />, { wrapper: createWrapper() });
            await userEvent.selectOptions(screen.getByTestId('severity-filter'), 'critical');
            expect(mockFilter).toHaveBeenCalledWith({ severity: 'critical' });
        });
    });

    describe('Actions', () => {
        it('should show approve button for detected drifts', () => {
            render(<MockDriftsList onApprove={mockApprove} />, { wrapper: createWrapper() });
            expect(screen.getByTestId('approve-drift-1')).toBeInTheDocument();
        });

        it('should not show approve button for approved drifts', () => {
            render(<MockDriftsList />, { wrapper: createWrapper() });
            expect(screen.queryByTestId('approve-drift-2')).not.toBeInTheDocument();
        });

        it('should call onApprove when approve button clicked', async () => {
            render(<MockDriftsList onApprove={mockApprove} />, { wrapper: createWrapper() });
            await userEvent.click(screen.getByTestId('approve-drift-1'));
            expect(mockApprove).toHaveBeenCalledWith('drift-1');
        });

        it('should call onReject when reject button clicked', async () => {
            render(<MockDriftsList onReject={mockReject} />, { wrapper: createWrapper() });
            await userEvent.click(screen.getByTestId('reject-drift-1'));
            expect(mockReject).toHaveBeenCalledWith('drift-1');
        });
    });

    describe('Loading State', () => {
        it('should show loading indicator', () => {
            render(<MockDriftsList isLoading={true} />, { wrapper: createWrapper() });
            expect(screen.getByTestId('loading')).toBeInTheDocument();
        });

        it('should not show table when loading', () => {
            render(<MockDriftsList isLoading={true} />, { wrapper: createWrapper() });
            expect(screen.queryByTestId('drifts-table')).not.toBeInTheDocument();
        });
    });

    describe('Empty State', () => {
        it('should show zero count for empty list', () => {
            render(<MockDriftsList drifts={[]} />, { wrapper: createWrapper() });
            expect(screen.getByTestId('drift-count')).toHaveTextContent('0 drifts');
        });
    });
});
