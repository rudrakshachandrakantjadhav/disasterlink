import { Router } from "express";
import { heatmap, liveMap, mapShelters } from "../controllers/map.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";

const mapRoutes = Router();
export const mapRouter = mapRoutes;

mapRoutes.get("/shelters", mapShelters);
mapRoutes.get("/live", requireAuth, requirePermission("map.view", "map.full_access"), liveMap);
mapRoutes.get("/heatmap", requireAuth, requirePermission("map.full_access", "analytics.view"), heatmap);

export default mapRoutes;
export { mapRoutes };
