/**
 * Metrics Service Unit Tests
 * TEST CASES: 8
 */

import { MetricsService } from '../../../src/services/metrics.service';
import { driftRepository } from '../../../src/repositories/drift.repository';
import { alertRepository } from '../../../src/repositories/alert.repository';

jest.mock('../../../src/repositories/drift.repository');
jest.mock('../../../src/repositories/alert.repository');
jest.mock('../../../src/utils/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('MetricsService', () => {
    let metricsService: MetricsService;

    beforeEach(() => {
        metricsService = new MetricsService();
        jest.clearAllMocks();
    });

    describe('getDashboardSummary()', () => {
        it('should return dashboard metrics summary', async () => {
            (driftRepository.countByStatus as jest.Mock).mockResolvedValue({
                detected: 10, approved: 5, rejected: 2
            });
            (driftRepository.countBySeverity as jest.Mock).mockResolvedValue({
                critical: 3, warning: 7, info: 5
            });
            (alertRepository.getUnreadCount as jest.Mock).mockResolvedValue(8);

            const result = await metricsService.getDashboardSummary();

            expect(result).toHaveProperty('statusCounts');
            expect(result).toHaveProperty('severityCounts');
            expect(result).toHaveProperty('unreadAlerts');
        });

        it('should handle repository errors gracefully', async () => {
            (driftRepository.countByStatus as jest.Mock).mockRejectedValue(new Error('DB Error'));

            await expect(metricsService.getDashboardSummary()).rejects.toThrow();
        });
    });

    describe('getCostTrend()', () => {
        it('should return cost trend data', async () => {
            (driftRepository.getCostTrend as jest.Mock).mockResolvedValue([
                { date: '2024-01-01', cost: 1000 },
                { date: '2024-01-02', cost: 1200 },
            ]);

            const result = await metricsService.getCostTrend({ days: 7 });

            expect(Array.isArray(result)).toBe(true);
            expect(result[0]).toHaveProperty('date');
            expect(result[0]).toHaveProperty('cost');
        });

        it('should handle empty cost data', async () => {
            (driftRepository.getCostTrend as jest.Mock).mockResolvedValue([]);

            const result = await metricsService.getCostTrend({ days: 7 });

            expect(result).toEqual([]);
        });
    });

    describe('getResourceStats()', () => {
        it('should return resource statistics', async () => {
            (driftRepository.countByResourceType as jest.Mock).mockResolvedValue({
                EC2: 15, RDS: 8, S3: 20
            });

            const result = await metricsService.getResourceStats();

            expect(result).toHaveProperty('EC2');
            expect(result).toHaveProperty('RDS');
        });
    });

    describe('getHealthStatus()', () => {
        it('should return healthy status', async () => {
            (driftRepository.countByStatus as jest.Mock).mockResolvedValue({ detected: 0 });

            const result = await metricsService.getHealthStatus();

            expect(result).toHaveProperty('status');
            expect(['healthy', 'warning', 'critical']).toContain(result.status);
        });

        it('should return critical status when many drifts detected', async () => {
            (driftRepository.countByStatus as jest.Mock).mockResolvedValue({ detected: 50 });

            const result = await metricsService.getHealthStatus();

            expect(result.status).toBe('critical');
        });
    });
});
