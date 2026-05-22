import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { JwtPayload } from "../types";
import { errorResponse } from "../utils/response";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(res, "UNAUTHORIZED", "Token tidak ditemukan", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      config.jwtSecret || "supersecretkey",
    ) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return errorResponse(
      res,
      "UNAUTHORIZED",
      "Token tidak valid atau sudah expired",
      401,
    );
  }
};

export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || !["admin", "owner"].includes(req.user.role)) {
    return errorResponse(
      res,
      "FORBIDDEN",
      "Hanya admin yang bisa mengakses resource ini",
      403,
    );
  }
  next();
};

export const authorizeRoles = (...roles: string[]) => (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return errorResponse(
      res,
      "FORBIDDEN",
      "Role Anda tidak memiliki akses ke resource ini",
      403,
    );
  }
  next();
};
