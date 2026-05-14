import { Router } from "express";
import { createSosRequest, getSos, mySos, nearbySos, updateSosStatus } from "../controllers/sos.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";
import { sosRateLimiter } from "../middleware/rateLimit.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

export const sosRouter = Router();

sosRouter.use(requireAuth);
sosRouter.post("/create", sosRateLimiter, upload.single("image"), createSosRequest);
sosRouter.get("/nearby", requirePermission("sos.view_all", "incidents.view"), nearbySos);
sosRouter.get("/my", mySos);
sosRouter.get("/:id", getSos);
sosRouter.patch("/:id/status", requirePermission("sos.status_update", "incidents.manage"), updateSosStatus);
