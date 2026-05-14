import { create } from "zustand";
import { authService } from "@/services";

// Mirror what the backend returns from publicUser()
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "SURVIVOR" | "VOLUNTEER" | "ADMIN";
  latitude: number | null;
  longitude: number | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

// ── helpers ──────────────────────────────────────────────
const isBrowser = typeof window !== "undefined";

function getStoredToken() {
  return isBrowser ? localStorage.getItem("dl_token") : null;
}

function setTokens(access: string, refresh: string) {
  if (!isBrowser) return;
  localStorage.setItem("dl_token", access);
  localStorage.setItem("dl_refresh_token", refresh);
}

function clearTokens() {
  if (!isBrowser) return;
  localStorage.removeItem("dl_token");
  localStorage.removeItem("dl_refresh_token");
}

function extractMessage(err: unknown, fallback: string): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err
  ) {
    const r = (err as { response?: { data?: { message?: string } } }).response;
    return r?.data?.message ?? fallback;
  }
  return fallback;
}
// ─────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!getStoredToken(),
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  // ── Login ────────────────────────────────────────────
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authService.login({ email, password });
      const { user, accessToken, refreshToken } = data.data;
      setTokens(accessToken, refreshToken);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = extractMessage(err, "Login failed. Please check your credentials.");
      set({ isLoading: false, error: message, isAuthenticated: false });
      throw err;
    }
  },

  // ── Register ─────────────────────────────────────────
  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authService.register(payload);
      const { user, accessToken, refreshToken } = data.data;
      setTokens(accessToken, refreshToken);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = extractMessage(err, "Registration failed. Please try again.");
      set({ isLoading: false, error: message, isAuthenticated: false });
      throw err;
    }
  },

  // ── Logout ───────────────────────────────────────────
  logout: async () => {
    const refreshToken = isBrowser
      ? localStorage.getItem("dl_refresh_token")
      : null;
    try {
      if (refreshToken) await authService.logout({ refreshToken });
    } catch {
      // ignore server errors — always clear client state
    } finally {
      clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },

  // ── Hydrate from token on app load ───────────────────
  fetchMe: async () => {
    if (!getStoredToken()) return;
    set({ isLoading: true });
    try {
      const { data } = await authService.me();
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
