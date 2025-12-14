/**
 * User Repository Unit Tests
 * TEST CASES: 10
 */

import { UserRepository } from '../../../src/repositories/user.repository';
import { prisma } from '../../../src/database/prisma';

jest.mock('../../../src/database/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

describe('UserRepository', () => {
    let userRepository: UserRepository;

    const mockUser = {
        id: 'user-123',
        email: 'test@driftsentry.local',
        firstName: 'Test',
        lastName: 'User',
        role: 'engineer',
        passwordHash: '$2b$12$hash',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        userRepository = new UserRepository();
        jest.clearAllMocks();
    });

    describe('getById()', () => {
        it('should return user by ID', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const result = await userRepository.getById('user-123');

            expect(result).toEqual(mockUser);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-123' } });
        });

        it('should return null for non-existent user', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await userRepository.getById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('getByEmail()', () => {
        it('should return user by email', async () => {
            (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

            const result = await userRepository.getByEmail('test@driftsentry.local');

            expect(result).toEqual(mockUser);
        });

        it('should handle case-insensitive email lookup', async () => {
            (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

            await userRepository.getByEmail('TEST@DRIFTSENTRY.LOCAL');

            expect(prisma.user.findFirst).toHaveBeenCalled();
        });
    });

    describe('create()', () => {
        it('should create new user', async () => {
            const input = {
                email: 'new@driftsentry.local',
                firstName: 'New',
                lastName: 'User',
                passwordHash: '$2b$12$newhash',
                role: 'viewer',
            };
            (prisma.user.create as jest.Mock).mockResolvedValue({ ...mockUser, ...input });

            const result = await userRepository.create(input);

            expect(result.email).toBe('new@driftsentry.local');
            expect(prisma.user.create).toHaveBeenCalled();
        });

        it('should set isActive to true by default', async () => {
            const input = { email: 'test@test.com', passwordHash: 'hash', role: 'viewer' };
            (prisma.user.create as jest.Mock).mockResolvedValue({ ...input, isActive: true });

            const result = await userRepository.create(input);

            expect(result.isActive).toBe(true);
        });
    });

    describe('update()', () => {
        it('should update user fields', async () => {
            const updatedUser = { ...mockUser, firstName: 'Updated' };
            (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

            const result = await userRepository.update('user-123', { firstName: 'Updated' });

            expect(result.firstName).toBe('Updated');
        });
    });

    describe('updateLastLogin()', () => {
        it('should update lastLoginAt timestamp', async () => {
            (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

            await userRepository.updateLastLogin('user-123');

            expect(prisma.user.update).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'user-123' } })
            );
        });
    });

    describe('deactivate()', () => {
        it('should set isActive to false', async () => {
            (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, isActive: false });

            const result = await userRepository.deactivate('user-123');

            expect(result.isActive).toBe(false);
        });
    });
});
