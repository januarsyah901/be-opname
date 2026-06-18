"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const stockController_1 = require("../controllers/stockController");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.get('/', authMiddleware_1.authorizeAdmin, stockController_1.listMovements); // GET /stock-movements
router.post('/in', authMiddleware_1.authorizeAdmin, stockController_1.stockIn); // POST /stock/in
router.post('/out', authMiddleware_1.authorizeAdmin, stockController_1.stockOut); // POST /stock/out
exports.default = router;
