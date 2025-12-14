/**
 * Class name utility for merging Tailwind classes
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names with Tailwind CSS conflict resolution
 * @param inputs - Class values to merge (strings, objects, arrays)
 * @returns Merged class string with conflicts resolved
 * @example
 * cn('px-4 py-2', 'px-6') // Returns 'py-2 px-6'
 * cn('bg-red-500', isActive && 'bg-blue-500') // Returns 'bg-blue-500' if isActive
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
