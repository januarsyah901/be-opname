"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVehicle = exports.updateVehicle = exports.createVehicle = exports.listVehicles = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const response_1 = require("../utils/response");
// GET /customers/:customerId/vehicles
const listVehicles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield prisma_1.default.vehicles.findMany({
            where: { customer_id: Number(req.params.customerId) },
            orderBy: { id: 'asc' }
        });
        return (0, response_1.successResponse)(res, data);
    }
    catch (e) {
        return (0, response_1.errorResponse)(res, 'SERVER_ERROR', e.message, 500);
    }
});
exports.listVehicles = listVehicles;
// POST /customers/:customerId/vehicles
const createVehicle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { customerId } = req.params;
    const { plate_number, type, brand, model, year, frame_number } = req.body;
    if (!brand || !model) {
        return (0, response_1.errorResponse)(res, 'VALIDATION_ERROR', 'Merek dan Model kendaraan wajib diisi', 422);
    }
    try {
        const normalizedType = type ? (type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()) : 'Mobil';
        const normalizedPlate = plate_number ? String(plate_number).toUpperCase().replace(/\s/g, '') : '';
        const data = yield prisma_1.default.vehicles.create({
            data: { customer_id: Number(customerId), plate_number: normalizedPlate, type: normalizedType, brand, model, year: year ? Number(year) : null, frame_number }
        });
        return (0, response_1.successResponse)(res, data, 'Kendaraan berhasil ditambahkan', 201);
    }
    catch (e) {
        if (e.code === 'P2002') {
            return (0, response_1.errorResponse)(res, 'CONFLICT', 'Nomor plat sudah terdaftar di sistem', 409);
        }
        return (0, response_1.errorResponse)(res, 'SERVER_ERROR', e.message, 500);
    }
});
exports.createVehicle = createVehicle;
// PUT /vehicles/:id
const updateVehicle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { plate_number, type, brand, model, year, frame_number } = req.body;
    if (brand === '' || model === '') {
        return (0, response_1.errorResponse)(res, 'VALIDATION_ERROR', 'Merek dan Model kendaraan tidak boleh kosong', 422);
    }
    try {
        const normalizedType = type ? (type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()) : undefined;
        const normalizedPlate = plate_number ? String(plate_number).toUpperCase().replace(/\s/g, '') : undefined;
        const data = yield prisma_1.default.vehicles.update({
            where: { id: Number(id) },
            data: { plate_number: normalizedPlate, type: normalizedType, brand, model, year: year ? Number(year) : null, frame_number }
        });
        return (0, response_1.successResponse)(res, data, 'Kendaraan berhasil diupdate');
    }
    catch (e) {
        return (0, response_1.errorResponse)(res, 'NOT_FOUND', 'Kendaraan tidak ditemukan', 404);
    }
});
exports.updateVehicle = updateVehicle;
// DELETE /vehicles/:id
const deleteVehicle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const vehicleId = Number(id);
    try {
        const existing = yield prisma_1.default.vehicles.findUnique({
            where: { id: vehicleId },
            select: { id: true, plate_number: true }
        });
        if (!existing) {
            return (0, response_1.errorResponse)(res, 'NOT_FOUND', 'Kendaraan tidak ditemukan', 404);
        }
        const [transactionCount, workOrderCount, reminderCount] = yield Promise.all([
            prisma_1.default.transactions.count({ where: { vehicle_id: vehicleId } }),
            prisma_1.default.work_orders.count({ where: { vehicle_id: vehicleId, deleted_at: null } }),
            prisma_1.default.reminders.count({ where: { vehicle_id: vehicleId } }),
        ]);
        if (transactionCount > 0 || workOrderCount > 0 || reminderCount > 0) {
            return (0, response_1.errorResponse)(res, 'CONFLICT', 'Kendaraan tidak bisa dihapus karena sudah memiliki transaksi, antrean, atau reminder terkait', 409);
        }
        yield prisma_1.default.vehicles.delete({ where: { id: vehicleId } });
        return (0, response_1.successResponse)(res, null, 'Kendaraan berhasil dihapus');
    }
    catch (e) {
        return (0, response_1.errorResponse)(res, 'SERVER_ERROR', e.message, 500);
    }
});
exports.deleteVehicle = deleteVehicle;
