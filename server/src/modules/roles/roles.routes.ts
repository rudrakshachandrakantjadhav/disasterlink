import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/role.middleware.js";
import {
  activeSessions,
  auditLogs,
  getPermissionCatalog,
  getRole,
  getRoles,
  patchRole,
  postAssignRole,
  postRole,
  removeRole
} from "./roles.controller.js";

export const rolesRouter = Router();

rolesRouter.use(requireAuth);
rolesRouter.get("/", requirePermission("roles.view", "roles.manage"), getRoles);
rolesRouter.get("/permissions", requirePermission("permissions.view", "roles.manage"), getPermissionCatalog);
rolesRouter.get("/audit", requirePermission("audit.view", "roles.manage"), auditLogs);
rolesRouter.get("/sessions", requirePermission("sessions.view", "roles.manage"), activeSessions);
rolesRouter.post("/", requirePermission("roles.manage"), postRole);
rolesRouter.post("/assign", requirePermission("users.assign_roles", "roles.manage"), postAssignRole);
rolesRouter.get("/:slug", requirePermission("roles.view", "roles.manage"), getRole);
rolesRouter.patch("/:slug", requirePermission("roles.manage"), patchRole);
rolesRouter.delete("/:slug", requirePermission("roles.manage"), removeRole);
