import { create } from "zustand";
import type { User, UserRole } from "@/types";
import type { Permission } from "@/lib/permissions";
import {
  authenticateUser,
  persistSession,
  getPersistedSession,
  clearSession,
} from "@/lib/auth";
import { getPermissionsForRole, ROLE_REDIRECT } from "@/lib/permissions";

// ============================================
// Auth Store Interface
// ============================================
interface AuthState {
  // State
  user: User | null;
  token: string | null;
  role: UserRole | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; redirectTo?: string; error?: string }>;
  register: (data: { name: string; email: string; role: UserRole }) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  hydrate: () => void;
  clearError: () => void;
  hasPermission: (permission: Permission) => boolean;
}

// ============================================
// Zustand Auth Store
// ============================================
export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state — not authenticated until hydration
  user: null,
  token: null,
  role: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
  error: null,

  /**
   * Login: validates credentials, persists session, resolves redirect path.
   */
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    const result = await authenticateUser(email, password);

    if (!result.success || !result.user || !result.token) {
      set({
        isLoading: false,
        error: result.error || "Authentication failed.",
        isAuthenticated: false,
        user: null,
        token: null,
        role: null,
        permissions: [],
      });
      return { success: false, error: result.error };
    }

    const permissions = getPermissionsForRole(result.user.role);

    // Persist to localStorage
    persistSession(result.token, result.user, result.refreshToken);

    set({
      user: result.user,
      token: result.token,
      role: result.user.role,
      permissions,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    return {
      success: true,
      redirectTo: result.redirectTo || ROLE_REDIRECT[result.user.role],
    };
  },

  /**
   * Register: creates a new citizen account (mock).
   */
  register: async (data) => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, 1500));
    const newUser: User = {
      id: `USR-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role || "citizen",
      isVerified: false,
      createdAt: new Date().toISOString(),
      permissions: getPermissionsForRole(data.role || "citizen"),
    };
    set({
      user: newUser,
      role: newUser.role,
      permissions: getPermissionsForRole(newUser.role),
      isAuthenticated: true,
      isLoading: false,
    });
  },

  /**
   * Logout: clears all session data.
   */
  logout: () => {
    clearSession();
    set({
      user: null,
      token: null,
      role: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  /**
   * Set user data directly (for profile updates etc).
   */
  setUser: (user) => {
    set({
      user,
      role: user.role,
      permissions: getPermissionsForRole(user.role),
    });
  },

  /**
   * Hydrate: restores session from localStorage on app mount.
   */
  hydrate: () => {
    const session = getPersistedSession();
    if (session) {
      set({
        user: session.user,
        token: session.token,
        role: session.user.role,
        permissions: getPermissionsForRole(session.user.role),
        isAuthenticated: true,
        isHydrated: true,
      });
    } else {
      set({ isHydrated: true });
    }
  },

  /**
   * Clear error state.
   */
  clearError: () => set({ error: null }),

  /**
   * Check if the current user has a specific permission.
   */
  hasPermission: (permission: Permission) => {
    const { permissions } = get();
    return permissions.includes(permission);
  },
}));
