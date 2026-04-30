import { Request, Response } from "express";
import prisma from "../config/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { getPagination } from "../utils/helpers";

// GET /customers
export const listCustomers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const search = (req.query.search as string) || "";
  const { from, perPage } = getPagination(page);

  try {
    const where: any = { deleted_at: null };
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [data, total] = await Promise.all([
      prisma.customers.findMany({
        where,
        include: { vehicles: true },
        orderBy: { id: "asc" },
        skip: from,
        take: perPage,
      }),
      prisma.customers.count({ where }),
    ]);

    return successResponse(res, data, "OK", 200, {
      page,
      total,
      per_page: perPage,
    });
  } catch (e: any) {
    return errorResponse(res, "SERVER_ERROR", e.message, 500);
  }
};

// POST /customers
export const createCustomer = async (req: Request, res: Response) => {
  const { name, phone, email, address } = req.body;
  if (!name)
    return errorResponse(res, "VALIDATION_ERROR", "name wajib diisi", 422);

  try {
    const data = await prisma.customers.create({
      data: { name, phone, email, address },
    });
    return successResponse(res, data, "Customer berhasil ditambahkan", 201);
  } catch (e: any) {
    return errorResponse(res, "SERVER_ERROR", e.message, 500);
  }
};

// GET /customers/:id
export const getCustomer = async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customers.findFirst({
      where: { id: Number(req.params.id), deleted_at: null },
      include: { vehicles: true },
    });
    if (!customer)
      return errorResponse(res, "NOT_FOUND", "Customer tidak ditemukan", 404);
    return successResponse(res, customer);
  } catch (e: any) {
    return errorResponse(res, "SERVER_ERROR", e.message, 500);
  }
};

// PUT /customers/:id
export const updateCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, phone, email, address } = req.body;

  try {
    const existing = await prisma.customers.findFirst({
      where: { id: Number(id), deleted_at: null },
    });
    if (!existing)
      return errorResponse(res, "NOT_FOUND", "Customer tidak ditemukan", 404);

    const data = await prisma.customers.update({
      where: { id: Number(id) },
      data: { name, phone, email, address, updated_at: new Date() },
    });
    return successResponse(res, data, "Customer berhasil diupdate");
  } catch (e: any) {
    return errorResponse(res, "SERVER_ERROR", e.message, 500);
  }
};

// DELETE /customers/:id (soft delete)
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.customers.findFirst({
      where: { id: Number(req.params.id), deleted_at: null },
    });
    if (!existing)
      return errorResponse(res, "NOT_FOUND", "Customer tidak ditemukan", 404);

    await prisma.customers.update({
      where: { id: Number(req.params.id) },
      data: { deleted_at: new Date() },
    });
    return successResponse(res, null, "Customer berhasil dihapus");
  } catch (e: any) {
    return errorResponse(res, "SERVER_ERROR", e.message, 500);
  }
};

// GET /customers/:id/history
export const getCustomerHistory = async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customers.findFirst({
      where: { id: Number(req.params.id) },
      select: { id: true, name: true },
    });
    if (!customer)
      return errorResponse(res, "NOT_FOUND", "Customer tidak ditemukan", 404);

    const transactions = await prisma.transactions.findMany({
      where: { customer_id: Number(req.params.id) },
      select: {
        invoice_number: true,
        total_amount: true,
        payment_status: true,
        transaction_date: true,
        vehicles: { select: { plate_number: true, type: true } },
      },
      orderBy: { transaction_date: "desc" },
    });

    return successResponse(res, { customer, transactions });
  } catch (e: any) {
    return errorResponse(res, "SERVER_ERROR", e.message, 500);
  }
};
