import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  details?: { duplicate?: string | string[] };
}

export function getApiError(err: unknown): ApiError {
  const ax = err as AxiosError<ApiError>;
  if (ax?.response?.data) return ax.response.data;
  return { message: 'Error de red o servidor no disponible' };
}
