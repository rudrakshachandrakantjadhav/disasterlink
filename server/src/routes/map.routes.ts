import { Router } from "express";
import { Role } from "@prisma/client";
import { heatmap, liveMap, mapShelters } from "../controllers/map.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

export const mapRouter = Router();

mapRouter.get("/shelters", mapShelters);
mapRouter.get("/live", requireAuth, liveMap);
mapRouter.get("/heatmap", requireAuth, requireRole(Role.ADMIN, Role.VOLUNTEER), heatmap);
