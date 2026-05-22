import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware";
import { 
  getServiceCatalog, 
  createServiceCatalog, 
  updateServiceCatalog, 
  deleteServiceCatalog 
} from "../controllers/serviceCatalogController";

const router = Router();

router.use(authenticate);

router.get("/", getServiceCatalog);
router.post("/", authorizeAdmin, createServiceCatalog);
router.put("/:id", authorizeAdmin, updateServiceCatalog);
router.delete("/:id", authorizeAdmin, deleteServiceCatalog);

export default router;
