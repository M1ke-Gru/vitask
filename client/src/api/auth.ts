import axios from "axios";
import { LoginResponse, SignupRequest } from "../types/auth";
import { User } from "../types/user";

const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function signup(
  request: SignupRequest
): Promise<User> {
  const { data } = await api.post<User>("/auth/signup", request);
  return data;
}

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const body = new URLSearchParams();
  body.set("username", username);
  body.set("password", password);

  const { data } = await api.post<LoginResponse>("/auth/token", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  localStorage.setItem("token", data.access_token);

  return data
}

export async function logout(): Promise<void> {
  localStorage.removeItem("token");
}

export default api;
