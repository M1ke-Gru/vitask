import axios from "axios";
import { useAuth } from "../logic/Auth";
import { useConnection } from "./check_connection";
import { useTasks } from "../logic/Tasks";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      if (!useConnection.getState().isReconnecting) {
        useConnection.getState().waitToReconnect(useTasks.getState().onReconnect);
      }
    }
    const { setAuthError } = useAuth.getState();
    setAuthError(error);
    return Promise.reject(error);
  }
);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
