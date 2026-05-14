import type { Role, Permission } from "@prisma/client";
import { defaultDashboardByRole, PERMISSIONS, type PermissionKey } from "./permissions.js";

export interface ResolvedRole {
  id: string;
  slug: string;
  name: string;
  hierarchyLevel: number;
  accessScope: string;
  modules: string[];
  dashboards: string[];
  crud: Record<string, string[]>;
  geographicScope: unknown;
  featureAccess: string[];
}

export interface ResolvedAccess {
  primaryRole: string;
  roles: ResolvedRole[];
  permissions: string[];
  hierarchyLevel: number;
  accessScope: string;
  dashboards: string[];
  modules: string[];
}

type RoleWithPermissions = Role & {
  permissions: Array<{ permission: Permission }>;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asCrud(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, actions]) => [key, asStringArray(actions)])
  );
}

export function resolveAccess(primaryRole: string, roles: RoleWithPermissions[]): ResolvedAccess {
  const resolvedRoles = roles.map((role) => ({
    id: role.id,
    slug: role.slug,
    name: role.name,
    hierarchyLevel: role.hierarchyLevel,
    accessScope: role.accessScope,
    modules: asStringArray(role.modules),
    dashboards: asStringArray(role.dashboards),
    crud: asCrud(role.crud),
    geographicScope: role.geographicScope,
    featureAccess: asStringArray(role.featureAccess)
  }));

  const permissions = Array.from(
    new Set(roles.flatMap((role) => role.permissions.map((entry) => entry.permission.key)))
  ).sort();
  const modules = Array.from(new Set(resolvedRoles.flatMap((role) => role.modules))).sort();
  const dashboards = Array.from(new Set(resolvedRoles.flatMap((role) => role.dashboards)));
  const highest = resolvedRoles.reduce<ResolvedRole | undefined>(
    (current, role) => (!current || role.hierarchyLevel > current.hierarchyLevel ? role : current),
    undefined
  );

  return {
    primaryRole,
    roles: resolvedRoles,
    permissions,
    hierarchyLevel: highest?.hierarchyLevel ?? 0,
    accessScope: highest?.accessScope ?? "self",
    dashboards: dashboards.length > 0 ? dashboards : [defaultDashboardByRole.get(primaryRole) ?? "/dashboard"],
    modules
  };
}

export function hasPermission(access: Pick<ResolvedAccess, "permissions"> | undefined, permission: PermissionKey | string) {
  if (!access) return false;
  return access.permissions.includes(permission) || access.permissions.includes(PERMISSIONS.EMERGENCY_OVERRIDE);
}

export function hasAnyPermission(access: Pick<ResolvedAccess, "permissions"> | undefined, permissions: Array<PermissionKey | string>) {
  return permissions.some((permission) => hasPermission(access, permission));
}

export function getDefaultDashboard(access: Pick<ResolvedAccess, "dashboards" | "primaryRole">) {
  return access.dashboards[0] ?? defaultDashboardByRole.get(access.primaryRole) ?? "/dashboard";
}
