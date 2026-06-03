import axios, { AxiosError } from 'axios';
import type { ApiErrorBody } from './types';

export const TOKEN_STORAGE_KEY = 'ajaia.token';

export const api = axios.create({
  baseURL: '/api',
});

// Attach the JWT (if present) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On an expired/invalid token, clear it and bounce to the login screen.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

/** Extracts a human-readable message from an Axios/API error. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join(', ') : body.message;
    }
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
