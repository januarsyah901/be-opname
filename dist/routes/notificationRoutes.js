"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const notificationController_1 = require("../controllers/notificationController");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.use((0, authMiddleware_1.authorizeRoles)("owner", "admin", "kasir"));
// Log notifikasi WA
router.get("/wa", notificationController_1.listNotifications);
router.delete("/wa", notificationController_1.clearNotifications);
// WA Client management (WhatsApp Web.js)
router.get("/wa/status", notificationController_1.getWaClientStatus);
router.get("/wa/qr", notificationController_1.getWaQrCode);
router.post("/wa/restart", notificationController_1.restartWa);
router.post("/wa/send", notificationController_1.sendManualNotification);
router.post("/wa/test", notificationController_1.sendTestNotification);
router.post("/wa/retry/:id", notificationController_1.retryNotification);
exports.default = router;
