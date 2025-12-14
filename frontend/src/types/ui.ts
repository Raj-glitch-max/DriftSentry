/**
 * UI-related TypeScript types for DriftSentry
 */

/**
 * Theme modes
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Button variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/**
 * Button sizes
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification
 */
export interface Toast {
    readonly id: string;
    readonly type: ToastType;
    readonly title: string;
    readonly message?: string;
    readonly duration?: number;
    readonly dismissible?: boolean;
}

/**
 * Modal state
 */
export interface ModalState {
    readonly isOpen: boolean;
    readonly modalId: string | null;
    readonly data?: Record<string, unknown>;
}

/**
 * Navigation item
 */
export interface NavItem {
    readonly id: string;
    readonly label: string;
    readonly href: string;
    readonly icon?: string;
    readonly badge?: number;
    readonly children?: readonly NavItem[];
}

/**
 * Tab item for tab navigation
 */
export interface TabItem {
    readonly id: string;
    readonly label: string;
    readonly content?: React.ReactNode;
    readonly disabled?: boolean;
}

/**
 * Breakpoint sizes
 */
export interface Breakpoints {
    readonly mobile: number;
    readonly tablet: number;
    readonly desktop: number;
    readonly desktopLg: number;
}

/**
 * Common component props with className support
 */
export interface WithClassName {
    readonly className?: string;
}

/**
 * Common component props with children
 */
export interface WithChildren {
    readonly children: React.ReactNode;
}

/**
 * Chart time range options
 */
export type TimeRange = '7d' | '30d' | '90d' | 'ytd';
