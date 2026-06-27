import axios from 'axios';

// In dev, Vite proxies /api -> http://localhost:5000. In production, set
// VITE_API_BASE_URL to your deployed backend URL.
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL,
  withCredentials: true, // send the httpOnly refreshToken cookie
});

// In-memory access token (never localStorage - keeps it out of reach of XSS).
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Queue of requests waiting on a single in-flight refresh call, so a burst of
// 401s doesn't trigger multiple simultaneous refresh requests.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    const isAuthEndpoint =
      config?.url?.includes('/auth/login') ||
      config?.url?.includes('/auth/register') ||
      config?.url?.includes('/auth/refresh');

    if (response?.status === 401 && !config._retry && !isAuthEndpoint) {
      config._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/refresh').finally(() => {
            refreshPromise = null;
          });
        }
        const { data } = await refreshPromise;
        setAccessToken(data.data.accessToken);
        config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(config);
      } catch (refreshError) {
        setAccessToken(null);
        // Let the app know the session is dead so it can redirect to /login.
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
