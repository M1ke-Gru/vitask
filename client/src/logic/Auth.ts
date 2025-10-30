import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login, logout, signup } from "../api/auth";
import api from "../api/auth";
import { getUser } from "../api/user";
import type { User } from "../types/user";
import type { SignupRequest } from "../types/auth";
import useTasks from "./Tasks";
import { toErrorMessage } from "./utils/error";

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  hasShown401: boolean;

  loggingIn: boolean;
  postSignUp: boolean; // exists to show that the user has signed up and needs to log in now
  authenticating: boolean;

  authError: string | null;

  setHasShown401: (value: boolean) => void
  setToken: (token: string | null) => void;
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
      hasShown401: false,
      postSignUp: false,
      authenticating: false,


      authError: null,

      setHasShown401: (value: boolean) => {
        set(() => ({ hasShown401: value }))
      },

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

      setToken: (token: string | null) => {
        set({ token });
        if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
        else delete api.defaults.headers.common.Authorization;
      },


      loginLogic: async (username, password) => {
        const data = await login(username, password);
        set({ token: data.access_token });

        // Set header globally
        api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;

        // Then fetch user
        const current_user: User = await getUser();
        set({ user: current_user, loading: false, postSignUp: false });

        await useTasks.getState().onReconnect();
        await useTasks.getState().fetchTasks();
        return true
      },

      logout: async () => {
        set({ loading: true, authError: null });
        try {
          await logout(); // backend clears cookie
        } catch (e) {
          console.error(e);
        } finally {
          delete api.defaults.headers.common.Authorization;
          localStorage.removeItem("token");
          useTasks.setState({ tasks: [] });
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

