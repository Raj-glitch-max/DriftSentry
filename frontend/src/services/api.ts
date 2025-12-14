/**
 * Axios API instance with interceptors
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/config/api.config';

/**
 * Create Axios instance with default configuration
 */
export const api: AxiosInstance = axios.create({
    baseURL: API_CONFIG.baseUrl,
    timeout: API_CONFIG.timeout,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor - adds auth token
 */
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Get token from localStorage (client-side only)
        if (typeof window !== 'undefined') {
            const authStore = localStorage.getItem('auth-store');
            if (authStore) {
                try {
                    const parsed = JSON.parse(authStore);
                    const token = parsed?.state?.token;
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                } catch {
                    // Ignore parse errors
                }
            }
        }
        return config;
    },
    (error) => {
        console.error('Request setup failed:', error);
        return Promise.reject(error);
    }
);

/**
 * Response interceptor - handles errors
 */
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string; code?: string }>) => {
        const status = error.response?.status;
        const data = error.response?.data;

        // Log error for debugging
        console.error('API Error:', {
            status,
            endpoint: error.config?.url,
            message: data?.message,
        });

        // Handle specific status codes
        switch (status) {
            case 401:
                // Unauthorized - clear auth and redirect
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth-store');
                    // Only redirect if not already on login page
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(new Error('Session expired. Please log in again.'));

            case 403:
                return Promise.reject(new Error('You do not have permission to perform this action.'));

            case 404:
                return Promise.reject(new Error('The requested resource was not found.'));

            case 429:
                return Promise.reject(new Error('Too many requests. Please try again later.'));

            case 500:
            case 502:
            case 503:
                return Promise.reject(new Error('Server error. Our team has been notified.'));

            default:
                if (!error.response) {
                    // Network error
                    return Promise.reject(new Error('Network error. Please check your connection.'));
                }
                return Promise.reject(
                    new Error(data?.message || error.message || 'An unexpected error occurred')
                );
        }
    }
);
