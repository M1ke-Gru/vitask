import { User } from "../types/user.js"
import api from "./auth.js"

export async function getUsername(): Promise<string> {
  const { data } = await api.get("/users/username")
  return data
}

export async function getUser(): Promise<User> {
  const { data } = await api.get("/user")
  return data
}
