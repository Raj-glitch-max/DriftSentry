/**
 * UI Store - Zustand store for UI state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ModalState {
    isOpen: boolean;
    modalId: string | null;
    data: Record<string, unknown> | null;
}

interface UIState {
    // State
    isDarkMode: boolean;
    sidebarOpen: boolean;
    activeTab: string;
    modal: ModalState;

    // Actions
    toggleDarkMode: () => void;
    setDarkMode: (isDark: boolean) => void;
    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;
    setActiveTab: (tab: string) => void;
    openModal: (modalId: string, data?: Record<string, unknown>) => void;
    closeModal: () => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            // Initial state
            isDarkMode: false,
            sidebarOpen: true,
            activeTab: 'overview',
            modal: {
                isOpen: false,
                modalId: null,
                data: null,
            },

            // Actions
            toggleDarkMode: () =>
                set((state) => ({ isDarkMode: !state.isDarkMode })),

            setDarkMode: (isDark) =>
                set({ isDarkMode: isDark }),

            setSidebarOpen: (open) =>
                set({ sidebarOpen: open }),

            toggleSidebar: () =>
                set((state) => ({ sidebarOpen: !state.sidebarOpen })),

            setActiveTab: (tab) =>
                set({ activeTab: tab }),

            openModal: (modalId, data) =>
                set({
                    modal: {
                        isOpen: true,
                        modalId,
                        data: data || null,
                    },
                }),

            closeModal: () =>
                set({
                    modal: {
                        isOpen: false,
                        modalId: null,
                        data: null,
                    },
                }),
        }),
        {
            name: 'ui-store',
            // Only persist dark mode preference
            partialize: (state) => ({
                isDarkMode: state.isDarkMode,
            }),
        }
    )
);
