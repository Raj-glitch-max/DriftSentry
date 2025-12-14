/**
 * Alert Service Unit Tests
 * Tests for alert management business logic
 * 
 * TEST CASES: 10
 */

import { AlertService } from '../../../src/services/alert.service';
import { alertRepository } from '../../../src/repositories/alert.repository';
import { NotFoundError } from '../../../src/utils/errors';

// Mock dependencies
jest.mock('../../../src/repositories/alert.repository');
jest.mock('../../../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

describe('AlertService', () => {
    let alertService: AlertService;

    const mockAlert = {
        id: 'alert-123',
        driftId: 'drift-456',
        type: 'drift_detected',
        severity: 'critical',
        title: 'Critical drift detected',
        message: 'A critical drift was detected',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        alertService = new AlertService();
        jest.clearAllMocks();
    });

    describe('createAlert()', () => {
        // TEST CASE 1: Create alert successfully
        it('should create alert with valid input', async () => {
            (alertRepository.create as jest.Mock).mockResolvedValue(mockAlert);

            const result = await alertService.createAlert({
                driftId: 'drift-456',
                type: 'drift_detected',
                severity: 'critical',
                title: 'Critical drift',
                message: 'A drift was detected',
            });

            expect(result.id).toBe('alert-123');
            expect(alertRepository.create).toHaveBeenCalled();
        });

        // TEST CASE 2: Handle create failure
        it('should throw error on repository failure', async () => {
            (alertRepository.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

            await expect(
                alertService.createAlert({
                    driftId: 'drift-456',
                    type: 'drift_detected',
                    severity: 'critical',
                    title: 'Test',
                    message: 'Test',
                })
            ).rejects.toThrow('DB Error');
        });
    });

    describe('listAlerts()', () => {
        // TEST CASE 3: List alerts with pagination
        it('should return paginated alerts', async () => {
            (alertRepository.list as jest.Mock).mockResolvedValue({
                items: [mockAlert],
                total: 25,
            });

            const result = await alertService.listAlerts({ page: 1, limit: 10 });

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(25);
            expect(result.totalPages).toBe(3);
            expect(result.hasMore).toBe(true);
        });

        // TEST CASE 4: Empty list returns proper structure
        it('should return empty array when no alerts', async () => {
            (alertRepository.list as jest.Mock).mockResolvedValue({
                items: [],
                total: 0,
            });

            const result = await alertService.listAlerts({ page: 1, limit: 10 });

            expect(result.items).toEqual([]);
            expect(result.total).toBe(0);
            expect(result.hasMore).toBe(false);
        });
    });

    describe('getAlert()', () => {
        // TEST CASE 5: Get existing alert
        it('should return alert for valid ID', async () => {
            (alertRepository.getById as jest.Mock).mockResolvedValue(mockAlert);

            const result = await alertService.getAlert('alert-123');

            expect(result.id).toBe('alert-123');
        });

        // TEST CASE 6: Non-existent alert throws NotFoundError
        it('should throw NotFoundError for non-existent alert', async () => {
            (alertRepository.getById as jest.Mock).mockResolvedValue(null);

            await expect(alertService.getAlert('nonexistent')).rejects.toThrow(NotFoundError);
        });
    });

    describe('markAsRead()', () => {
        // TEST CASE 7: Mark alert as read
        it('should mark alert as read', async () => {
            const readAlert = { ...mockAlert, isRead: true };
            (alertRepository.markAsRead as jest.Mock).mockResolvedValue(readAlert);

            const result = await alertService.markAsRead('alert-123', 'user-456');

            expect(result.isRead).toBe(true);
            expect(alertRepository.markAsRead).toHaveBeenCalledWith('alert-123', 'user-456');
        });
    });

    describe('markAlertsByDriftAsResolved()', () => {
        // TEST CASE 8: Mark all drift alerts as resolved
        it('should mark all alerts for drift as resolved', async () => {
            (alertRepository.markAllByDriftAsRead as jest.Mock).mockResolvedValue(5);

            const count = await alertService.markAlertsByDriftAsResolved('drift-123');

            expect(count).toBe(5);
            expect(alertRepository.markAllByDriftAsRead).toHaveBeenCalledWith('drift-123', 'system');
        });

        // TEST CASE 9: Handle failure gracefully
        it('should return 0 on failure without throwing', async () => {
            (alertRepository.markAllByDriftAsRead as jest.Mock).mockRejectedValue(new Error('DB Error'));

            const count = await alertService.markAlertsByDriftAsResolved('drift-123');

            expect(count).toBe(0);
        });
    });

    describe('getUnreadCount()', () => {
        // TEST CASE 10: Get unread count
        it('should return unread alert count', async () => {
            (alertRepository.getUnreadCount as jest.Mock).mockResolvedValue(15);

            const count = await alertService.getUnreadCount();

            expect(count).toBe(15);
        });
    });
});
