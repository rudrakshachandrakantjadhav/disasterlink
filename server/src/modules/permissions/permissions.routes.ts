import { Router } from "express";
import { permissionCatalog } from "./permissions.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/role.middleware.js";
import { sendSuccess } from "../../utils/response.js";

export const permissionsRouter = Router();

permissionsRouter.get("/", requireAuth, requirePermission("permissions.view", "roles.manage"), (_req, res) => {
  return sendSuccess(res, permissionCatalog, "Permissions loaded");
});
