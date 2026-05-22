import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware";
import {
  listUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
} from "../controllers/userController";

const router = Router();

router.use(authenticate); // hanya require authenticate, bukan admin-only

router.get("/", authorizeAdmin, listUsers);
router.post("/", authorizeAdmin, createUser); // hanya admin yg bisa create
router.get("/:id", getUser);
router.put("/:id", authorizeAdmin, updateUser); // hanya admin yg bisa update
router.delete("/:id", authorizeAdmin, deleteUser); // hanya admin yg bisa delete

export default router;
