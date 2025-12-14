/**
 * Drift Service Unit Tests
 * Tests for drift lifecycle management
 * 
 * TEST CASES: 20
 * Coverage Target: 95%+
 */

import { DriftService } from '../../../src/services/drift.service';
import { driftRepository } from '../../../src/repositories/drift.repository';
import { auditService } from '../../../src/services/audit.service';
import { alertService } from '../../../src/services/alert.service';
import * as wsEvents from '../../../src/websocket/events';
import { ValidationError, ConflictError, NotFoundError } from '../../../src/utils/errors';

// Mock dependencies
jest.mock('../../../src/repositories/drift.repository');
jest.mock('../../../src/services/audit.service');
jest.mock('../../../src/services/alert.service');
jest.mock('../../../src/websocket/events');
jest.mock('../../../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

describe('DriftService', () => {
    let driftService: DriftService;

    const mockDrift = {
        id: 'drift-123',
        resourceId: 'i-1234567890abcdef0',
        resourceType: 'EC2',
        region: 'us-east-1',
        accountId: '123456789012',
        status: 'detected',
        severity: 'warning',
        expectedState: { tags: { Environment: 'staging' } },
        actualState: { tags: { Environment: 'production' } },
        costImpactMonthly: 150.0,
        detectedBy: 'scheduler',
        detectedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        driftService = new DriftService();
        jest.clearAllMocks();
    });

    describe('createDrift()', () => {
        const validInput = {
            resourceId: 'i-1234567890abcdef0',
            resourceType: 'EC2' as const,
            region: 'us-east-1',
            accountId: '123456789012',
            expectedState: { tags: { Environment: 'staging' } },
            actualState: { tags: { Environment: 'production' } },
            severity: 'warning' as const,
            costImpactMonthly: 150.0,
            detectedBy: 'scheduler' as const,
        };

        // TEST CASE 1: Successfully create drift
        it('should create drift with valid input', async () => {
            (driftRepository.findRecentDuplicate as jest.Mock).mockResolvedValue(null);
            (driftRepository.create as jest.Mock).mockResolvedValue(mockDrift);
            (auditService.log as jest.Mock).mockResolvedValue(undefined);

            const result = await driftService.createDrift(validInput, 'user-123');

            expect(result).toEqual(mockDrift);
            expect(driftRepository.create).toHaveBeenCalled();
            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'drift_created' })
            );
            expect(wsEvents.emitDriftCreated).toHaveBeenCalledWith(mockDrift);
        });

        // TEST CASE 2: Create critical drift creates alert
        it('should create alert for critical severity drift', async () => {
            const criticalInput = { ...validInput, severity: 'critical' as const };
            const criticalDrift = { ...mockDrift, severity: 'critical' };

            (driftRepository.findRecentDuplicate as jest.Mock).mockResolvedValue(null);
            (driftRepository.create as jest.Mock).mockResolvedValue(criticalDrift);
            (auditService.log as jest.Mock).mockResolvedValue(undefined);
            (alertService.createAlert as jest.Mock).mockResolvedValue(undefined);

            await driftService.createDrift(criticalInput, 'user-123');

            expect(alertService.createAlert).toHaveBeenCalledWith(
                expect.objectContaining({ severity: 'critical' })
            );
        });

        // TEST CASE 3: Reject duplicate drifts
        it('should reject duplicate drift within 60 minutes', async () => {
            (driftRepository.findRecentDuplicate as jest.Mock).mockResolvedValue(mockDrift);

            await expect(driftService.createDrift(validInput)).rejects.toThrow(ConflictError);
            await expect(driftService.createDrift(validInput)).rejects.toThrow('Similar drift detected');
        });

        // TEST CASE 4: Validate identical states rejected
        it('should reject when expected and actual states are identical', async () => {
            const identicalInput = {
                ...validInput,
                expectedState: { tags: { Environment: 'prod' } },
                actualState: { tags: { Environment: 'prod' } },
            };

            await expect(driftService.createDrift(identicalInput)).rejects.toThrow(ValidationError);
            await expect(driftService.createDrift(identicalInput)).rejects.toThrow('not a drift');
        });

        // TEST CASE 5: Reject negative cost impact
        it('should reject negative cost impact', async () => {
            const negativeCostInput = { ...validInput, costImpactMonthly: -100 };

            await expect(driftService.createDrift(negativeCostInput as any)).rejects.toThrow(ValidationError);
            await expect(driftService.createDrift(negativeCostInput as any)).rejects.toThrow('cannot be negative');
        });

        // TEST CASE 6: Reject invalid resource type
        it('should reject unsupported resource type', async () => {
            const invalidInput = { ...validInput, resourceType: 'INVALID_TYPE' as any };

            await expect(driftService.createDrift(invalidInput)).rejects.toThrow(ValidationError);
            await expect(driftService.createDrift(invalidInput)).rejects.toThrow('Unsupported resource type');
        });
    });

    describe('getDrift()', () => {
        // TEST CASE 7: Get existing drift
        it('should return drift with metadata for valid ID', async () => {
            (driftRepository.getById as jest.Mock).mockResolvedValue(mockDrift);
            (alertService.countByDrift as jest.Mock).mockResolvedValue(3);

            const result = await driftService.getDrift('drift-123');

            expect(result.id).toBe('drift-123');
            expect(result.alertCount).toBe(3);
            expect(result.canApprove).toBe(true);
            expect(result.canReject).toBe(true);
        });

        // TEST CASE 8: Non-existent drift throws NotFoundError
        it('should throw NotFoundError for non-existent drift', async () => {
            (driftRepository.getById as jest.Mock).mockResolvedValue(null);

            await expect(driftService.getDrift('nonexistent')).rejects.toThrow(NotFoundError);
            await expect(driftService.getDrift('nonexistent')).rejects.toThrow('not found');
        });

        // TEST CASE 9: Approved drift cannot be re-approved
        it('should return canApprove:false for approved drift', async () => {
            const approvedDrift = { ...mockDrift, status: 'approved' };
            (driftRepository.getById as jest.Mock).mockResolvedValue(approvedDrift);
            (alertService.countByDrift as jest.Mock).mockResolvedValue(0);

            const result = await driftService.getDrift('drift-123');

            expect(result.canApprove).toBe(false);
            expect(result.canReject).toBe(false);
        });
    });

    describe('listDrifts()', () => {
        // TEST CASE 10: List drifts with pagination
        it('should return paginated drifts with metadata', async () => {
            const mockItems = [mockDrift, { ...mockDrift, id: 'drift-456' }];
            (driftRepository.list as jest.Mock).mockResolvedValue({
                items: mockItems,
                total: 47,
            });

            const result = await driftService.listDrifts({ page: 1, limit: 10 });

            expect(result.items).toHaveLength(2);
            expect(result.total).toBe(47);
            expect(result.page).toBe(1);
            expect(result.pageSize).toBe(10);
            expect(result.totalPages).toBe(5);
            expect(result.hasMore).toBe(true);
        });

        // TEST CASE 11: Invalid page number throws error
        it('should throw ValidationError for page < 1', async () => {
            await expect(driftService.listDrifts({ page: 0, limit: 10 })).rejects.toThrow(ValidationError);
        });

        // TEST CASE 12: Invalid limit throws error
        it('should throw ValidationError for limit > 100', async () => {
            await expect(driftService.listDrifts({ page: 1, limit: 200 })).rejects.toThrow(ValidationError);
        });

        // TEST CASE 13: Empty result returns proper structure
        it('should return empty array when no drifts match', async () => {
            (driftRepository.list as jest.Mock).mockResolvedValue({
                items: [],
                total: 0,
            });

            const result = await driftService.listDrifts({ page: 1, limit: 10 });

            expect(result.items).toEqual([]);
            expect(result.total).toBe(0);
            expect(result.totalPages).toBe(0);
            expect(result.hasMore).toBe(false);
        });
    });

    describe('approveDrift()', () => {
        // TEST CASE 14: Successfully approve drift
        it('should approve drift and emit event', async () => {
            (driftRepository.getById as jest.Mock).mockResolvedValue(mockDrift);
            (driftRepository.approve as jest.Mock).mockResolvedValue({
                ...mockDrift,
                status: 'approved',
            });
            (auditService.log as jest.Mock).mockResolvedValue(undefined);
            (alertService.markAlertsByDriftAsResolved as jest.Mock).mockResolvedValue(undefined);

            const result = await driftService.approveDrift(
                'drift-123',
                { reason: 'Approved as expected' },
                'user-456'
            );

            expect(result.status).toBe('approved');
            expect(wsEvents.emitDriftApproved).toHaveBeenCalled();
            expect(alertService.markAlertsByDriftAsResolved).toHaveBeenCalledWith('drift-123');
        });

        // TEST CASE 15: Cannot approve non-existent drift
        it('should throw NotFoundError for non-existent drift', async () => {
            (driftRepository.getById as jest.Mock).mockResolvedValue(null);

            await expect(
                driftService.approveDrift('nonexistent', { reason: 'test' })
            ).rejects.toThrow(NotFoundError);
        });

        // TEST CASE 16: Cannot approve already approved drift
        it('should throw ConflictError for already approved drift', async () => {
            const approvedDrift = { ...mockDrift, status: 'approved' };
            (driftRepository.getById as jest.Mock).mockResolvedValue(approvedDrift);

            await expect(
                driftService.approveDrift('drift-123', { reason: 'test' })
            ).rejects.toThrow(ConflictError);
        });
    });

    describe('rejectDrift()', () => {
        // TEST CASE 17: Successfully reject drift
        it('should reject drift with reason', async () => {
            (driftRepository.getById as jest.Mock).mockResolvedValue(mockDrift);
            (driftRepository.reject as jest.Mock).mockResolvedValue({
                ...mockDrift,
                status: 'rejected',
            });
            (auditService.log as jest.Mock).mockResolvedValue(undefined);

            const result = await driftService.rejectDrift('drift-123', 'Not applicable', 'user-456');

            expect(result.status).toBe('rejected');
            expect(wsEvents.emitDriftRejected).toHaveBeenCalled();
        });

        // TEST CASE 18: Cannot reject non-existent drift
        it('should throw NotFoundError for non-existent drift', async () => {
            (driftRepository.getById as jest.Mock).mockResolvedValue(null);

            await expect(driftService.rejectDrift('nonexistent', 'reason')).rejects.toThrow(NotFoundError);
        });

        // TEST CASE 19: Cannot reject already rejected drift
        it('should throw ConflictError for already rejected drift', async () => {
            const rejectedDrift = { ...mockDrift, status: 'rejected' };
            (driftRepository.getById as jest.Mock).mockResolvedValue(rejectedDrift);

            await expect(driftService.rejectDrift('drift-123', 'reason')).rejects.toThrow(ConflictError);
        });
    });

    describe('countByStatus() / countBySeverity()', () => {
        // TEST CASE 20: Count methods delegate to repository
        it('should return status counts from repository', async () => {
            const mockCounts = { detected: 10, approved: 5, rejected: 2 };
            (driftRepository.countByStatus as jest.Mock).mockResolvedValue(mockCounts);

            const result = await driftService.countByStatus();

            expect(result).toEqual(mockCounts);
        });

        it('should return severity counts from repository', async () => {
            const mockCounts = { critical: 3, high: 7, medium: 12 };
            (driftRepository.countBySeverity as jest.Mock).mockResolvedValue(mockCounts);

            const result = await driftService.countBySeverity();

            expect(result).toEqual(mockCounts);
        });
    });
});
