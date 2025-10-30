import axios from "axios";
import { useAuth } from "../logic/Auth";
import { useConnection } from "./check_connection";
import useTasks from "../logic/Tasks";
import { toErrorMessage } from "../logic/utils/error";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (!error.response) {
      if (!useConnection.getState().isReconnecting) {
        useConnection.getState().waitToReconnect(useTasks.getState().onReconnect);
      }
      useAuth.getState().setAuthError?.("Network error. Reconnecting…");
      return Promise.reject(error);
    }

    const status = error.response.status;
    const url = (error.config?.url ?? "").toString();

    if (status === 401 || url.includes("/auth/")) {
      useAuth.getState().setAuthError?.(toErrorMessage(error));
    }

    return Promise.reject(error);
  }
);


api.interceptors.request.use((cfg) => {
  const token = useAuth.getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
