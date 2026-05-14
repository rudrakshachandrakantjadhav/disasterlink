import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/database.js";
import { sendError, sendSuccess } from "../../utils/response.js";
import { assignRole, createRole, deleteRole, getRoleBySlug, listRoles, publicRole, updateRole } from "./roles.service.js";
import { permissionCatalog } from "../permissions/permissions.js";

const roleSchema = z.object({
  slug: z.string().min(2).optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  hierarchyLevel: z.coerce.number().int().min(1).max(100),
  accessScope: z.string().min(2),
  modules: z.array(z.string()).default([]),
  dashboards: z.array(z.string()).default([]),
  crud: z.record(z.array(z.string())).default({}),
  geographicScope: z.unknown().optional(),
  featureAccess: z.array(z.string()).default([]),
  permissionKeys: z.array(z.string()).default([])
});

const assignRoleSchema = z.object({
  userId: z.string().min(1),
  roleSlug: z.string().min(1),
  district: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional()
});

export async function getRoles(_req: Request, res: Response) {
  const roles = await listRoles();
  return sendSuccess(res, roles.map(publicRole), "Roles loaded");
}

export async function getRole(req: Request, res: Response) {
  const role = await getRoleBySlug(String(req.params.slug));
  if (!role) return sendError(res, "Role not found", 404);
  return sendSuccess(res, publicRole(role), "Role loaded");
}

export async function postRole(req: Request, res: Response) {
  const input = roleSchema.parse(req.body);
  const role = await createRole(input, req.user?.id);
  return sendSuccess(res, publicRole(role), "Role created", 201);
}

export async function patchRole(req: Request, res: Response) {
  const input = roleSchema.partial().parse(req.body);
  const role = await updateRole(String(req.params.slug), input, req.user?.id);
  return sendSuccess(res, publicRole(role), "Role updated");
}

export async function removeRole(req: Request, res: Response) {
  try {
    await deleteRole(String(req.params.slug), req.user?.id);
    return sendSuccess(res, null, "Role deleted");
  } catch (error) {
    return sendError(res, error instanceof Error ? error.message : "Role could not be deleted", 400);
  }
}

export async function postAssignRole(req: Request, res: Response) {
  const input = assignRoleSchema.parse(req.body);
  await assignRole(input.userId, input.roleSlug, req.user?.id, input);
  return sendSuccess(res, null, "Role assigned");
}

export async function getPermissionCatalog(_req: Request, res: Response) {
  return sendSuccess(res, permissionCatalog, "Permissions loaded");
}

export async function auditLogs(_req: Request, res: Response) {
  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  return sendSuccess(res, logs, "Audit logs loaded");
}

export async function activeSessions(_req: Request, res: Response) {
  const sessions = await prisma.activeSession.findMany({
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { lastSeenAt: "desc" },
    take: 200
  });
  return sendSuccess(res, sessions, "Active sessions loaded");
}
