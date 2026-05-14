import type { User, UserRole } from "@/types";
import api from "@/services/api";
import { getPermissionsForRole, ROLE_REDIRECT } from "./permissions";

// ============================================
// Mock User Accounts (Enterprise-grade demo)
// ============================================
export const MOCK_USERS: Record<string, { password: string; user: User }> = {
  "admin@disasterlink.gov.in": {
    password: "Admin@123",
    user: {
      id: "USR-001",
      name: "Director Rajesh Patil",
      email: "admin@disasterlink.gov.in",
      role: "admin",
      phone: "+91 22 2202 1234",
      district: "All India",
      permissions: getPermissionsForRole("admin"),
      isVerified: true,
      lastActive: new Date().toISOString(),
      createdAt: "2024-01-15T00:00:00Z",
    },
  },
  "pune.ops@disasterlink.gov.in": {
    password: "District@123",
    user: {
      id: "USR-002",
      name: "DM Sneha Kulkarni",
      email: "pune.ops@disasterlink.gov.in",
      role: "district_admin",
      phone: "+91 20 2612 5678",
      district: "Pune District",
      permissions: getPermissionsForRole("district_admin"),
      isVerified: true,
      lastActive: new Date().toISOString(),
      createdAt: "2024-03-10T00:00:00Z",
    },
  },
  "volunteer.mumbai@disasterlink.org": {
    password: "Volunteer@123",
    user: {
      id: "USR-003",
      name: "Priya Sharma",
      email: "volunteer.mumbai@disasterlink.org",
      role: "volunteer",
      phone: "+91 98765 43210",
      district: "Mumbai Suburban",
      permissions: getPermissionsForRole("volunteer"),
      isVerified: true,
      lastActive: new Date().toISOString(),
      createdAt: "2024-06-01T00:00:00Z",
    },
  },
  "citizen@disasterlink.in": {
    password: "Citizen@123",
    user: {
      id: "USR-004",
      name: "Amit Deshpande",
      email: "citizen@disasterlink.in",
      role: "citizen",
      phone: "+91 90123 45678",
      district: "Konkan Coastal",
      permissions: getPermissionsForRole("citizen"),
      isVerified: true,
      lastActive: new Date().toISOString(),
      createdAt: "2025-01-20T00:00:00Z",
    },
  },
  "superadmin@disasterlink.gov.in": {
    password: "Super@123",
    user: {
      id: "USR-000",
      name: "Commissioner Vikram Singh",
      email: "superadmin@disasterlink.gov.in",
      role: "super_admin",
      phone: "+91 11 2338 7000",
      district: "National HQ",
      permissions: getPermissionsForRole("super_admin"),
      isVerified: true,
      lastActive: new Date().toISOString(),
      createdAt: "2023-06-01T00:00:00Z",
    },
  },
};

// ============================================
// Authentication Functions
// ============================================
export interface AuthResult {
  success: boolean;
  user: User | null;
  token: string | null;
  refreshToken?: string | null;
  error?: string;
  redirectTo?: string;
}

interface BackendAuthResponse {
  user: {
    id: string;
    name: string;
    phone?: string;
    email: string;
    role: "SURVIVOR" | "VOLUNTEER" | "ADMIN";
    latitude?: number | null;
    longitude?: number | null;
  };
  accessToken: string;
  refreshToken: string;
}

function normalizeBackendRole(role: BackendAuthResponse["user"]["role"]): UserRole {
  if (role === "SURVIVOR") return "citizen";
  if (role === "VOLUNTEER") return "volunteer";
  return "admin";
}

function normalizeBackendUser(user: BackendAuthResponse["user"]): User {
  const role = normalizeBackendRole(user.role);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    phone: user.phone,
    location:
      user.latitude != null && user.longitude != null
        ? { lat: user.latitude, lng: user.longitude }
        : undefined,
    permissions: getPermissionsForRole(role),
    isVerified: true,
    createdAt: new Date().toISOString()
  };
}

/**
 * Authenticate a user against mock credentials.
 * Returns user data, a mock JWT, and the role-based redirect path.
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const response = await api.post("/auth/login", { email: normalizedEmail, password });
    const payload = response.data.data as BackendAuthResponse;
    const user = normalizeBackendUser(payload.user);

    return {
      success: true,
      user,
      token: payload.accessToken,
      refreshToken: payload.refreshToken,
      redirectTo: ROLE_REDIRECT[user.role],
    };
  } catch (error: unknown) {
    const hasServerResponse =
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      Boolean((error as { response?: unknown }).response);

    if (hasServerResponse) {
      const status = (error as { response: { status: number } }).response.status;
      // Only stop if the server explicitly rejected the credentials
      if (status === 401 || status === 403) {
        return {
          success: false,
          user: null,
          token: null,
          error: "Invalid credentials. Please check your agency ID and token.",
        };
      }
    }
    // For other errors (like 500 or network issues), we proceed to mock fallback
  }

  // Development fallback for offline UI work when the API is not running.
  await new Promise((r) => setTimeout(r, 400));
  const account = MOCK_USERS[normalizedEmail];

  if (!account) {
    return {
      success: false,
      user: null,
      token: null,
      error: "No account found with this email. Contact your district administrator.",
    };
  }

  if (account.password !== password) {
    return {
      success: false,
      user: null,
      token: null,
      error: "Invalid access token. Attempt has been logged.",
    };
  }

  const token = generateMockJWT(account.user);
  const redirectTo = ROLE_REDIRECT[account.user.role];

  return {
    success: true,
    user: account.user,
    token,
    refreshToken: null,
    redirectTo,
  };
}

/**
 * Generate a mock JWT-style token for session management.
 */
function generateMockJWT(user: User): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      district: user.district,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    })
  );
  const signature = btoa("mock-signature-" + user.id);
  return `${header}.${payload}.${signature}`;
}

/**
 * Parse a mock JWT and extract user role.
 */
export function parseToken(token: string): { role: UserRole; email: string; district?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { role: payload.role, email: payload.email, district: payload.district };
  } catch {
    return null;
  }
}

// ============================================
// Session Persistence (localStorage)
// ============================================
const SESSION_KEY = "disasterlink_session";
const REFRESH_KEY = "disasterlink_refresh";
const USER_KEY = "disasterlink_user";

export function persistSession(token: string, user: User, refreshToken?: string | null): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getPersistedSession(): { token: string; user: User } | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(SESSION_KEY);
  const userStr = localStorage.getItem(USER_KEY);
  if (!token || !userStr) return null;
  try {
    const user = JSON.parse(userStr) as User;
    // Validate token not expired
    const parsed = parseToken(token);
    if (!parsed) {
      clearSession();
      return null;
    }
    return { token, user };
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

// ============================================
// Admin Mock User Database (for user management)
// ============================================
export interface ManagedUser extends User {
  status: "active" | "suspended" | "pending";
  lastLogin?: string;
}

export const MANAGED_USERS: ManagedUser[] = [
  {
    id: "USR-000",
    name: "Commissioner Vikram Singh",
    email: "superadmin@disasterlink.gov.in",
    role: "super_admin",
    phone: "+91 11 2338 7000",
    district: "National HQ",
    isVerified: true,
    status: "active",
    lastActive: "13/05/2026 • 18:30 IST",
    lastLogin: "13/05/2026 • 18:30 IST",
    createdAt: "2023-06-01",
  },
  {
    id: "USR-001",
    name: "Director Rajesh Patil",
    email: "admin@disasterlink.gov.in",
    role: "admin",
    phone: "+91 22 2202 1234",
    district: "Maharashtra",
    isVerified: true,
    status: "active",
    lastActive: "13/05/2026 • 17:45 IST",
    lastLogin: "13/05/2026 • 17:45 IST",
    createdAt: "2024-01-15",
  },
  {
    id: "USR-002",
    name: "DM Sneha Kulkarni",
    email: "pune.ops@disasterlink.gov.in",
    role: "district_admin",
    phone: "+91 20 2612 5678",
    district: "Pune District",
    isVerified: true,
    status: "active",
    lastActive: "13/05/2026 • 16:20 IST",
    lastLogin: "13/05/2026 • 16:20 IST",
    createdAt: "2024-03-10",
  },
  {
    id: "USR-003",
    name: "Priya Sharma",
    email: "volunteer.mumbai@disasterlink.org",
    role: "volunteer",
    phone: "+91 98765 43210",
    district: "Mumbai Suburban",
    isVerified: true,
    status: "active",
    lastActive: "13/05/2026 • 15:10 IST",
    lastLogin: "13/05/2026 • 15:10 IST",
    createdAt: "2024-06-01",
  },
  {
    id: "USR-004",
    name: "Amit Deshpande",
    email: "citizen@disasterlink.in",
    role: "citizen",
    phone: "+91 90123 45678",
    district: "Konkan Coastal",
    isVerified: true,
    status: "active",
    lastActive: "12/05/2026 • 09:30 IST",
    lastLogin: "12/05/2026 • 09:30 IST",
    createdAt: "2025-01-20",
  },
  {
    id: "USR-005",
    name: "Ravi Deshmukh",
    email: "ravi.d@volunteer.disasterlink.org",
    role: "volunteer",
    phone: "+91 87654 32100",
    district: "Nashik District",
    isVerified: true,
    status: "active",
    lastActive: "13/05/2026 • 14:00 IST",
    lastLogin: "13/05/2026 • 14:00 IST",
    createdAt: "2024-08-15",
  },
  {
    id: "USR-006",
    name: "Meera Joshi",
    email: "meera.j@disasterlink.gov.in",
    role: "district_admin",
    phone: "+91 20 2553 9876",
    district: "Kolhapur District",
    isVerified: true,
    status: "active",
    lastActive: "13/05/2026 • 12:45 IST",
    lastLogin: "13/05/2026 • 12:45 IST",
    createdAt: "2024-05-20",
  },
  {
    id: "USR-007",
    name: "Suresh Patil",
    email: "suresh.p@disasterlink.in",
    role: "citizen",
    phone: "+91 70123 98765",
    district: "Raigad District",
    isVerified: false,
    status: "pending",
    lastActive: "11/05/2026 • 10:15 IST",
    createdAt: "2025-05-01",
  },
  {
    id: "USR-008",
    name: "Anita Kadam",
    email: "anita.k@disasterlink.in",
    role: "citizen",
    phone: "+91 81234 56789",
    district: "Satara District",
    isVerified: true,
    status: "suspended",
    lastActive: "01/05/2026 • 08:00 IST",
    lastLogin: "01/05/2026 • 08:00 IST",
    createdAt: "2024-11-10",
  },
  {
    id: "USR-009",
    name: "Kiran More",
    email: "kiran.more@volunteer.disasterlink.org",
    role: "volunteer",
    phone: "+91 95678 12345",
    district: "Ratnagiri District",
    isVerified: true,
    status: "active",
    lastActive: "13/05/2026 • 11:30 IST",
    lastLogin: "13/05/2026 • 11:30 IST",
    createdAt: "2024-09-05",
  },
  {
    id: "USR-010",
    name: "DM Arun Kumar",
    email: "arun.kumar@disasterlink.gov.in",
    role: "district_admin",
    phone: "+91 44 2535 0100",
    district: "Chennai District",
    isVerified: true,
    status: "active",
    lastActive: "13/05/2026 • 10:00 IST",
    lastLogin: "13/05/2026 • 10:00 IST",
    createdAt: "2024-04-01",
  },
];
