import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login, logout, signup } from "../api/auth";
import api from "../api/auth";
import { getUser } from "../api/user";
import type { User } from "../types/user";
import type { SignupRequest } from "../types/auth";
import { useTasks } from "./Tasks";
import { toErrorMessage } from "./utils/error";

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;

  loggingIn: boolean;
  postSignUp: boolean; // exists to show that the user has signed up and needs to log in now
  authenticating: boolean;

  authError: string | null;

  toggleAuth: () => void;
  toggleLogin: () => void;
  signupLogic: (request: SignupRequest) => Promise<boolean>;
  loginLogic: (username: string, password: string) => Promise<boolean>;
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
      postSignUp: false,
      authenticating: false,

      authError: null,

      toggleAuth: () =>
        set((s) => ({ authenticating: !s.authenticating })),

      toggleLogin: () =>
        set((s) => ({ loggingIn: !s.loggingIn, postSignUp: false })),

      signupLogic: async (request) => {
        set({ loading: true, authError: null });
        try {
          await signup(request);
          set({ postSignUp: true, loading: false });
          return false
        } catch (e: any) {
          const msg = toErrorMessage(e)
          set({ loading: false, authError: msg });
          return false
        }
      },

      loginLogic: async (username, password) => {
        set({ loading: true, authError: null });
        try {
          const data = await login(username, password);
          set({ token: data.access_token });
          const current_user: User = await getUser();
          set({ postSignUp: false, user: current_user, loading: false })
          await useTasks.getState().onReconnect()
          await useTasks.getState().fetchTasks()
          return true
        } catch (e: any) {
          const msg = toErrorMessage(e)
          set({ token: null, user: null, loading: false, authError: msg ?? "Login failed" });
          return false
        }
      },

      logout: async () => {
        set({ loading: true, authError: null });
        try {
          await logout();
        } finally {
          delete api.defaults.headers.common.Authorization;
          useTasks.setState({ tasks: [] })

          set({ token: null, user: null, loading: false });
        }
      },

      setAuthError: (msg) => set({ authError: msg }),
    }),
    {
      name: "auth",
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => (rehydrated) => {
        if (!rehydrated?.token) return;
        api.defaults.headers.common.Authorization = `Bearer ${rehydrated.token}`;
        localStorage.setItem("token", rehydrated.token);
      },
    }
  )
);

