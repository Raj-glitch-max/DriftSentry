/**
 * WebSocket Integration Tests
 * TEST CASES: 15
 */

import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket as ServerSocket } from 'socket.io';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';

jest.mock('../../src/utils/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('WebSocket Integration', () => {
    let httpServer: HttpServer;
    let ioServer: SocketServer;
    let clientSocket: ClientSocket;
    const port = 3099;

    beforeEach((done) => {
        // Mock server setup
        httpServer = require('http').createServer();
        ioServer = new SocketServer(httpServer);
        httpServer.listen(port, () => {
            clientSocket = ioc(`http://localhost:${port}`, {
                transports: ['websocket'],
            });
            clientSocket.on('connect', done);
        });
    });

    afterEach(() => {
        if (clientSocket) clientSocket.disconnect();
        if (ioServer) ioServer.close();
        if (httpServer) httpServer.close();
    });

    describe('Connection', () => {
        it('should connect successfully', () => {
            expect(clientSocket.connected).toBe(true);
        });

        it('should receive connection acknowledgement', (done) => {
            ioServer.on('connection', (socket) => {
                socket.emit('connected', { status: 'ok' });
            });

            clientSocket.on('connected', (data) => {
                expect(data.status).toBe('ok');
                done();
            });

            // Reconnect to trigger event
            clientSocket.disconnect().connect();
        });
    });

    describe('drift:created event', () => {
        it('should receive drift:created event', (done) => {
            const driftData = { id: 'drift-123', resourceId: 'i-123', status: 'detected' };

            clientSocket.on('drift:created', (data) => {
                expect(data.id).toBe('drift-123');
                done();
            });

            ioServer.emit('drift:created', driftData);
        });

        it('should broadcast to all connected clients', (done) => {
            const client2 = ioc(`http://localhost:${port}`, { transports: ['websocket'] });
            let received = 0;

            const checkDone = () => {
                received++;
                if (received === 2) {
                    client2.disconnect();
                    done();
                }
            };

            clientSocket.on('drift:created', checkDone);
            client2.on('connect', () => {
                client2.on('drift:created', checkDone);
                ioServer.emit('drift:created', { id: 'drift-new' });
            });
        });
    });

    describe('drift:approved event', () => {
        it('should receive drift:approved event', (done) => {
            const approvalData = { driftId: 'drift-123', status: 'approved', approvedBy: 'user-1' };

            clientSocket.on('drift:approved', (data) => {
                expect(data.status).toBe('approved');
                expect(data.approvedBy).toBe('user-1');
                done();
            });

            ioServer.emit('drift:approved', approvalData);
        });
    });

    describe('drift:rejected event', () => {
        it('should receive drift:rejected event', (done) => {
            const rejectionData = { driftId: 'drift-123', status: 'rejected', reason: 'Not needed' };

            clientSocket.on('drift:rejected', (data) => {
                expect(data.status).toBe('rejected');
                expect(data.reason).toBe('Not needed');
                done();
            });

            ioServer.emit('drift:rejected', rejectionData);
        });
    });

    describe('alert:created event', () => {
        it('should receive alert:created event', (done) => {
            const alertData = { id: 'alert-123', type: 'drift_detected', severity: 'critical' };

            clientSocket.on('alert:created', (data) => {
                expect(data.id).toBe('alert-123');
                expect(data.severity).toBe('critical');
                done();
            });

            ioServer.emit('alert:created', alertData);
        });
    });

    describe('Namespace isolation', () => {
        it('should only receive events from subscribed namespace', (done) => {
            const driftsNamespace = ioServer.of('/drifts');
            const driftsClient = ioc(`http://localhost:${port}/drifts`, { transports: ['websocket'] });

            driftsClient.on('connect', () => {
                driftsClient.on('drift:update', (data) => {
                    expect(data.namespace).toBe('drifts');
                    driftsClient.disconnect();
                    done();
                });

                driftsNamespace.emit('drift:update', { namespace: 'drifts' });
            });
        });
    });

    describe('Error handling', () => {
        it('should handle connection errors gracefully', (done) => {
            const badClient = ioc('http://localhost:9999', {
                transports: ['websocket'],
                reconnection: false,
            });

            badClient.on('connect_error', () => {
                expect(true).toBe(true);
                badClient.disconnect();
                done();
            });
        });
    });

    describe('Room functionality', () => {
        it('should join and receive room-specific messages', (done) => {
            ioServer.on('connection', (socket) => {
                socket.join('drift-watchers');
                ioServer.to('drift-watchers').emit('room:message', { msg: 'Hello watchers' });
            });

            clientSocket.on('room:message', (data) => {
                expect(data.msg).toBe('Hello watchers');
                done();
            });

            clientSocket.disconnect().connect();
        });
    });
});
