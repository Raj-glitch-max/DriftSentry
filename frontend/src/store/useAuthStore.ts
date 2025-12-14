/**
 * Auth Store - Zustand store for authentication state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: 'admin' | 'user' | 'viewer';
}

interface AuthState {
    // State
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    login: (user: User, token: string) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            // Initial state
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,

            // Actions
            setUser: (user) =>
                set({ user, isAuthenticated: !!user }),

            setToken: (token) =>
                set({ token }),

            login: (user, token) =>
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                }),

            logout: () =>
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                }),

            setLoading: (loading) =>
                set({ isLoading: loading }),
        }),
        {
            name: 'auth-store',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
            }),
        }
    )
);
