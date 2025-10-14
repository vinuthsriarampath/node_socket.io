import axios from 'axios';
import { refreshToken } from '../services/AuthService';
// Import globals object from the separate file
import { authGlobals } from '../context/AuthGlobals';

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = []; // Typed queue

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(authGlobals.getAccessToken() || ''); // Resolve with current token
    }
  });
  failedQueue = [];
};

// Request interceptor: Add token if available (skip for auth endpoints)
axios.interceptors.request.use(
  (config) => {
    if (
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/refresh')
    ) {
      return config; // Skip adding token for these
    }

    const token = authGlobals.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: Handle 401 by refreshing token
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      const rateLimitMsg = error.response.data?.message || 'Too many requests - please wait and try again.';
      console.warn('Rate limited:', rateLimitMsg);
      // You could emit a global event here for UI notification
      return Promise.reject(new Error(rateLimitMsg));
    }

    // Handle network errors
    if (!error.response) {
      const networkError = new Error('Network error - please check your connection');
      console.error('Network error:', networkError);
      return Promise.reject(networkError);
    }

    // Handle server errors (5xx)
    if (error.response?.status >= 500) {
      const serverError = new Error('Server error - please try again later');
      console.error('Server error:', error.response);
      return Promise.reject(serverError);
    }

    // Handle unauthorized (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return;
      }
      if (isRefreshing) {
        // If refresh is in progress, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { accessToken: newToken } = await refreshToken();
        authGlobals.setAccessToken(newToken); // Update in-memory via global setter
        axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(); // Process queued requests with new token
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Optionally trigger logout here if refresh fails completely
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);