import type { UserRole } from "@/types";

// ============================================
// Permission Definitions
// ============================================
export const PERMISSIONS = {
  // User Management
  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_EDIT: "user:edit",
  USER_DELETE: "user:delete",
  USER_SUSPEND: "user:suspend",
  USER_RESET_PASSWORD: "user:reset_password",
  USER_CHANGE_ROLE: "user:change_role",

  // Volunteer Management
  VOLUNTEER_DEPLOY: "volunteer:deploy",
  VOLUNTEER_ASSIGN_SECTOR: "volunteer:assign_sector",
  VOLUNTEER_TRACK: "volunteer:track",
  VOLUNTEER_APPROVE: "volunteer:approve",
  VOLUNTEER_MANAGE_MISSIONS: "volunteer:manage_missions",

  // Incident Management
  INCIDENT_CREATE: "incident:create",
  INCIDENT_UPDATE: "incident:update",
  INCIDENT_CLOSE: "incident:close",
  INCIDENT_ESCALATE: "incident:escalate",
  INCIDENT_ASSIGN_TEAMS: "incident:assign_teams",
  INCIDENT_VIEW: "incident:view",

  // Shelter Management
  SHELTER_ADD: "shelter:add",
  SHELTER_EDIT: "shelter:edit",
  SHELTER_TOGGLE: "shelter:toggle",
  SHELTER_MONITOR: "shelter:monitor",

  // Alert Management
  ALERT_BROADCAST: "alert:broadcast",
  ALERT_DISTRICT_WARNING: "alert:district_warning",
  ALERT_PUSH_NOTIFICATION: "alert:push_notification",
  ALERT_MANAGE_SEVERITY: "alert:manage_severity",

  // Analytics
  ANALYTICS_NATIONAL: "analytics:national",
  ANALYTICS_DISTRICT: "analytics:district",
  ANALYTICS_METRICS: "analytics:metrics",
  ANALYTICS_RESOURCES: "analytics:resources",

  // Super Admin
  PLATFORM_CONFIG: "platform:config",
  DISTRICT_ADMIN_CREATE: "district_admin:create",
  SYSTEM_MONITOR: "system:monitor",
  AUDIT_LOGS: "audit:logs",
  EMERGENCY_OVERRIDE: "emergency:override",

  // Basic
  DASHBOARD_VIEW: "dashboard:view",
  SOS_SEND: "sos:send",
  SHELTER_VIEW: "shelter:view",
  ALERT_VIEW: "alert:view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ============================================
// Role-Permission Mapping
// ============================================
const CITIZEN_PERMISSIONS: Permission[] = [
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.SOS_SEND,
  PERMISSIONS.SHELTER_VIEW,
  PERMISSIONS.ALERT_VIEW,
  PERMISSIONS.INCIDENT_VIEW,
];

const VOLUNTEER_PERMISSIONS: Permission[] = [
  ...CITIZEN_PERMISSIONS,
  PERMISSIONS.VOLUNTEER_TRACK,
  PERMISSIONS.SHELTER_MONITOR,
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...VOLUNTEER_PERMISSIONS,
  PERMISSIONS.USER_VIEW,
  PERMISSIONS.USER_CREATE,
  PERMISSIONS.USER_EDIT,
  PERMISSIONS.USER_DELETE,
  PERMISSIONS.USER_SUSPEND,
  PERMISSIONS.USER_RESET_PASSWORD,
  PERMISSIONS.USER_CHANGE_ROLE,
  PERMISSIONS.VOLUNTEER_DEPLOY,
  PERMISSIONS.VOLUNTEER_ASSIGN_SECTOR,
  PERMISSIONS.VOLUNTEER_APPROVE,
  PERMISSIONS.VOLUNTEER_MANAGE_MISSIONS,
  PERMISSIONS.INCIDENT_CREATE,
  PERMISSIONS.INCIDENT_UPDATE,
  PERMISSIONS.INCIDENT_CLOSE,
  PERMISSIONS.INCIDENT_ESCALATE,
  PERMISSIONS.INCIDENT_ASSIGN_TEAMS,
  PERMISSIONS.SHELTER_ADD,
  PERMISSIONS.SHELTER_EDIT,
  PERMISSIONS.SHELTER_TOGGLE,
  PERMISSIONS.ALERT_BROADCAST,
  PERMISSIONS.ALERT_DISTRICT_WARNING,
  PERMISSIONS.ALERT_PUSH_NOTIFICATION,
  PERMISSIONS.ALERT_MANAGE_SEVERITY,
  PERMISSIONS.ANALYTICS_NATIONAL,
  PERMISSIONS.ANALYTICS_DISTRICT,
  PERMISSIONS.ANALYTICS_METRICS,
  PERMISSIONS.ANALYTICS_RESOURCES,
];

const DISTRICT_ADMIN_PERMISSIONS: Permission[] = [
  ...VOLUNTEER_PERMISSIONS,
  PERMISSIONS.USER_VIEW,
  PERMISSIONS.USER_CREATE,
  PERMISSIONS.USER_EDIT,
  PERMISSIONS.VOLUNTEER_DEPLOY,
  PERMISSIONS.VOLUNTEER_ASSIGN_SECTOR,
  PERMISSIONS.VOLUNTEER_APPROVE,
  PERMISSIONS.INCIDENT_CREATE,
  PERMISSIONS.INCIDENT_UPDATE,
  PERMISSIONS.INCIDENT_CLOSE,
  PERMISSIONS.INCIDENT_ASSIGN_TEAMS,
  PERMISSIONS.SHELTER_ADD,
  PERMISSIONS.SHELTER_EDIT,
  PERMISSIONS.SHELTER_TOGGLE,
  PERMISSIONS.ALERT_DISTRICT_WARNING,
  PERMISSIONS.ALERT_PUSH_NOTIFICATION,
  PERMISSIONS.ANALYTICS_DISTRICT,
  PERMISSIONS.ANALYTICS_METRICS,
];

const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
  PERMISSIONS.PLATFORM_CONFIG,
  PERMISSIONS.DISTRICT_ADMIN_CREATE,
  PERMISSIONS.SYSTEM_MONITOR,
  PERMISSIONS.AUDIT_LOGS,
  PERMISSIONS.EMERGENCY_OVERRIDE,
];

// ============================================
// Permission Resolution
// ============================================
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  citizen: CITIZEN_PERMISSIONS,
  volunteer: VOLUNTEER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  district_admin: DISTRICT_ADMIN_PERMISSIONS,
  super_admin: SUPER_ADMIN_PERMISSIONS,
};

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || CITIZEN_PERMISSIONS;
}

export function hasPermission(userPermissions: Permission[], required: Permission): boolean {
  return userPermissions.includes(required);
}

export function hasAnyPermission(userPermissions: Permission[], required: Permission[]): boolean {
  return required.some((p) => userPermissions.includes(p));
}

export function hasAllPermissions(userPermissions: Permission[], required: Permission[]): boolean {
  return required.every((p) => userPermissions.includes(p));
}

// ============================================
// Route Access Mapping
// ============================================
export const ROLE_REDIRECT: Record<UserRole, string> = {
  citizen: "/dashboard",
  volunteer: "/volunteer",
  admin: "/admin",
  district_admin: "/admin",
  super_admin: "/admin",
};

export const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/dashboard": ["citizen", "volunteer", "admin", "district_admin", "super_admin"],
  "/volunteer": ["volunteer", "admin", "district_admin", "super_admin"],
  "/admin": ["admin", "district_admin", "super_admin"],
  "/admin/incidents": ["admin", "district_admin", "super_admin"],
  "/admin/analytics": ["admin", "district_admin", "super_admin"],
  "/admin/volunteers": ["admin", "district_admin", "super_admin"],
  "/admin/notifications": ["admin", "super_admin"],
  "/admin/shelters": ["admin", "district_admin", "super_admin"],
  "/admin/users": ["admin", "super_admin"],
  "/admin/audit": ["super_admin"],
  "/admin/system": ["super_admin"],
};

export function canAccessRoute(role: UserRole, path: string): boolean {
  // Public routes
  const publicPaths = ["/", "/login", "/register", "/about", "/alerts", "/shelters", "/contact", "/help"];
  if (publicPaths.some((p) => path === p || path.startsWith(p + "/"))) return true;

  // Check exact match first
  if (ROUTE_ROLES[path]) {
    return ROUTE_ROLES[path].includes(role);
  }

  // Check prefix match for nested routes
  const matchedPrefix = Object.keys(ROUTE_ROLES)
    .filter((r) => path.startsWith(r))
    .sort((a, b) => b.length - a.length)[0];

  if (matchedPrefix) {
    return ROUTE_ROLES[matchedPrefix].includes(role);
  }

  // Default: allow access (for non-protected pages)
  return true;
}

// ============================================
// Role Display Info
// ============================================
export const ROLE_LABELS: Record<UserRole, string> = {
  citizen: "Citizen",
  volunteer: "Volunteer",
  admin: "Administrator",
  district_admin: "District Admin",
  super_admin: "Super Administrator",
};

export const ROLE_BADGE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  citizen: { bg: "bg-surface-container-high", text: "text-on-surface-variant" },
  volunteer: { bg: "bg-tertiary-container", text: "text-on-tertiary-container" },
  admin: { bg: "bg-primary", text: "text-on-primary" },
  district_admin: { bg: "bg-secondary-container", text: "text-on-secondary-container" },
  super_admin: { bg: "bg-error", text: "text-on-error" },
};
