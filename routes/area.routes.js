import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { getAreas, createArea, getAreasForSidebar} from "../controllers/area.controller.js";

const router = express.Router();

router.get("/",  getAreas);
router.get("/sidebar", protectRoute, getAreasForSidebar);
router.post("/", createArea);

export default router;
