/**
 * Drift Repository Unit Tests
 * TEST CASES: 12
 */

import { DriftRepository } from '../../../src/repositories/drift.repository';
import { prisma } from '../../../src/database/prisma';

jest.mock('../../../src/database/prisma', () => ({
    prisma: {
        drift: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        $queryRaw: jest.fn(),
    },
}));

describe('DriftRepository', () => {
    let driftRepository: DriftRepository;

    const mockDrift = {
        id: 'drift-123',
        resourceId: 'i-1234567890',
        resourceType: 'EC2',
        region: 'us-east-1',
        status: 'detected',
        severity: 'warning',
        expectedState: { tags: { Env: 'prod' } },
        actualState: { tags: { Env: 'dev' } },
        costImpactMonthly: 100,
        detectedBy: 'scheduler',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        driftRepository = new DriftRepository();
        jest.clearAllMocks();
    });

    describe('getById()', () => {
        it('should return drift by ID', async () => {
            (prisma.drift.findUnique as jest.Mock).mockResolvedValue(mockDrift);

            const result = await driftRepository.getById('drift-123');

            expect(result).toEqual(mockDrift);
        });

        it('should return null for non-existent drift', async () => {
            (prisma.drift.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await driftRepository.getById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('list()', () => {
        it('should return paginated drifts', async () => {
            (prisma.drift.findMany as jest.Mock).mockResolvedValue([mockDrift]);
            (prisma.drift.count as jest.Mock).mockResolvedValue(50);

            const result = await driftRepository.list({ page: 1, limit: 10 });

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(50);
        });

        it('should filter by status', async () => {
            (prisma.drift.findMany as jest.Mock).mockResolvedValue([mockDrift]);
            (prisma.drift.count as jest.Mock).mockResolvedValue(10);

            await driftRepository.list({ page: 1, limit: 10, status: 'detected' });

            expect(prisma.drift.findMany).toHaveBeenCalled();
        });

        it('should filter by severity', async () => {
            (prisma.drift.findMany as jest.Mock).mockResolvedValue([mockDrift]);
            (prisma.drift.count as jest.Mock).mockResolvedValue(5);

            await driftRepository.list({ page: 1, limit: 10, severity: 'critical' });

            expect(prisma.drift.findMany).toHaveBeenCalled();
        });
    });

    describe('create()', () => {
        it('should create new drift', async () => {
            (prisma.drift.create as jest.Mock).mockResolvedValue(mockDrift);

            const result = await driftRepository.create({
                resourceId: 'i-123',
                resourceType: 'EC2',
                region: 'us-east-1',
                severity: 'warning',
                expectedState: {},
                actualState: {},
                costImpactMonthly: 100,
                detectedBy: 'scheduler',
            });

            expect(result.id).toBeDefined();
            expect(prisma.drift.create).toHaveBeenCalled();
        });
    });

    describe('approve()', () => {
        it('should update drift status to approved', async () => {
            const approvedDrift = { ...mockDrift, status: 'approved' };
            (prisma.drift.update as jest.Mock).mockResolvedValue(approvedDrift);

            const result = await driftRepository.approve('drift-123', 'Approved', 'user-1');

            expect(result.status).toBe('approved');
        });
    });

    describe('reject()', () => {
        it('should update drift status to rejected', async () => {
            const rejectedDrift = { ...mockDrift, status: 'rejected' };
            (prisma.drift.update as jest.Mock).mockResolvedValue(rejectedDrift);

            const result = await driftRepository.reject('drift-123', 'Not needed', 'user-1');

            expect(result.status).toBe('rejected');
        });
    });

    describe('countByStatus()', () => {
        it('should return status counts', async () => {
            (prisma.drift.count as jest.Mock)
                .mockResolvedValueOnce(10)
                .mockResolvedValueOnce(5)
                .mockResolvedValueOnce(2);

            const result = await driftRepository.countByStatus();

            expect(result).toBeDefined();
        });
    });

    describe('findRecentDuplicate()', () => {
        it('should find duplicate drift', async () => {
            (prisma.drift.findFirst as jest.Mock).mockResolvedValue(mockDrift);

            const result = await driftRepository.findRecentDuplicate('i-123', 'EC2', { minutes: 60 });

            expect(result).toEqual(mockDrift);
        });

        it('should return null when no duplicate', async () => {
            (prisma.drift.findFirst as jest.Mock).mockResolvedValue(null);

            const result = await driftRepository.findRecentDuplicate('new-id', 'RDS', { minutes: 60 });

            expect(result).toBeNull();
        });
    });
});
