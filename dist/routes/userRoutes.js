"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate); // hanya require authenticate, bukan admin-only
router.get("/", authMiddleware_1.authorizeAdmin, userController_1.listUsers);
router.post("/", authMiddleware_1.authorizeAdmin, userController_1.createUser); // hanya admin yg bisa create
router.get("/:id", userController_1.getUser);
router.put("/:id", authMiddleware_1.authorizeAdmin, userController_1.updateUser); // hanya admin yg bisa update
router.delete("/:id", authMiddleware_1.authorizeAdmin, userController_1.deleteUser); // hanya admin yg bisa delete
exports.default = router;
