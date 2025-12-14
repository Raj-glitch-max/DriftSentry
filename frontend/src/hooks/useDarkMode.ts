/**
 * Dark mode hook with document class management
 */

'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/useUIStore';

/**
 * Hook for managing dark mode
 * Syncs the dark mode state with the document class
 */
export function useDarkMode() {
    const { isDarkMode, toggleDarkMode, setDarkMode } = useUIStore();

    useEffect(() => {
        // Apply dark class to document
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Check system preference on mount
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Only set if user hasn't explicitly set a preference
        const storedPreference = localStorage.getItem('ui-store');
        if (!storedPreference) {
            setDarkMode(mediaQuery.matches);
        }

        // Listen for system preference changes
        const handleChange = (e: MediaQueryListEvent) => {
            // Only update if user hasn't set preference
            const stored = localStorage.getItem('ui-store');
            if (!stored) {
                setDarkMode(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [setDarkMode]);

    return { isDarkMode, toggleDarkMode, setDarkMode };
}
