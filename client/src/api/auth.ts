import { useTasks } from "../logic/Tasks";
import { LoginResponse, SignupRequest } from "../types/auth";
import { User } from "../types/user";
import { api } from "./main"

export async function signup(
  request: SignupRequest
): Promise<User> {
  try {
    console.log("Request: ", request)
    const { data } = await api.post<User>("/auth/signup", request);
    return data;
  } catch (e) {
    throw e
  }
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

  return data
}

export async function logout(): Promise<void> {
  const { data } = await api.post("/auth/logout")
  return data
}

export default api;
