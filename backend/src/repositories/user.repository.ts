/**
 * User Repository
 * Data access layer for User entity
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';
import { BaseRepository, type BaseFilters } from './base.repository';
import type {
    User,
    UserPublic,
    UserSettings,
    CreateUserInput,
    UpdateUserInput,
    UserRole,
} from '../types/domain/user';
import type { PaginatedResult } from '../types/api/responses';
import { DatabaseError, NotFoundError, ConflictError, ValidationError } from '../utils/errors';

/**
 * User list filters
 */
interface UserFilters extends BaseFilters {
    role?: UserRole | 'all';
    isActive?: boolean;
}

/**
 * UserRepository
 * All database access for User entity
 *
 * Contract:
 * - Never returns Prisma models directly
 * - Always transforms to domain types
 * - Never exposes password hash in most operations
 * - All methods are async
 * - Always handles errors
 */
export class UserRepository extends BaseRepository<User, UserFilters, UserPublic> {
    constructor() {
        super('User');
    }

    /**
     * Create new user
     */
    async create(input: CreateUserInput, passwordHash: string): Promise<User> {
        try {
            // Check if email already exists
            const existing = await prisma.user.findUnique({
                where: { email: input.email.toLowerCase() },
            });

            if (existing) {
                throw new ConflictError(`User with email ${input.email} already exists`);
            }

            // Create user with associated account (multi-tenancy)
            const accountName = input.email.split('@')[0] + '\'s Account';
            const accountSlug = input.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');

            const result = await prisma.user.create({
                data: {
                    email: input.email.toLowerCase(),
                    passwordHash,
                    firstName: input.firstName,
                    lastName: input.lastName,
                    role: input.role ?? 'viewer',
                    account: {
                        create: {
                            name: accountName,
                            slug: accountSlug,
                        },
                    },
                },
            });

            this.logSuccess('create', { userId: result.id, email: result.email });
            return this.toDomain(result);
        } catch (error) {
            if (error instanceof ConflictError) throw error;
            this.logError('create', error, { email: input.email });
            throw new DatabaseError(`Failed to create user: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get user by ID
     */
    async getById(id: string): Promise<User | null> {
        try {
            const result = await prisma.user.findUnique({
                where: { id },
            });

            if (result) {
                this.logSuccess('getById', { userId: id });
            }
            return result ? this.toDomain(result) : null;
        } catch (error) {
            this.logError('getById', error, { userId: id });
            throw new DatabaseError(`Failed to get user: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get user by ID or throw NotFoundError
     */
    async getByIdOrThrow(id: string): Promise<User> {
        const user = await this.getById(id);
        if (!user) {
            throw new NotFoundError(`User ${id} not found`);
        }
        return user;
    }

    /**
     * Get user by email
     */
    async getByEmail(email: string): Promise<User | null> {
        try {
            const result = await prisma.user.findUnique({
                where: { email: email.toLowerCase() },
            });

            if (result) {
                this.logSuccess('getByEmail', { email });
            }
            return result ? this.toDomain(result) : null;
        } catch (error) {
            this.logError('getByEmail', error, { email });
            throw new DatabaseError(`Failed to get user: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * List users with pagination
     */
    async list(filters: UserFilters): Promise<PaginatedResult<UserPublic>> {
        try {
            if (!this.validatePagination(filters.page, filters.limit)) {
                throw new ValidationError('Invalid pagination parameters');
            }

            const where: Prisma.UserWhereInput = {};

            if (filters.role && filters.role !== 'all') {
                where.role = filters.role;
            }
            if (filters.isActive !== undefined) {
                where.isActive = filters.isActive;
            }

            const total = await prisma.user.count({ where });

            const results = await prisma.user.findMany({
                where,
                skip: this.calculateOffset(filters.page, filters.limit),
                take: filters.limit,
                orderBy: { createdAt: 'desc' },
            });

            this.logSuccess('list', { count: results.length, total });

            return {
                items: results.map((r) => this.toPublicDomain(r)),
                total,
            };
        } catch (error) {
            if (error instanceof ValidationError) throw error;
            this.logError('list', error, { filters });
            throw new DatabaseError(`Failed to list users: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update user profile
     */
    async update(id: string, input: UpdateUserInput): Promise<User> {
        try {
            const result = await prisma.user.update({
                where: { id },
                data: input,
            });

            this.logSuccess('update', { userId: id });
            return this.toDomain(result);
        } catch (error) {
            if (String(error).includes('Record to update not found')) {
                throw new NotFoundError(`User ${id} not found`);
            }
            this.logError('update', error, { userId: id });
            throw new DatabaseError(`Failed to update user: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update user role
     */
    async updateRole(id: string, role: UserRole): Promise<User> {
        try {
            const result = await prisma.user.update({
                where: { id },
                data: { role },
            });

            this.logSuccess('updateRole', { userId: id, role });
            return this.toDomain(result);
        } catch (error) {
            if (String(error).includes('Record to update not found')) {
                throw new NotFoundError(`User ${id} not found`);
            }
            this.logError('updateRole', error, { userId: id, role });
            throw new DatabaseError(`Failed to update role: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update last login timestamp
     */
    async updateLastLogin(id: string): Promise<void> {
        try {
            await prisma.user.update({
                where: { id },
                data: { lastLoginAt: new Date() },
            });

            this.logSuccess('updateLastLogin', { userId: id });
        } catch (error) {
            this.logError('updateLastLogin', error, { userId: id });
            // Don't throw - login should not fail because of timestamp update
        }
    }

    /**
     * Deactivate user (soft delete)
     */
    async deactivate(id: string): Promise<User> {
        try {
            const result = await prisma.user.update({
                where: { id },
                data: { isActive: false },
            });

            this.logSuccess('deactivate', { userId: id });
            return this.toDomain(result);
        } catch (error) {
            if (String(error).includes('Record to update not found')) {
                throw new NotFoundError(`User ${id} not found`);
            }
            this.logError('deactivate', error, { userId: id });
            throw new DatabaseError(`Failed to deactivate user: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Delete user by ID (hard delete)
     */
    async delete(id: string): Promise<boolean> {
        try {
            await prisma.user.delete({
                where: { id },
            });

            this.logSuccess('delete', { userId: id });
            return true;
        } catch (error) {
            if (String(error).includes('Record to delete does not exist')) {
                return false;
            }
            this.logError('delete', error, { userId: id });
            throw new DatabaseError(`Failed to delete user: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update user settings
     */
    async updateSettings(id: string, settings: UserSettings): Promise<User> {
        try {
            const result = await prisma.user.update({
                where: { id },
                data: { settings: settings as any },
            });

            this.logSuccess('updateSettings', { userId: id });
            return this.toDomain(result);
        } catch (error) {
            if (String(error).includes('Record to update not found')) {
                throw new NotFoundError(`User ${id} not found`);
            }
            this.logError('updateSettings', error, { userId: id });
            throw new DatabaseError(`Failed to update settings: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update API key with hash and metadata
     */
    async updateApiKey(id: string, data: { hash: string; last4: string; createdAt: Date }): Promise<User> {
        try {
            const result = await prisma.user.update({
                where: { id },
                data: {
                    apiKeyHash: data.hash,
                    apiKeyLast4: data.last4,
                    apiKeyCreatedAt: data.createdAt,
                },
            });

            this.logSuccess('updateApiKey', { userId: id });
            return this.toDomain(result);
        } catch (error) {
            if (String(error).includes('Record to update not found')) {
                throw new NotFoundError(`User ${id} not found`);
            }
            this.logError('updateApiKey', error, { userId: id });
            throw new DatabaseError(`Failed to update API key: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Soft delete user account
     */
    async softDelete(id: string): Promise<User> {
        try {
            const result = await prisma.user.update({
                where: { id },
                data: {
                    isActive: false,
                    deletedAt: new Date(),
                },
            });

            this.logSuccess('softDelete', { userId: id });
            return this.toDomain(result);
        } catch (error) {
            if (String(error).includes('Record to update not found')) {
                throw new NotFoundError(`User ${id} not found`);
            }
            this.logError('softDelete', error, { userId: id });
            throw new DatabaseError(`Failed to soft delete user: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // ========= PRIVATE METHODS =========

    /**
     * Transform Prisma model to domain type (includes password hash)
     */
    private toDomain(raw: Record<string, unknown>): User {
        return {
            id: raw['id'] as string,
            email: raw['email'] as string,
            passwordHash: raw['passwordHash'] as string,
            firstName: (raw['firstName'] as string) ?? undefined,
            lastName: (raw['lastName'] as string) ?? undefined,
            avatarUrl: (raw['avatarUrl'] as string) ?? undefined,
            role: raw['role'] as UserRole,
            isActive: raw['isActive'] as boolean,
            settings: (raw['settings'] as UserSettings) ?? undefined,
            apiKeyHash: (raw['apiKeyHash'] as string) ?? undefined,
            apiKeyLast4: (raw['apiKeyLast4'] as string) ?? undefined,
            apiKeyCreatedAt: (raw['apiKeyCreatedAt'] as Date) ?? undefined,
            deletedAt: (raw['deletedAt'] as Date) ?? undefined,
            createdAt: raw['createdAt'] as Date,
            updatedAt: raw['updatedAt'] as Date,
            lastLoginAt: (raw['lastLoginAt'] as Date) ?? undefined,
        };
    }

    /**
     * Transform Prisma model to public domain type (excludes password hash)
     */
    private toPublicDomain(raw: Record<string, unknown>): UserPublic {
        return {
            id: raw['id'] as string,
            email: raw['email'] as string,
            firstName: (raw['firstName'] as string) ?? undefined,
            lastName: (raw['lastName'] as string) ?? undefined,
            avatarUrl: (raw['avatarUrl'] as string) ?? undefined,
            role: raw['role'] as UserRole,
            isActive: raw['isActive'] as boolean,
            settings: (raw['settings'] as UserSettings) ?? undefined,
            apiKey: (raw['apiKeyLast4'] as string) ? {
                last4: raw['apiKeyLast4'] as string,
                createdAt: (raw['apiKeyCreatedAt'] as Date) ?? undefined,
                exists: true,
            } : { exists: false },
            createdAt: raw['createdAt'] as Date,
            updatedAt: raw['updatedAt'] as Date,
            lastLoginAt: (raw['lastLoginAt'] as Date) ?? undefined,
        };
    }
}

// Export singleton
export const userRepository = new UserRepository();
