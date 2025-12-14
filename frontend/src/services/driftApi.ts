/**
 * Drift API service
 * 
 * This service handles all drift-related API calls.
 * In mock mode (USE_MOCK=true), it returns mock data.
 * When backend is ready, set USE_MOCK=false to use real endpoints.
 */

import { api } from './api';
import type { Drift, DriftTimelineEvent, DriftQueryParams, ApproveDriftRequest, RejectDriftRequest, DriftActionResponse } from '@/types/drift';
import type { DashboardMetrics, CostTrendDataPoint } from '@/types/metrics';
import type { PaginatedResponse } from '@/types/api';
import { API_ENDPOINTS } from '@/types/constants';

// ============================================
// Configuration
// ============================================

/** Set to false when backend is ready */
const USE_MOCK = true;

/** Simulated network delay for mock responses (ms) */
const MOCK_DELAY = {
    SHORT: 200,
    MEDIUM: 400,
    LONG: 600,
} as const;

// ============================================
// Mock Data
// ============================================

const MOCK_DRIFTS: Drift[] = [
    {
        id: '1',
        resource: 'web-server-prod-1',
        resourceType: 'ec2_instance',
        type: 'Security Group Modified',
        severity: 'critical',
        status: 'detected',
        expectedState: { port: 443, protocol: 'HTTPS' },
        actualState: { port: 80, protocol: 'HTTP' },
        difference: { port: { expected: 443, actual: 80 } },
        detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        costImpact: 1250,
        region: 'us-east-1',
        account: 'prod-123456',
    },
    {
        id: '2',
        resource: 'api-gateway-main',
        resourceType: 'lambda_function',
        type: 'Configuration Drift',
        severity: 'warning',
        status: 'pending',
        expectedState: { timeout: 30, memory: 512 },
        actualState: { timeout: 60, memory: 1024 },
        difference: { timeout: { expected: 30, actual: 60 } },
        detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        costImpact: 450,
        region: 'us-west-2',
        account: 'prod-123456',
    },
    {
        id: '3',
        resource: 'user-data-bucket',
        resourceType: 's3_bucket',
        type: 'Policy Change',
        severity: 'info',
        status: 'resolved',
        expectedState: { versioning: true },
        actualState: { versioning: true },
        difference: {},
        detectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        costImpact: 0,
        region: 'us-east-1',
        account: 'prod-123456',
    },
    {
        id: '4',
        resource: 'auth-database-primary',
        resourceType: 'rds_instance',
        type: 'Instance Type Modified',
        severity: 'critical',
        status: 'detected',
        expectedState: { instanceType: 'db.r5.large' },
        actualState: { instanceType: 'db.r5.xlarge' },
        difference: { instanceType: { expected: 'db.r5.large', actual: 'db.r5.xlarge' } },
        detectedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        costImpact: 2100,
        region: 'us-east-1',
        account: 'prod-123456',
    },
    {
        id: '5',
        resource: 'payment-processor-role',
        resourceType: 'iam_role',
        type: 'Permission Escalation',
        severity: 'critical',
        status: 'pending',
        expectedState: { hasAdminAccess: false },
        actualState: { hasAdminAccess: true },
        difference: { hasAdminAccess: { expected: false, actual: true } },
        detectedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        costImpact: 0,
        region: 'global',
        account: 'prod-123456',
    },
];

const MOCK_METRICS: DashboardMetrics = {
    totalDrifts: 47,
    criticalCount: 12,
    warningCount: 18,
    infoCount: 17,
    resolvedToday: 23,
    pendingApproval: 8,
    costSavings: 12453,
    issuesFixed: 156,
};

const generateMockCostTrend = (days: number): CostTrendDataPoint[] => {
    return Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cost: 5000 + Math.random() * 3000 + i * 50,
        savings: 200 + Math.random() * 500,
        projected: i > days - 5 ? 8500 + Math.random() * 500 : undefined,
    }));
};

// ============================================
// Helper
// ============================================

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// API Service
// ============================================

export const driftApi = {
    /**
     * Fetch paginated list of drifts
     * @param params - Query parameters for filtering and pagination
     * @returns Paginated list of drifts
     */
    async list(params: DriftQueryParams = {}): Promise<PaginatedResponse<Drift>> {
        if (USE_MOCK) {
            await delay(MOCK_DELAY.MEDIUM);

            let filtered = [...MOCK_DRIFTS];

            if (params.severity) {
                filtered = filtered.filter((d) => d.severity === params.severity);
            }
            if (params.status) {
                filtered = filtered.filter((d) => d.status === params.status);
            }
            if (params.resourceType) {
                filtered = filtered.filter((d) => d.resourceType === params.resourceType);
            }
            if (params.search) {
                const search = params.search.toLowerCase();
                filtered = filtered.filter((d) =>
                    d.resource.toLowerCase().includes(search) || d.type.toLowerCase().includes(search)
                );
            }

            // Sort
            if (params.sortBy) {
                filtered.sort((a, b) => {
                    const aVal = a[params.sortBy!];
                    const bVal = b[params.sortBy!];
                    const order = params.sortOrder === 'desc' ? -1 : 1;
                    if (typeof aVal === 'string' && typeof bVal === 'string') {
                        return aVal.localeCompare(bVal) * order;
                    }
                    return ((aVal as number) - (bVal as number)) * order;
                });
            }

            const page = params.page || 1;
            const limit = params.limit || 20;
            const start = (page - 1) * limit;
            const items = filtered.slice(start, start + limit);

            return {
                items,
                total: filtered.length,
                page,
                pageSize: limit,
                hasMore: start + limit < filtered.length,
            };
        }

        const response = await api.get<PaginatedResponse<Drift>>(API_ENDPOINTS.DRIFTS.LIST, { params });
        return response.data;
    },

    /**
     * Fetch single drift by ID
     * @param id - Drift ID
     * @returns Drift object
     * @throws Error if drift not found
     */
    async get(id: string): Promise<Drift> {
        if (USE_MOCK) {
            await delay(MOCK_DELAY.SHORT);
            const drift = MOCK_DRIFTS.find((d) => d.id === id);
            if (!drift) {
                throw new Error(`Drift with ID "${id}" not found`);
            }
            return drift;
        }

        const response = await api.get<Drift>(API_ENDPOINTS.DRIFTS.GET(id));
        return response.data;
    },

    /**
     * Approve drift remediation
     * @param id - Drift ID
     * @param request - Optional approval details
     * @returns Action response
     */
    async approve(id: string, request?: ApproveDriftRequest): Promise<DriftActionResponse> {
        if (USE_MOCK) {
            await delay(MOCK_DELAY.LONG);
            return { id, status: 'approved', message: 'Drift remediation approved' };
        }

        const response = await api.post<DriftActionResponse>(API_ENDPOINTS.DRIFTS.APPROVE(id), request);
        return response.data;
    },

    /**
     * Reject drift remediation
     * @param id - Drift ID
     * @param request - Rejection details (reason required)
     * @returns Action response
     */
    async reject(id: string, request: RejectDriftRequest): Promise<DriftActionResponse> {
        if (USE_MOCK) {
            await delay(MOCK_DELAY.LONG);
            return { id, status: 'rejected', message: 'Drift remediation rejected' };
        }

        const response = await api.post<DriftActionResponse>(API_ENDPOINTS.DRIFTS.REJECT(id), request);
        return response.data;
    },

    /**
     * Fetch dashboard metrics
     * @returns Dashboard metrics summary
     */
    async getMetrics(): Promise<DashboardMetrics> {
        if (USE_MOCK) {
            await delay(MOCK_DELAY.SHORT);
            return MOCK_METRICS;
        }

        const response = await api.get<DashboardMetrics>(API_ENDPOINTS.METRICS);
        return response.data;
    },

    /**
     * Fetch cost trend data
     * @param days - Number of days to fetch (default: 30)
     * @returns Array of cost data points
     */
    async getCostTrend(days: number = 30): Promise<CostTrendDataPoint[]> {
        if (USE_MOCK) {
            await delay(MOCK_DELAY.MEDIUM);
            return generateMockCostTrend(days);
        }

        const response = await api.get<CostTrendDataPoint[]>(API_ENDPOINTS.COST_TREND, {
            params: { days },
        });
        return response.data;
    },

    /**
     * Fetch timeline events for a drift
     * @param driftId - Drift ID
     * @returns Array of timeline events
     */
    async getTimeline(driftId: string): Promise<DriftTimelineEvent[]> {
        if (USE_MOCK) {
            await delay(MOCK_DELAY.SHORT);
            return [
                {
                    id: '1',
                    driftId,
                    action: 'detected',
                    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                    description: 'Drift detected by automated scan',
                },
                {
                    id: '2',
                    driftId,
                    action: 'escalated',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    description: 'Escalated to DevOps team',
                    user: 'system',
                },
            ];
        }

        const response = await api.get<DriftTimelineEvent[]>(API_ENDPOINTS.DRIFTS.TIMELINE(driftId));
        return response.data;
    },
};
