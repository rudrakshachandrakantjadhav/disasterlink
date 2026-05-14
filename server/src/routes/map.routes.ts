import { Router } from "express";
import { getHeatmap, getLive, getShelters } from "../controllers/map.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const mapRoutes = Router();

mapRoutes.get("/live", verifyToken, getLive);
mapRoutes.get("/shelters", verifyToken, getShelters);
mapRoutes.get("/heatmap", verifyToken, getHeatmap);

export default mapRoutes;
export { mapRoutes };
