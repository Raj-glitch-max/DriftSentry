import { api } from './api';
import { API_CONFIG } from '@/config/api.config';

export interface LoginCredentials {
    email: string;
    password?: string;
    apiKey?: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}

export const authApi = {
    login: async (credentials: LoginCredentials) => {
        const response = await api.post<AuthResponse>(API_CONFIG.endpoints.auth.login, credentials);
        return response.data;
    },

    logout: async () => {
        await api.post(API_CONFIG.endpoints.auth.logout);
    },

    refresh: async () => {
        const response = await api.post<{ token: string }>(API_CONFIG.endpoints.auth.refresh);
        return response.data;
    },
};
