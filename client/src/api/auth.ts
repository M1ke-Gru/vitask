import { LoginResponse, SignupRequest } from "../types/auth";
import { User } from "../types/user";
import { api } from "./main"

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
  const { data } = await api.post("/auth/logout")
  localStorage.removeItem("token");
  return data
}

export default api;
