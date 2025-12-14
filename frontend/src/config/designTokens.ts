/**
 * Design tokens for DriftSentry
 * Central source of truth for colors, spacing, typography, shadows
 */

export const COLORS = {
    // Primary palette
    gold: {
        600: '#FFD700',
        700: '#FFC700',
        800: '#FFB700',
    },
    teal: {
        400: '#00D9FF',
        600: '#00B8CC',
        800: '#008899',
    },
    purple: {
        400: '#B76EF0',
        600: '#9D4EDD',
        800: '#7B2FBF',
    },

    // Semantic colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Accent colors
    deepBlue: '#001F3F',
    cyan: '#00FFFF',
    magenta: '#FF006E',

    // Neutrals - Dark mode
    dark: {
        bg: '#0A0E27',
        surface: '#1A1A2E',
        border: 'rgba(255, 215, 0, 0.1)',
        text: '#E8E8FF',
        textMuted: '#A0A0B8',
    },

    // Neutrals - Light mode
    light: {
        bg: '#F5F7FA',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        text: '#1A1A2E',
        textMuted: '#6B7280',
    },
} as const;

export const GRADIENTS = {
    hero: 'linear-gradient(135deg, #FFD700, #9D4EDD)',
    heroSubtle: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(157, 78, 221, 0.1))',
    darkSurface: 'linear-gradient(135deg, #0A0E27, #1A1A2E)',
    glow: 'radial-gradient(circle, rgba(0, 217, 255, 0.2), transparent)',
    glowGold: 'radial-gradient(circle, rgba(255, 215, 0, 0.15), transparent)',
    card: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
} as const;

export const SHADOWS = {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.2)',
    xl: '0 20px 25px rgba(0,0,0,0.25)',
    glow: '0 0 20px rgba(0, 217, 255, 0.3)',
    glowGold: '0 0 15px rgba(255, 215, 0, 0.2)',
    glowPurple: '0 0 20px rgba(157, 78, 221, 0.3)',
} as const;

export const SPACING = {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
} as const;

export const TYPOGRAPHY = {
    fontFamily: {
        sans: 'Inter, system-ui, -apple-system, sans-serif',
        mono: 'Fira Code, SF Mono, Menlo, monospace',
    },
    fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px',
    },
    fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
} as const;

export const RADIUS = {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px',
} as const;

export const BREAKPOINTS = {
    mobile: 375,
    mobileLg: 425,
    tablet: 768,
    desktop: 1024,
    desktopLg: 1280,
    desktopXl: 1536,
} as const;

export const ANIMATION_TIMING = {
    micro: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    entrance: 600,
    scrollDebounce: 16,
} as const;

export const EASING = {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    entrance: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    natural: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
} as const;

/** Severity color mapping */
export const SEVERITY_COLORS = {
    critical: {
        bg: 'bg-red-500',
        text: 'text-red-500',
        border: 'border-red-500',
        bgLight: 'bg-red-100 dark:bg-red-900/20',
    },
    warning: {
        bg: 'bg-amber-500',
        text: 'text-amber-500',
        border: 'border-amber-500',
        bgLight: 'bg-amber-100 dark:bg-amber-900/20',
    },
    info: {
        bg: 'bg-blue-500',
        text: 'text-blue-500',
        border: 'border-blue-500',
        bgLight: 'bg-blue-100 dark:bg-blue-900/20',
    },
} as const;
