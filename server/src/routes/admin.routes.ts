import { Router } from "express";
import { analytics, broadcast, heatmap, incidents, volunteers } from "../controllers/admin.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.get("/analytics", requirePermission("analytics.view", "analytics.national"), analytics);
adminRouter.get("/incidents", requirePermission("incidents.view", "incidents.manage"), incidents);
adminRouter.get("/volunteers", requirePermission("volunteers.view", "volunteers.manage"), volunteers);
adminRouter.post("/broadcast", requirePermission("alerts.broadcast", "emergency.override"), broadcast);
adminRouter.get("/heatmap", requirePermission("map.full_access", "analytics.view"), heatmap);
