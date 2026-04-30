import { Request, Response } from "express";
import prisma from "../config/prisma";
import { successResponse, errorResponse } from "../utils/response";

export const getVehicleMasters = async (req: Request, res: Response) => {
  try {
    const data = await (prisma as any).vehicle_masters.findMany({
      orderBy: { brand: "asc" },
    });
    return successResponse(res, data, "Data master kendaraan berhasil diambil");
  } catch (error: any) {
    return errorResponse(res, "SERVER_ERROR", error.message, 500);
  }
};

export const createVehicleMaster = async (req: Request, res: Response) => {
  try {
    const { brand, model } = req.body;
    
    if (!brand || !model) {
      return errorResponse(res, "VALIDATION_ERROR", "Brand and model are required", 400);
    }

    const normalizedBrand = brand.trim().toUpperCase();
    const normalizedModel = model.trim().toUpperCase();

    // Upsert to handle potential duplicates gracefully
    const data = await (prisma as any).vehicle_masters.upsert({
      where: { 
        brand_model: { brand: normalizedBrand, model: normalizedModel } 
      },
      update: {},
      create: { brand: normalizedBrand, model: normalizedModel },
    });

    return successResponse(res, data, "Data master kendaraan berhasil disimpan", 201);
  } catch (error: any) {
    return errorResponse(res, "SERVER_ERROR", error.message, 500);
  }
};
