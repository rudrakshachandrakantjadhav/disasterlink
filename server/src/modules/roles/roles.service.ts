import { Prisma, type Role } from "@prisma/client";
import { prisma } from "../../config/database.js";
import { defaultRoleDefinitions, permissionCatalog } from "../permissions/permissions.js";
import { getDefaultDashboard, resolveAccess } from "../permissions/rbac.js";

export interface RoleInput {
  slug?: string;
  name: string;
  description?: string;
  hierarchyLevel: number;
  accessScope: string;
  modules?: string[];
  dashboards?: string[];
  crud?: Record<string, string[]>;
  geographicScope?: unknown;
  featureAccess?: string[];
  permissionKeys?: string[];
}

let defaultRbacReady = false;
let defaultRbacPromise: Promise<void> | null = null;

export async function ensureDefaultRbac() {
  if (defaultRbacReady) return;
  if (defaultRbacPromise) return defaultRbacPromise;

  defaultRbacPromise = seedDefaultRbac()
    .then(() => {
      defaultRbacReady = true;
    })
    .finally(() => {
      defaultRbacPromise = null;
    });

  return defaultRbacPromise;
}

async function seedDefaultRbac() {
  const [permissionCount, roleCount] = await Promise.all([
    prisma.permission.count({ where: { key: { in: permissionCatalog.map((permission) => permission.key) } } }),
    prisma.role.count({ where: { slug: { in: defaultRoleDefinitions.map((role) => role.slug) } } })
  ]);

  if (permissionCount >= permissionCatalog.length && roleCount >= defaultRoleDefinitions.length) {
    return;
  }

  await prisma.permission.createMany({
    data: permissionCatalog.map((permission) => ({
      key: permission.key,
      module: permission.module,
      action: permission.action,
      description: permission.description,
      isSystem: true
    })),
    skipDuplicates: true
  });

  for (const role of defaultRoleDefinitions) {
    const savedRole = await prisma.role.upsert({
      where: { slug: role.slug },
      update: {
        name: role.name,
        description: role.description,
        hierarchyLevel: role.hierarchyLevel,
        accessScope: role.accessScope,
        modules: role.modules,
        dashboards: role.dashboards,
        crud: role.crud,
        featureAccess: role.modules,
        isSystem: true,
        isActive: true
      },
      create: {
        slug: role.slug,
        name: role.name,
        description: role.description,
        hierarchyLevel: role.hierarchyLevel,
        accessScope: role.accessScope,
        modules: role.modules,
        dashboards: role.dashboards,
        crud: role.crud,
        featureAccess: role.modules,
        isSystem: true,
        isActive: true
      }
    });

    const permissions = await prisma.permission.findMany({
      where: { key: { in: role.permissions } },
      select: { id: true }
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({ roleId: savedRole.id, permissionId: permission.id })),
      skipDuplicates: true
    });
  }
}

export async function listRoles() {
  return prisma.role.findMany({
    orderBy: [{ hierarchyLevel: "asc" }, { name: "asc" }],
    include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } }
  });
}

export async function getRoleBySlug(slug: string) {
  return prisma.role.findUnique({
    where: { slug },
    include: { permissions: { include: { permission: true } }, users: { include: { user: true } } }
  });
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export async function createRole(input: RoleInput, actorId?: string) {
  await ensureDefaultRbac();
  const slug = input.slug ? slugify(input.slug) : slugify(input.name);
  const role = await prisma.role.create({
    data: {
      slug,
      name: input.name,
      description: input.description,
      hierarchyLevel: input.hierarchyLevel,
      accessScope: input.accessScope,
      modules: input.modules ?? [],
      dashboards: input.dashboards ?? [],
      crud: input.crud ?? {},
      geographicScope: input.geographicScope ?? {},
      featureAccess: input.featureAccess ?? [],
      isSystem: false,
      permissions: {
        create: await permissionConnectData(input.permissionKeys ?? [])
      }
    },
    include: { permissions: { include: { permission: true } } }
  });
  await audit(actorId, "roles.create", "roles", "HIGH", { role: slug });
  return role;
}

export async function updateRole(slug: string, input: Partial<RoleInput>, actorId?: string) {
  await ensureDefaultRbac();
  const existing = await prisma.role.findUniqueOrThrow({ where: { slug } });
  const data: Prisma.RoleUpdateInput = {
    name: input.name,
    description: input.description,
    hierarchyLevel: input.hierarchyLevel,
    accessScope: input.accessScope,
    modules: input.modules,
    dashboards: input.dashboards,
    crud: input.crud,
    geographicScope: input.geographicScope as Prisma.InputJsonValue | undefined,
    featureAccess: input.featureAccess
  };

  if (input.permissionKeys) {
    await prisma.rolePermission.deleteMany({ where: { roleId: existing.id } });
    data.permissions = { create: await permissionConnectData(input.permissionKeys) };
  }

  const role = await prisma.role.update({
    where: { slug },
    data,
    include: { permissions: { include: { permission: true } } }
  });
  await audit(actorId, "roles.edit", "roles", "HIGH", { role: slug });
  return role;
}

export async function deleteRole(slug: string, actorId?: string) {
  const role = await prisma.role.findUniqueOrThrow({ where: { slug } });
  if (role.isSystem) {
    throw new Error("System roles cannot be deleted");
  }
  await prisma.role.delete({ where: { slug } });
  await audit(actorId, "roles.delete", "roles", "CRITICAL", { role: slug });
}

export async function assignRole(userId: string, roleSlug: string, actorId?: string, scope?: { district?: string; state?: string; country?: string }) {
  await ensureDefaultRbac();
  const role = await prisma.role.findUniqueOrThrow({ where: { slug: roleSlug } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: { district: scope?.district, state: scope?.state, country: scope?.country ?? "India", assignedBy: actorId },
    create: { userId, roleId: role.id, district: scope?.district, state: scope?.state, country: scope?.country ?? "India", assignedBy: actorId }
  });
  await prisma.user.update({
    where: { id: userId },
    data: {
      role: role.slug,
      primaryRoleId: role.id,
      district: scope?.district,
      state: scope?.state,
      country: scope?.country ?? "India",
      volunteerProfile: role.slug === "volunteer" ? { upsert: { create: {}, update: {} } } : undefined
    }
  });
  await audit(actorId, "users.assign_roles", "users", "HIGH", { userId, role: role.slug });
}

export async function resolveUserAccess(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      primaryRole: { include: { permissions: { include: { permission: true } } } },
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } }
    }
  });

  const roles = [
    ...user.roles.map((entry) => entry.role),
    ...(user.primaryRole ? [user.primaryRole] : [])
  ].filter((role, index, all) => all.findIndex((item) => item.id === role.id) === index);

  return resolveAccess(user.role, roles);
}

export function publicRole(role: Role & { permissions?: Array<{ permission: { key: string } }> }) {
  return {
    id: role.id,
    slug: role.slug,
    name: role.name,
    description: role.description,
    hierarchyLevel: role.hierarchyLevel,
    accessScope: role.accessScope,
    modules: role.modules,
    dashboards: role.dashboards,
    crud: role.crud,
    geographicScope: role.geographicScope,
    featureAccess: role.featureAccess,
    isSystem: role.isSystem,
    isActive: role.isActive,
    permissions: role.permissions?.map((entry) => entry.permission.key) ?? []
  };
}

export function dashboardForAccess(access: { dashboards: string[]; primaryRole: string }) {
  return getDefaultDashboard(access);
}

async function permissionConnectData(permissionKeys: string[]) {
  const permissions = await prisma.permission.findMany({
    where: { key: { in: permissionKeys } },
    select: { id: true }
  });
  return permissions.map((permission) => ({ permission: { connect: { id: permission.id } } }));
}

async function audit(userId: string | undefined, action: string, module: string, severity: string, metadata: Prisma.InputJsonValue) {
  await prisma.auditLog.create({
    data: { userId, action, module, severity, metadata }
  });
}
