import { Router } from "express";
import { createAlert, deleteAlert, listAlerts } from "../controllers/alert.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";

export const alertRouter = Router();

alertRouter.get("/", listAlerts);
alertRouter.post("/", requireAuth, requirePermission("alerts.create", "alerts.broadcast"), createAlert);
alertRouter.delete("/:id", requireAuth, requirePermission("alerts.delete", "alerts.broadcast"), deleteAlert);
