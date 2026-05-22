import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware";
import { getVehicleMasters, createVehicleMaster } from "../controllers/vehicleMasterController";

const router = Router();

router.use(authenticate);

router.get("/", getVehicleMasters);
router.post("/", authorizeAdmin, createVehicleMaster);

export default router;
