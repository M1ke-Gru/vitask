import { login, logout, signup } from "../api/auth";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types/user"
import { getUser } from "../api/user";
import { SignupRequest } from "../types/auth";
import api from "../api/auth";

type AuthState = {
  token: string | null
  user: User | null
  loading: boolean
  logingIn: boolean
  authenticating: boolean
  error: string | null
  toggleAuth: () => void
  toggleLogingIn: () => void
  signupLogic: (request: SignupRequest) => Promise<void>
  loginLogic: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuth = create<AuthState>()(persist(
  (set) => ({
    token: null,
    user: null,
    loading: false,
    logingIn: true,
    authenticating: false,
    error: null,

    toggleAuth: () => {
      set((state) => ({ authenticating: !state.authenticating }))
    },
    toggleLogingIn: () => set((state) => ({ logingIn: !state.logingIn})),
    signupLogic: async (request: SignupRequest) => {
      set({ loading: true, error: null })
      try {
        const user = await signup(request)
        set({ user, loading: false })
      } catch (e: any) {
        set({ loading: false, error: e?.message ?? "Signup failed" })
        throw e;
      }
      return
    },
    loginLogic: async (username, password) => {
      set({ loading: true, error: null });
      try {
        const { access_token } = (await login(username, password));
        const user = await getUser();
        set({ token: access_token, user: user, loading: false });
      } catch (e: any) {
        set({ token: null, user: null, loading: false, error: e?.message ?? "Login failed" });
        throw e;
      }
    },
    logout: async () => {
      set({ loading: true, error: null })
      try {
        await logout()
        set({ token: null, user: null, loading: false })
      } catch (e: any) {
        set({ error: "Logout failed", loading: false })
        throw e
      }
    },
  }),
  {
    name: 'auth',
    partialize: (s) => ({ token: s.token, user: s.user }),
    onRehydrateStorage: () => (state) => {
      if (!state) return;
      const t = state.token;
      if (t) api.defaults.headers.common.Authorization = `Bearer ${t}`;
    },
  }
))


export async function callLogin() {

}
