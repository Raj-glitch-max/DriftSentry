/**
 * Drifts Routes Integration Tests
 * TEST CASES: 20
 */

import request from 'supertest';
import { app } from '../../src/app';
import { driftRepository } from '../../src/repositories/drift.repository';
import { alertService } from '../../src/services/alert.service';
import { auditService } from '../../src/services/audit.service';
import * as jwtUtils from '../../src/utils/jwt';
import * as wsEvents from '../../src/websocket/events';

jest.mock('../../src/repositories/drift.repository');
jest.mock('../../src/services/alert.service');
jest.mock('../../src/services/audit.service');
jest.mock('../../src/utils/jwt');
jest.mock('../../src/websocket/events');
jest.mock('../../src/utils/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

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

const mockToken = { userId: 'user-123', email: 'test@test.com', role: 'engineer' };

describe('Drifts Routes Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockToken);
    });

    describe('GET /api/v1/drifts', () => {
        it('should return 200 with paginated drifts', async () => {
            (driftRepository.list as jest.Mock).mockResolvedValue({
                items: [mockDrift],
                total: 50,
            });

            const res = await request(app)
                .get('/api/v1/drifts?page=1&limit=10')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('items');
            expect(res.body).toHaveProperty('total');
        });

        it('should return 401 without auth token', async () => {
            const res = await request(app).get('/api/v1/drifts');

            expect(res.status).toBe(401);
        });

        it('should filter by status', async () => {
            (driftRepository.list as jest.Mock).mockResolvedValue({ items: [mockDrift], total: 10 });

            const res = await request(app)
                .get('/api/v1/drifts?status=detected')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(driftRepository.list).toHaveBeenCalled();
        });

        it('should filter by severity', async () => {
            (driftRepository.list as jest.Mock).mockResolvedValue({ items: [], total: 0 });

            const res = await request(app)
                .get('/api/v1/drifts?severity=critical')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
        });

        it('should handle pagination parameters', async () => {
            (driftRepository.list as jest.Mock).mockResolvedValue({ items: [], total: 100 });

            const res = await request(app)
                .get('/api/v1/drifts?page=5&limit=20')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/v1/drifts/:id', () => {
        it('should return 200 with drift details', async () => {
            (driftRepository.getById as jest.Mock).mockResolvedValue(mockDrift);
            (alertService.countByDrift as jest.Mock).mockResolvedValue(3);

            const res = await request(app)
                .get('/api/v1/drifts/drift-123')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.id).toBe('drift-123');
        });

        it('should return 404 for non-existent drift', async () => {
            (driftRepository.getById as jest.Mock).mockResolvedValue(null);

            const res = await request(app)
                .get('/api/v1/drifts/nonexistent')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(404);
        });
    });

    describe('POST /api/v1/drifts/:id/approve', () => {
        it('should return 200 when approved', async () => {
            (driftRepository.getById as jest.Mock).mockResolvedValue(mockDrift);
            (driftRepository.approve as jest.Mock).mockResolvedValue({ ...mockDrift, status: 'approved' });
            (auditService.log as jest.Mock).mockResolvedValue(undefined);
            (alertService.markAlertsByDriftAsResolved as jest.Mock).mockResolvedValue(1);

            const res = await request(app)
                .post('/api/v1/drifts/drift-123/approve')
                .set('Authorization', 'Bearer valid-token')
                .send({ reason: 'Approved as expected configuration' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('approved');
        });

        it('should return 403 for viewer role', async () => {
            (jwtUtils.verifyToken as jest.Mock).mockReturnValue({ ...mockToken, role: 'viewer' });

            const res = await request(app)
                .post('/api/v1/drifts/drift-123/approve')
                .set('Authorization', 'Bearer valid-token')
                .send({ reason: 'Test' });

            expect(res.status).toBe(403);
        });

        it('should return 404 for non-existent drift', async () => {
            (driftRepository.getById as jest.Mock).mockResolvedValue(null);

            const res = await request(app)
                .post('/api/v1/drifts/nonexistent/approve')
                .set('Authorization', 'Bearer valid-token')
                .send({ reason: 'Test' });

            expect(res.status).toBe(404);
        });

        it('should return 409 for already approved drift', async () => {
            (driftRepository.getById as jest.Mock).mockResolvedValue({ ...mockDrift, status: 'approved' });

            const res = await request(app)
                .post('/api/v1/drifts/drift-123/approve')
                .set('Authorization', 'Bearer valid-token')
                .send({ reason: 'Test' });

            expect(res.status).toBe(409);
        });
    });

    describe('POST /api/v1/drifts/:id/reject', () => {
        it('should return 200 when rejected', async () => {
            (driftRepository.getById as jest.Mock).mockResolvedValue(mockDrift);
            (driftRepository.reject as jest.Mock).mockResolvedValue({ ...mockDrift, status: 'rejected' });
            (auditService.log as jest.Mock).mockResolvedValue(undefined);

            const res = await request(app)
                .post('/api/v1/drifts/drift-123/reject')
                .set('Authorization', 'Bearer valid-token')
                .send({ reason: 'Not applicable to this environment' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('rejected');
        });

        it('should return 400 without reason', async () => {
            const res = await request(app)
                .post('/api/v1/drifts/drift-123/reject')
                .set('Authorization', 'Bearer valid-token')
                .send({});

            expect(res.status).toBe(400);
        });

        it('should return 404 for non-existent drift', async () => {
            (driftRepository.getById as jest.Mock).mockResolvedValue(null);

            const res = await request(app)
                .post('/api/v1/drifts/nonexistent/reject')
                .set('Authorization', 'Bearer valid-token')
                .send({ reason: 'Test rejection' });

            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/v1/drifts/summary', () => {
        it('should return drift summary statistics', async () => {
            (driftRepository.countByStatus as jest.Mock).mockResolvedValue({ detected: 10, approved: 5 });
            (driftRepository.countBySeverity as jest.Mock).mockResolvedValue({ critical: 2, warning: 8 });

            const res = await request(app)
                .get('/api/v1/drifts/summary')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
        });
    });
});
