/**
 * Password Utilities
 * Bcrypt hashing and verification
 */

import bcrypt from 'bcrypt';
import { ValidationError } from './errors';

/**
 * Salt rounds for bcrypt hashing
 * Higher = more secure but slower
 */
const SALT_ROUNDS = 10;

/**
 * Minimum password length
 */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Hash password for storage
 * @throws ValidationError if password is too short
 */
export async function hashPassword(password: string): Promise<string> {
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
        throw new ValidationError(
            `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
        );
    }

    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password against hash
 * Returns true if password matches, false otherwise
 */
export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    if (!password || !hash) {
        return false;
    }

    return bcrypt.compare(password, hash);
}
