import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma";
import { successResponse, errorResponse } from "../utils/response";

const editableRoles = ["admin", "kasir", "mekanik"];

function canAssignRole(actorRole: string | undefined, targetRole: string) {
  if (!editableRoles.includes(targetRole)) return false;
  if (actorRole === "owner") return true;
  if (actorRole === "admin") return targetRole === "kasir" || targetRole === "mekanik";
  return false;
}

// GET /users
export const listUsers = async (req: Request, res: Response) => {
  try {
    const data = await prisma.users.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        phone: true,
        is_active: true,
        created_at: true,
      },
      orderBy: { id: "asc" },
    });
    return successResponse(res, data);
  } catch (e: any) {
    return errorResponse(res, "SERVER_ERROR", e.message, 500);
  }
};

// POST /users
export const createUser = async (req: Request, res: Response) => {
  const { name, username, password, role, phone } = req.body;
  const normalizedRole = String(role || "").toLowerCase();
  if (!name || !username || !password || !role) {
    return errorResponse(
      res,
      "VALIDATION_ERROR",
      "name, username, password, role wajib diisi",
      422,
    );
  }

  if (!canAssignRole(req.user?.role, normalizedRole)) {
    return errorResponse(
      res,
      "FORBIDDEN",
      "Role tersebut tidak boleh dibuat oleh akun Anda",
      403,
    );
  }

  try {
    const password_hash = bcrypt.hashSync(password, 10);
    const data = await prisma.users.create({
      data: { name, username, password_hash, role: normalizedRole, phone: phone ?? null },
      select: { id: true, name: true, username: true, role: true, phone: true },
    });
    return successResponse(res, data, "User berhasil dibuat", 201);
  } catch (e: any) {
    if (e.code === "P2002") {
      return errorResponse(res, "CONFLICT", "Username sudah digunakan", 409);
    }
    return errorResponse(res, "SERVER_ERROR", e.message, 500);
  }
};

// GET /users/:id
export const getUser = async (req: Request, res: Response) => {
  try {
    const data = await prisma.users.findFirst({
      where: { id: Number(req.params.id), deleted_at: null },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        phone: true,
        is_active: true,
        created_at: true,
      },
    });
    if (!data)
      return errorResponse(res, "NOT_FOUND", "User tidak ditemukan", 404);
    return successResponse(res, data);
  } catch (e: any) {
    return errorResponse(res, "SERVER_ERROR", e.message, 500);
  }
};

// PUT /users/:id
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, username, role, password, is_active, phone } = req.body;

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (username !== undefined) updateData.username = username;
  if (role !== undefined) updateData.role = String(role).toLowerCase();
  if (is_active !== undefined) updateData.is_active = is_active;
  if (phone !== undefined) updateData.phone = phone;
  if (password) updateData.password_hash = bcrypt.hashSync(password, 10);

  try {
    // Check user exists and not soft-deleted
    const existing = await prisma.users.findFirst({
      where: { id: Number(id), deleted_at: null },
    });
    if (!existing)
      return errorResponse(res, "NOT_FOUND", "User tidak ditemukan", 404);

    if (existing.role === "owner" && req.user?.role !== "owner") {
      return errorResponse(res, "FORBIDDEN", "Akun owner hanya boleh diubah oleh owner", 403);
    }

    if (updateData.role !== undefined && !canAssignRole(req.user?.role, updateData.role)) {
      return errorResponse(res, "FORBIDDEN", "Role tersebut tidak boleh diberikan oleh akun Anda", 403);
    }

    const data = await prisma.users.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        phone: true,
        is_active: true,
      },
    });
    return successResponse(res, data, "User berhasil diupdate");
  } catch (e: any) {
    if (e.code === "P2002") {
      return errorResponse(res, "CONFLICT", "Username sudah digunakan", 409);
    }
    return errorResponse(res, "NOT_FOUND", "User tidak ditemukan", 404);
  }
};

// DELETE /users/:id (soft delete)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.users.findFirst({
      where: { id: Number(req.params.id), deleted_at: null },
    });
    if (!existing)
      return errorResponse(res, "NOT_FOUND", "User tidak ditemukan", 404);

    if (existing.role === "owner") {
      return errorResponse(res, "FORBIDDEN", "Akun owner tidak boleh dinonaktifkan", 403);
    }

    await prisma.users.update({
      where: { id: Number(req.params.id) },
      data: { deleted_at: new Date() },
    });
    return successResponse(res, null, "User berhasil dinonaktifkan");
  } catch (e: any) {
    return errorResponse(res, "SERVER_ERROR", e.message, 500);
  }
};
