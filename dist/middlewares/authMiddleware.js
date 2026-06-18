"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authorizeAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const response_1 = require("../utils/response");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return (0, response_1.errorResponse)(res, "UNAUTHORIZED", "Token tidak ditemukan", 401);
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwtSecret || "supersecretkey");
        req.user = decoded;
        next();
    }
    catch (err) {
        return (0, response_1.errorResponse)(res, "UNAUTHORIZED", "Token tidak valid atau sudah expired", 401);
    }
};
exports.authenticate = authenticate;
const authorizeAdmin = (req, res, next) => {
    if (!req.user || !["admin", "owner"].includes(req.user.role)) {
        return (0, response_1.errorResponse)(res, "FORBIDDEN", "Hanya admin yang bisa mengakses resource ini", 403);
    }
    next();
};
exports.authorizeAdmin = authorizeAdmin;
const authorizeRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return (0, response_1.errorResponse)(res, "FORBIDDEN", "Role Anda tidak memiliki akses ke resource ini", 403);
    }
    next();
};
exports.authorizeRoles = authorizeRoles;
