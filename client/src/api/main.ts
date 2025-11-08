import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuth } from "../logic/Auth";
import { useConnection } from "./check_connection";
import useTasks from "../logic/Tasks";
import { toErrorMessage } from "../logic/utils/error";

const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? "https://api.vitask.app" : "http://localhost:8000");

// ✅ ensure API_URL is a non-empty string
if (!API_URL) {
  console.error("API_URL is undefined. Set VITE_API_URL or check the fallback.");
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((cfg) => {
  const token = useAuth.getState().token;
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(API_URL + "/auth/refresh", {}, { withCredentials: true })
      .then((res) => {
        const newToken = res.data?.access_token as string | undefined;
        if (newToken) useAuth.getState().setToken(newToken);
        return newToken ?? null;
      })
      .catch(() => {
        // ❗ Local-only logout: DON'T call server here
        if (useAuth.getState().clearAuth) useAuth.getState().clearAuth();
        else useAuth.getState().setToken?.(null as any);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// --- Response interceptor with robust URL handling ---
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    // Offline / no-response handling
    if (!error.response) {
      if (!useConnection.getState().isReconnecting) {
        useConnection.getState().waitToReconnect(useTasks.getState().onReconnect);
      }
      useAuth.getState().setAuthError?.("Network error. Reconnecting…");
      return Promise.reject(error);
    }

    const status = error.response.status;
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    // ✅ Avoid URL constructor crashes; handle relative/absolute/empty safely
    const urlStr = (original.url ?? "").toString();
    let isAuthRoute = false;
    if (urlStr) {
      // Fast path: if it's clearly relative, just check
      if (urlStr.startsWith("/")) {
        isAuthRoute = urlStr.startsWith("/auth");
      } else {
        // Try resolving absolute/relative against API_URL
        try {
          const full = new URL(urlStr, API_URL);
          isAuthRoute = full.pathname.startsWith("/auth");
        } catch {
          // Fallback: conservative check
          isAuthRoute = urlStr.includes("/auth/");
        }
      }
    }

    // 🔁 Try refresh exactly once and never for /auth/*
    if (status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      const newToken = await refreshAccess();
      if (newToken) {
        const cfg: AxiosRequestConfig = {
          ...original,
          headers: { ...(original.headers ?? {}), Authorization: `Bearer ${newToken}` },
        };
        return api(cfg);
      }
    }

    // Surface auth errors (and any /auth/* errors) to the UI
    if (status === 401 || isAuthRoute) {
      useAuth.getState().setAuthError?.(toErrorMessage(error));
    }

    return Promise.reject(error);
  }
);

