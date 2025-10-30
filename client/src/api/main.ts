import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuth } from "../logic/Auth";
import { useConnection } from "./check_connection";
import useTasks from "../logic/Tasks";
import { toErrorMessage } from "../logic/utils/error";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  withCredentials: false, // normal requests don't need cookies
  headers: { "Content-Type": "application/json" },
});

// Attach Authorization header if token exists
api.interceptors.request.use((cfg) => {
  const token = useAuth.getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// --- Refresh helper ---
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/auth/refresh",
        {},
        { withCredentials: true } // send HttpOnly cookie to backend
      )
      .then((res) => {
        const newToken = res.data?.access_token as string;
        if (newToken) {
          useAuth.getState().setToken(newToken);
        }
        return newToken ?? null;
      })
      .catch(() => {
        useAuth.getState().logout();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// --- Response interceptor with refresh logic ---
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    // Handle no response (network outage)
    if (!error.response) {
      if (!useConnection.getState().isReconnecting) {
        useConnection.getState().waitToReconnect(useTasks.getState().onReconnect);
      }
      useAuth.getState().setAuthError?.("Network error. Reconnecting…");
      return Promise.reject(error);
    }

    const status = error.response.status;
    const url = (error.config?.url ?? "").toString();
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    // --- Handle 401: try silent refresh once ---
    if (status === 401 && !original._retry && !url.includes("/auth/refresh")) {
      original._retry = true;
      const newToken = await refreshAccess();
      if (newToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original); // retry original request
      }
    }

    // --- Handle /auth/ errors separately (login/signup/logout) ---
    if (status === 401 || url.includes("/auth/")) {
      useAuth.getState().setAuthError?.(toErrorMessage(error));
    }

    return Promise.reject(error);
  }
);

