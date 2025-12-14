/**
 * Formatting utilities for DriftSentry
 */

/**
 * Formats a number as currency
 * @param amount - The amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 * @example
 * formatCurrency(1234.56) // Returns "$1,234.56"
 * formatCurrency(1234.56, 'EUR') // Returns "€1,234.56"
 */
export function formatCurrency(
    amount: number,
    currency: 'USD' | 'EUR' | 'GBP' = 'USD'
): string {
    if (!Number.isFinite(amount)) {
        return '$0.00';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Formats a number with compact notation for large numbers
 * @param value - The number to format
 * @returns Compact formatted string
 * @example
 * formatCompactNumber(1234) // Returns "1.2K"
 * formatCompactNumber(1234567) // Returns "1.2M"
 */
export function formatCompactNumber(value: number): string {
    if (!Number.isFinite(value)) {
        return '0';
    }

    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    }).format(value);
}

/**
 * Formats a date as relative time (e.g., "2 hours ago")
 * @param date - Date string or Date object
 * @returns Relative time string
 * @example
 * formatRelativeTime('2024-01-01T12:00:00Z') // Returns "2 months ago"
 */
export function formatRelativeTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return 'Unknown';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays}d ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
        return `${diffInWeeks}w ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths}mo ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
}

/**
 * Formats a date for display
 * @param date - Date string or Date object
 * @param options - Formatting options
 * @returns Formatted date string
 * @example
 * formatDate('2024-01-01') // Returns "Jan 1, 2024"
 */
export function formatDate(
    date: string | Date,
    options: {
        includeTime?: boolean;
        short?: boolean;
    } = {}
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
    }

    const { includeTime = false, short = false } = options;

    const dateFormatOptions: Intl.DateTimeFormatOptions = short
        ? { month: 'short', day: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' };

    if (includeTime) {
        dateFormatOptions.hour = 'numeric';
        dateFormatOptions.minute = '2-digit';
    }

    return new Intl.DateTimeFormat('en-US', dateFormatOptions).format(dateObj);
}

/**
 * Formats a percentage
 * @param value - The decimal value (0.5 = 50%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 * @example
 * formatPercentage(0.1234) // Returns "12.3%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
    if (!Number.isFinite(value)) {
        return '0%';
    }

    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Truncates a string to a maximum length with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) {
        return str;
    }
    return `${str.slice(0, maxLength - 3)}...`;
}
