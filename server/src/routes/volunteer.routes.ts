import { Router } from "express";
import { acceptTask, availability, completeTask, stats, tasks } from "../controllers/volunteer.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";

export const volunteerRouter = Router();

volunteerRouter.use(requireAuth, requirePermission("volunteers.respond", "volunteers.manage"));
volunteerRouter.get("/tasks", tasks);
volunteerRouter.post("/accept/:id", acceptTask);
volunteerRouter.post("/complete/:id", completeTask);
volunteerRouter.patch("/availability", availability);
volunteerRouter.get("/stats", stats);
