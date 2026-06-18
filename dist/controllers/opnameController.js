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
exports.closeOpname = exports.updateOpnameItem = exports.addOpnameItem = exports.getOpname = exports.createOpname = exports.listOpnames = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const response_1 = require("../utils/response");
const helpers_1 = require("../utils/helpers");
// GET /opnames
const listOpnames = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const { from, perPage } = (0, helpers_1.getPagination)(page);
    try {
        const [data, total] = yield Promise.all([
            prisma_1.default.stock_opnames.findMany({
                orderBy: { opened_at: 'desc' },
                include: {
                    users: { select: { name: true } },
                    stock_opname_items: {
                        include: {
                            spare_parts: { select: { name: true, sku: true, current_stock: true } }
                        }
                    }
                },
                skip: from,
                take: perPage
            }),
            prisma_1.default.stock_opnames.count()
        ]);
        return (0, response_1.successResponse)(res, data, 'OK', 200, { page, total, per_page: perPage });
    }
    catch (e) {
        return (0, response_1.errorResponse)(res, 'SERVER_ERROR', e.message, 500);
    }
});
exports.listOpnames = listOpnames;
// POST /opnames
const createOpname = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { session_name } = req.body;
    if (!session_name)
        return (0, response_1.errorResponse)(res, 'VALIDATION_ERROR', 'session_name wajib diisi', 422);
    const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null;
    try {
        // Cek apakah ada sesi yang masih open
        const openSession = yield prisma_1.default.stock_opnames.findFirst({ where: { status: 'open' } });
        if (openSession) {
            return (0, response_1.errorResponse)(res, 'OPNAME_ALREADY_OPEN', 'Masih ada sesi opname yang belum ditutup', 409);
        }
        // 1. Buat Sesi Opname Baru
        const session = yield prisma_1.default.stock_opnames.create({
            data: {
                session_name,
                status: 'open',
                user_id: userId,
                opened_at: new Date()
            }
        });
        // 2. Ambil spare_parts aktif
        const parts = yield prisma_1.default.spare_parts.findMany({
            where: { deleted_at: null }
        });
        // 3. Masukkan ke stock_opname_items
        if (parts.length > 0) {
            yield prisma_1.default.stock_opname_items.createMany({
                data: parts.map((part) => ({
                    opname_id: session.id,
                    spare_part_id: part.id,
                    system_stock: part.current_stock,
                    physical_count: part.current_stock,
                    difference: 0
                }))
            });
        }
        // 4. Ambil kembali sesi lengkap dengan items dan users
        const data = yield prisma_1.default.stock_opnames.findUnique({
            where: { id: session.id },
            include: {
                users: { select: { name: true } },
                stock_opname_items: {
                    include: {
                        spare_parts: { select: { name: true, sku: true, current_stock: true } }
                    }
                }
            }
        });
        return (0, response_1.successResponse)(res, data, 'Sesi opname berhasil dibuat', 201);
    }
    catch (e) {
        return (0, response_1.errorResponse)(res, 'SERVER_ERROR', e.message, 500);
    }
});
exports.createOpname = createOpname;
// GET /opnames/:id
const getOpname = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield prisma_1.default.stock_opnames.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                users: { select: { name: true } },
                stock_opname_items: {
                    include: {
                        spare_parts: { select: { name: true, sku: true, current_stock: true } }
                    }
                }
            }
        });
        if (!data)
            return (0, response_1.errorResponse)(res, 'NOT_FOUND', 'Sesi opname tidak ditemukan', 404);
        return (0, response_1.successResponse)(res, data);
    }
    catch (e) {
        return (0, response_1.errorResponse)(res, 'SERVER_ERROR', e.message, 500);
    }
});
exports.getOpname = getOpname;
// POST /opnames/:id/items
const addOpnameItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { spare_part_id, physical_count } = req.body;
    if (!spare_part_id || physical_count === undefined) {
        return (0, response_1.errorResponse)(res, 'VALIDATION_ERROR', 'spare_part_id dan physical_count wajib diisi', 422);
    }
    try {
        // Validasi sesi masih open
        const opname = yield prisma_1.default.stock_opnames.findUnique({ where: { id: Number(id) }, select: { status: true } });
        if (!opname)
            return (0, response_1.errorResponse)(res, 'NOT_FOUND', 'Sesi opname tidak ditemukan', 404);
        if (opname.status === 'closed')
            return (0, response_1.errorResponse)(res, 'VALIDATION_ERROR', 'Sesi opname sudah ditutup', 400);
        const part = yield prisma_1.default.spare_parts.findUnique({
            where: { id: Number(spare_part_id) },
            select: { current_stock: true }
        });
        if (!part)
            return (0, response_1.errorResponse)(res, 'NOT_FOUND', 'Spare part tidak ditemukan', 404);
        const physCount = Number(physical_count);
        const systemStock = part.current_stock;
        const difference = physCount - systemStock;
        // Upsert: update if exists, create if not
        const data = yield prisma_1.default.stock_opname_items.upsert({
            where: {
                opname_id_spare_part_id: {
                    opname_id: Number(id),
                    spare_part_id: Number(spare_part_id)
                }
            },
            update: {
                physical_count: physCount,
                system_stock: systemStock,
                difference
            },
            create: {
                opname_id: Number(id),
                spare_part_id: Number(spare_part_id),
                system_stock: systemStock,
                physical_count: physCount,
                difference
            }
        });
        return (0, response_1.successResponse)(res, data, 'Hitungan fisik berhasil disimpan');
    }
    catch (e) {
        return (0, response_1.errorResponse)(res, 'SERVER_ERROR', e.message, 500);
    }
});
exports.addOpnameItem = addOpnameItem;
// PUT /opnames/:id/items/:item_id
const updateOpnameItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { item_id } = req.params;
    const { physical_count } = req.body;
    if (physical_count === undefined)
        return (0, response_1.errorResponse)(res, 'VALIDATION_ERROR', 'physical_count wajib diisi', 422);
    try {
        // Get current system_stock to recalculate difference
        const existing = yield prisma_1.default.stock_opname_items.findUnique({ where: { id: Number(item_id) } });
        if (!existing)
            return (0, response_1.errorResponse)(res, 'NOT_FOUND', 'Item opname tidak ditemukan', 404);
        const physCount = Number(physical_count);
        const difference = physCount - existing.system_stock;
        const data = yield prisma_1.default.stock_opname_items.update({
            where: { id: Number(item_id) },
            data: { physical_count: physCount, difference }
        });
        return (0, response_1.successResponse)(res, data, 'Hitungan fisik diupdate');
    }
    catch (e) {
        return (0, response_1.errorResponse)(res, 'NOT_FOUND', 'Item opname tidak ditemukan', 404);
    }
});
exports.updateOpnameItem = updateOpnameItem;
// POST /opnames/:id/close
const closeOpname = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { id } = req.params;
    const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null;
    try {
        const opname = yield prisma_1.default.stock_opnames.findUnique({ where: { id: Number(id) }, select: { status: true } });
        if (!opname)
            return (0, response_1.errorResponse)(res, 'NOT_FOUND', 'Sesi opname tidak ditemukan', 404);
        if (opname.status === 'closed')
            return (0, response_1.errorResponse)(res, 'VALIDATION_ERROR', 'Sesi ini sudah ditutup', 400);
        // Ambil semua item yang sudah di-input (physical_count adalah non-nullable default 0)
        const items = yield prisma_1.default.stock_opname_items.findMany({
            where: { opname_id: Number(id) }
        });
        if (items.length > 0) {
            const adjustments = items.filter((item) => item.physical_count !== item.system_stock);
            if (adjustments.length > 0) {
                // Buat stock_movements untuk setiap item yang ada selisih
                for (const item of adjustments) {
                    const physCount = (_c = item.physical_count) !== null && _c !== void 0 ? _c : item.system_stock;
                    const diff = physCount - item.system_stock;
                    yield prisma_1.default.stock_movements.create({
                        data: {
                            spare_part_id: item.spare_part_id,
                            user_id: userId,
                            type: 'opname_adjustment',
                            quantity_change: Math.abs(diff),
                            stock_before: item.system_stock,
                            stock_after: physCount,
                            note: `Adjustment opname #${id}: sistem=${item.system_stock}, fisik=${physCount}`,
                            reference_id: Number(id),
                            reference_type: 'opname'
                        }
                    });
                    // Update stok aktual sesuai hitungan fisik
                    yield prisma_1.default.spare_parts.update({
                        where: { id: item.spare_part_id },
                        data: { current_stock: physCount }
                    });
                }
            }
        }
        // Tutup sesi
        const data = yield prisma_1.default.stock_opnames.update({
            where: { id: Number(id) },
            data: { status: 'closed', closed_at: new Date() }
        });
        return (0, response_1.successResponse)(res, Object.assign(Object.assign({}, data), { summary: {
                total_items: items.length,
                items_adjusted: items.filter((i) => i.physical_count !== i.system_stock).length,
                items_ok: items.filter((i) => i.physical_count === i.system_stock).length
            } }), 'Sesi opname berhasil ditutup dan stok disesuaikan');
    }
    catch (e) {
        return (0, response_1.errorResponse)(res, 'SERVER_ERROR', e.message, 500);
    }
});
exports.closeOpname = closeOpname;
