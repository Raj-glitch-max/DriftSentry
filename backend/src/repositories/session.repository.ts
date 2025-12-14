/**
 * Session Repository
 * Manages refresh token sessions in database
 */

import { prisma } from '../database/prisma';
import { BaseRepository } from './base.repository';
import { DatabaseError, NotFoundError } from '../utils/errors';
import type { Session, CreateSessionInput } from '../types/domain/session';
import type { PaginatedResult } from '../types/api/responses';

/**
 * Session filters for listing
 */
interface SessionFilters {
    userId?: string;
    isRevoked?: boolean;
    page: number;
    limit: number;
}

/**
 * SessionRepository
 * Handles session CRUD operations
 */
export class SessionRepository extends BaseRepository<Session, SessionFilters, Session> {
    constructor() {
        super('SessionRepository');
    }

    /**
     * Create new session
     */
    async create(input: CreateSessionInput): Promise<Session> {
        try {
            const result = await prisma.session.create({
                data: {
                    userId: input.userId,
                    refreshToken: input.refreshToken,
                    expiresAt: input.expiresAt,
                    ipAddress: input.ipAddress,
                    userAgent: input.userAgent,
                    isRevoked: false,
                },
            });

            this.logSuccess('create', { sessionId: result.id, userId: input.userId });
            return this.toDomain(result);
        } catch (error) {
            this.logError('create', error, { userId: input.userId });
            throw new DatabaseError(`Failed to create session: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get session by ID
     */
    async getById(id: string): Promise<Session | null> {
        try {
            const result = await prisma.session.findUnique({
                where: { id },
            });

            return result ? this.toDomain(result) : null;
        } catch (error) {
            this.logError('getById', error, { sessionId: id });
            throw new DatabaseError(`Failed to get session: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get session by refresh token
     */
    async getByRefreshToken(refreshToken: string): Promise<Session | null> {
        try {
            const result = await prisma.session.findFirst({
                where: { refreshToken },
            });

            return result ? this.toDomain(result) : null;
        } catch (error) {
            this.logError('getByRefreshToken', error);
            throw new DatabaseError(`Failed to get session: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * List sessions (not typically used)
     */
    async list(filters: SessionFilters): Promise<PaginatedResult<Session>> {
        try {
            const where: Record<string, unknown> = {};

            if (filters.userId) {
                where['userId'] = filters.userId;
            }
            if (filters.isRevoked !== undefined) {
                where['isRevoked'] = filters.isRevoked;
            }

            const [results, total] = await Promise.all([
                prisma.session.findMany({
                    where,
                    skip: this.calculateOffset(filters.page, filters.limit),
                    take: filters.limit,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.session.count({ where }),
            ]);

            return {
                items: results.map((r: Record<string, unknown>) => this.toDomain(r)),
                total,
            };
        } catch (error) {
            this.logError('list', error, { filters });
            throw new DatabaseError(`Failed to list sessions: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Revoke session (logout)
     */
    async revoke(sessionId: string): Promise<Session> {
        try {
            const result = await prisma.session.update({
                where: { id: sessionId },
                data: { isRevoked: true },
            });

            this.logSuccess('revoke', { sessionId });
            return this.toDomain(result);
        } catch (error) {
            if (String(error).includes('Record to update not found')) {
                throw new NotFoundError(`Session ${sessionId} not found`);
            }
            this.logError('revoke', error, { sessionId });
            throw new DatabaseError(`Failed to revoke session: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update last used timestamp
     */
    async updateLastUsed(sessionId: string): Promise<Session> {
        try {
            const result = await prisma.session.update({
                where: { id: sessionId },
                data: { lastUsedAt: new Date() },
            });

            return this.toDomain(result);
        } catch (error) {
            this.logError('updateLastUsed', error, { sessionId });
            throw new DatabaseError(`Failed to update session: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Delete session (not typically used, prefer revoke)
     */
    async delete(id: string): Promise<boolean> {
        try {
            await prisma.session.delete({
                where: { id },
            });

            this.logSuccess('delete', { sessionId: id });
            return true;
        } catch (error) {
            if (String(error).includes('Record to delete does not exist')) {
                return false;
            }
            this.logError('delete', error, { sessionId: id });
            throw new DatabaseError(`Failed to delete session: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Delete all sessions for a user (used on password change)
     */
    async deleteAllForUser(userId: string): Promise<number> {
        try {
            const result = await prisma.session.deleteMany({
                where: { userId },
            });

            this.logSuccess('deleteAllForUser', { userId, count: result.count });
            return result.count;
        } catch (error) {
            this.logError('deleteAllForUser', error, { userId });
            throw new DatabaseError(`Failed to delete sessions: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Transform database result to domain entity
     */
    private toDomain(raw: Record<string, unknown>): Session {
        return {
            id: raw['id'] as string,
            userId: raw['userId'] as string,
            refreshToken: raw['refreshToken'] as string,
            expiresAt: new Date(raw['expiresAt'] as string),
            isRevoked: raw['isRevoked'] as boolean,
            ipAddress: raw['ipAddress'] as string | undefined,
            userAgent: raw['userAgent'] as string | undefined,
            lastUsedAt: raw['lastUsedAt'] ? new Date(raw['lastUsedAt'] as string) : undefined,
            createdAt: new Date(raw['createdAt'] as string),
        };
    }
}

// Export singleton
export const sessionRepository = new SessionRepository();
