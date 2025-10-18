import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login, logout, signup } from "../api/auth";
import api from "../api/auth";
import { getUser } from "../api/user";
import type { User } from "../types/user";
import type { SignupRequest } from "../types/auth";

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;

  loggingIn: boolean;
  authenticating: boolean;

  authError: string | null;

  toggleAuth: () => void;
  toggleLogin: () => void;
  signupLogic: (request: SignupRequest) => Promise<void>;
  loginLogic: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuthError: (msg: string) => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      loading: false,

      loggingIn: true,
      authenticating: false,

      authError: null,

      toggleAuth: () =>
        set((s) => ({ authenticating: !s.authenticating })),

      toggleLogin: () =>
        set((s) => ({ loggingIn: !s.loggingIn })),

      signupLogic: async (request) => {
        set({ loading: true, authError: null });
        try {
          const user = await signup(request);
          set({ user, loading: false });
        } catch (e: any) {
          set({ loading: false, authError: e?.message ?? "Signup failed" });
          throw e;
        }
      },

      loginLogic: async (username, password) => {
        set({ loading: true, authError: null });
        try {
          const { access_token } = await login(username, password);
          const current_user = await getUser();
          set({ token: access_token, user: current_user, loading: false });
        } catch (e: any) {
          set({ token: null, user: null, loading: false, authError: e?.message ?? "Login failed" });
          throw e;
        }
      },

      logout: async () => {
        set({ loading: true, authError: null });
        try {
          await logout();
        } finally {
          // ensure cleanup even if API call fails
          localStorage.removeItem("token");
          delete api.defaults.headers.common.Authorization;

          set({ token: null, user: null, loading: false });
        }
      },

      setAuthError: (msg) => set({ authError: msg }),
    }),
    {
      name: "auth",
      // only persist what you need
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => (rehydrated) => {
        if (!rehydrated?.token) return;
        api.defaults.headers.common.Authorization = `Bearer ${rehydrated.token}`;
        localStorage.setItem("token", rehydrated.token);
      },
    }
  )
);

