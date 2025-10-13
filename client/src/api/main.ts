import axios from "axios";
import { useAuth } from "../logic/Auth";

export const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use((response) => response,
  (error) => {
    const { setAuthError } = useAuth()
    setAuthError(error)
  }

)

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

