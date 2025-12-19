import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login, signup, logout as logoutApi } from "../api/auth";
import { api } from "../api/main";
import { getUser } from "../api/user";
import type { User } from "../types/user";
import type { SignupRequest } from "../types/auth";
import useTasks from "./Tasks";
import { toErrorMessage } from "./utils/error";

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;

  loggingIn: boolean;
  postSignUp: boolean;
  authenticating: boolean;

  hasShown401: boolean;
  authError: string | null;

  setHasShown401: (value: boolean) => void;
  setToken: (token: string | null) => void;
  clearAuth: () => void;                       // <- local-only logout (no network)
  toggleAuth: () => void;
  toggleLogin: () => void;
  signupLogic: (request: SignupRequest) => Promise<boolean>;
  loginLogic: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;                 // <- server + local
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

      hasShown401: false,
      authError: null,

      setHasShown401: (value) => set({ hasShown401: value }),

      setToken: (token) => {
        set({ token });
        if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
        else delete api.defaults.headers.common.Authorization;
      },

      clearAuth: () => {
        // local-only cleanup (used on refresh failure)
        delete api.defaults.headers.common.Authorization;
        useTasks.setState({ tasks: [] });
        set({ token: null, user: null, loading: false });
      },

      toggleAuth: () => set((s) => ({ authenticating: !s.authenticating })),
      toggleLogin: () => set((s) => ({ loggingIn: !s.loggingIn, postSignUp: false })),

      signupLogic: async (request) => {
        set({ loading: true, authError: null });
        try {
          await signup(request);
          set({ postSignUp: true, loading: false });
          return true;
        } catch (e: any) {
          set({ loading: false, authError: toErrorMessage(e) });
          return false;
        }
      },

      loginLogic: async (username, password) => {
        set({ loading: true, authError: null });
        const data = await login(username, password); // sets refresh cookie server-side
        get().setToken(data.access_token);            // update bearer

        const current_user = await getUser();
        set({ user: current_user, loading: false, postSignUp: false });

        await useTasks.getState().onReconnect();
        await useTasks.getState().fetchTasks();
        return true;
      },

      logout: async () => {
        set({ loading: true, authError: null });
        try {
          // call server to clear cookie + revoke sessions (ok when authenticated)
          await logoutApi();
        } catch (e) {
          // swallow—user may already be unauthenticated
          console.error(e);
        } finally {
          get().clearAuth(); // always clear locally
        }
      },

      setAuthError: (msg) => set({ authError: msg }),
    }),
    {
      name: "auth",
      partialize: (s) => ({ token: s.token, user: s.user }), // persisted subset
      onRehydrateStorage: () => (rehydrated) => {
        // defensive: store might be empty on first load
        if (rehydrated?.token) {
          api.defaults.headers.common.Authorization = `Bearer ${rehydrated.token}`;
        }
      },
    }
  )
);

