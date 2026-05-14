export const PERMISSIONS = {
  USERS_CREATE: "users.create",
  USERS_VIEW: "users.view",
  USERS_EDIT: "users.edit",
  USERS_DELETE: "users.delete",
  USERS_ASSIGN_ROLES: "users.assign_roles",

  ROLES_MANAGE: "roles.manage",
  ROLES_VIEW: "roles.view",
  PERMISSIONS_MANAGE: "permissions.manage",
  PERMISSIONS_VIEW: "permissions.view",

  INCIDENTS_VIEW: "incidents.view",
  INCIDENTS_CREATE: "incidents.create",
  INCIDENTS_MANAGE: "incidents.manage",
  INCIDENTS_CLOSE: "incidents.close",

  SOS_CREATE: "sos.create",
  SOS_VIEW_OWN: "sos.view_own",
  SOS_VIEW_ALL: "sos.view_all",
  SOS_STATUS_UPDATE: "sos.status_update",

  ALERTS_VIEW: "alerts.view",
  ALERTS_CREATE: "alerts.create",
  ALERTS_BROADCAST: "alerts.broadcast",
  ALERTS_DELETE: "alerts.delete",

  VOLUNTEERS_VIEW: "volunteers.view",
  VOLUNTEERS_ASSIGN: "volunteers.assign",
  VOLUNTEERS_MANAGE: "volunteers.manage",
  VOLUNTEERS_RESPOND: "volunteers.respond",

  SHELTERS_VIEW: "shelters.view",
  SHELTERS_CREATE: "shelters.create",
  SHELTERS_MANAGE: "shelters.manage",

  ANALYTICS_VIEW: "analytics.view",
  ANALYTICS_NATIONAL: "analytics.national",
  ANALYTICS_SYSTEM: "analytics.system",

  MAP_VIEW: "map.view",
  MAP_FULL_ACCESS: "map.full_access",

  AUDIT_VIEW: "audit.view",
  CONFIG_MANAGE: "config.manage",
  NOTIFICATIONS_MANAGE: "notifications.manage",
  EMERGENCY_OVERRIDE: "emergency.override",
  SESSIONS_VIEW: "sessions.view",
  REGIONS_MANAGE: "regions.manage"
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface PermissionDefinition {
  key: PermissionKey;
  module: string;
  action: string;
  description: string;
}

export const permissionCatalog: PermissionDefinition[] = Object.values(PERMISSIONS).map((key) => {
  const [module, action] = key.split(".");
  return {
    key,
    module,
    action,
    description: `${action.replaceAll("_", " ")} access for ${module}`
  };
});

export interface RoleDefinition {
  slug: string;
  name: string;
  description: string;
  hierarchyLevel: number;
  accessScope: "self" | "mission" | "district" | "state" | "national" | "global";
  modules: string[];
  dashboards: string[];
  crud: Record<string, string[]>;
  permissions: PermissionKey[];
}

const citizenPermissions = [
  PERMISSIONS.SOS_CREATE,
  PERMISSIONS.SOS_VIEW_OWN,
  PERMISSIONS.ALERTS_VIEW,
  PERMISSIONS.SHELTERS_VIEW,
  PERMISSIONS.MAP_VIEW
];

const volunteerPermissions = [
  ...citizenPermissions,
  PERMISSIONS.VOLUNTEERS_RESPOND,
  PERMISSIONS.SOS_VIEW_ALL,
  PERMISSIONS.SOS_STATUS_UPDATE
];

const coordinatorPermissions = [
  ...volunteerPermissions,
  PERMISSIONS.INCIDENTS_VIEW,
  PERMISSIONS.VOLUNTEERS_ASSIGN,
  PERMISSIONS.SHELTERS_VIEW,
  PERMISSIONS.ANALYTICS_VIEW
];

const districtAdminPermissions = [
  ...coordinatorPermissions,
  PERMISSIONS.USERS_VIEW,
  PERMISSIONS.USERS_EDIT,
  PERMISSIONS.INCIDENTS_CREATE,
  PERMISSIONS.INCIDENTS_MANAGE,
  PERMISSIONS.ALERTS_CREATE,
  PERMISSIONS.SHELTERS_CREATE,
  PERMISSIONS.SHELTERS_MANAGE
];

const stateAdminPermissions = [
  ...districtAdminPermissions,
  PERMISSIONS.USERS_CREATE,
  PERMISSIONS.USERS_ASSIGN_ROLES,
  PERMISSIONS.ALERTS_BROADCAST,
  PERMISSIONS.VOLUNTEERS_MANAGE,
  PERMISSIONS.ANALYTICS_NATIONAL,
  PERMISSIONS.MAP_FULL_ACCESS
];

const nationalAdminPermissions = [
  ...stateAdminPermissions,
  PERMISSIONS.USERS_DELETE,
  PERMISSIONS.ALERTS_DELETE,
  PERMISSIONS.AUDIT_VIEW,
  PERMISSIONS.NOTIFICATIONS_MANAGE,
  PERMISSIONS.SESSIONS_VIEW,
  PERMISSIONS.REGIONS_MANAGE
];

export const defaultRoleDefinitions: RoleDefinition[] = [
  {
    slug: "citizen",
    name: "Citizen",
    description: "Public survivor access for SOS, shelters, alerts, and personal request history.",
    hierarchyLevel: 10,
    accessScope: "self",
    modules: ["dashboard", "sos", "alerts", "shelters", "map"],
    dashboards: ["/dashboard"],
    crud: { sos: ["create", "read_own"] },
    permissions: citizenPermissions
  },
  {
    slug: "volunteer",
    name: "Volunteer",
    description: "Field responder access for missions, assigned SOS tasks, and navigation.",
    hierarchyLevel: 20,
    accessScope: "mission",
    modules: ["volunteer", "sos", "map", "shelters"],
    dashboards: ["/volunteer"],
    crud: { sos: ["read", "update_status"], volunteerTasks: ["read", "accept", "complete"] },
    permissions: volunteerPermissions
  },
  {
    slug: "district_coordinator",
    name: "District Coordinator",
    description: "Coordinates district-level incidents, volunteers, and shelters.",
    hierarchyLevel: 30,
    accessScope: "district",
    modules: ["district", "incidents", "volunteers", "shelters", "analytics", "map"],
    dashboards: ["/admin"],
    crud: { incidents: ["read"], volunteers: ["assign"], shelters: ["read"] },
    permissions: coordinatorPermissions
  },
  {
    slug: "district_admin",
    name: "District Admin",
    description: "Administrative command for one district with user and operations control.",
    hierarchyLevel: 40,
    accessScope: "district",
    modules: ["admin", "users", "incidents", "alerts", "volunteers", "shelters", "analytics", "map"],
    dashboards: ["/admin"],
    crud: { users: ["read", "update"], incidents: ["create", "read", "update"], shelters: ["create", "read", "update"] },
    permissions: districtAdminPermissions
  },
  {
    slug: "state_admin",
    name: "State Admin",
    description: "Statewide command authority across districts and emergency operations.",
    hierarchyLevel: 50,
    accessScope: "state",
    modules: ["admin", "users", "incidents", "alerts", "volunteers", "shelters", "analytics", "map"],
    dashboards: ["/admin"],
    crud: { users: ["create", "read", "update"], incidents: ["create", "read", "update"], alerts: ["create", "broadcast"] },
    permissions: stateAdminPermissions
  },
  {
    slug: "national_admin",
    name: "National Admin",
    description: "National operations authority with cross-state monitoring and governance.",
    hierarchyLevel: 60,
    accessScope: "national",
    modules: ["admin", "users", "incidents", "alerts", "volunteers", "shelters", "analytics", "audit", "map"],
    dashboards: ["/admin"],
    crud: { users: ["create", "read", "update", "delete"], incidents: ["manage"], alerts: ["manage"] },
    permissions: nationalAdminPermissions
  },
  {
    slug: "super_admin",
    name: "Super Admin",
    description: "Unrestricted platform authority for roles, permissions, configuration, audit, and emergency override.",
    hierarchyLevel: 100,
    accessScope: "global",
    modules: ["*"],
    dashboards: ["/admin/super", "/admin"],
    crud: { "*": ["create", "read", "update", "delete", "override"] },
    permissions: Object.values(PERMISSIONS)
  }
];

export const defaultDashboardByRole = new Map(
  defaultRoleDefinitions.map((role) => [role.slug, role.dashboards[0]])
);
