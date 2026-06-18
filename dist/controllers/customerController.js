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
exports.getCustomerHistory = exports.deleteCustomer = exports.updateCustomer = exports.getCustomer = exports.createCustomer = exports.listCustomers = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const response_1 = require("../utils/response");
const helpers_1 = require("../utils/helpers");
// GET /customers
const listCustomers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";
    const { from, perPage } = (0, helpers_1.getPagination)(page);
    try {
        const where = { deleted_at: null };
        if (search)
            where.name = { contains: search, mode: "insensitive" };
        const [data, total] = yield Promise.all([
            prisma_1.default.customers.findMany({
                where,
                include: { vehicles: true },
                orderBy: { id: "asc" },
                skip: from,
                take: perPage,
            }),
            prisma_1.default.customers.count({ where }),
        ]);
        return (0, response_1.successResponse)(res, data, "OK", 200, {
            page,
            total,
            per_page: perPage,
        });
    }
    catch (e) {
        return (0, response_1.errorResponse)(res, "SERVER_ERROR", e.message, 500);
    }
});
exports.listCustomers = listCustomers;
// POST /customers
const createCustomer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, phone, email, address } = req.body;
    if (!name)
        return (0, response_1.errorResponse)(res, "VALIDATION_ERROR", "name wajib diisi", 422);
    try {
        const data = yield prisma_1.default.customers.create({
            data: { name, phone, email, address },
        });
        return (0, response_1.successResponse)(res, data, "Customer berhasil ditambahkan", 201);
    }
    catch (e) {
        return (0, response_1.errorResponse)(res, "SERVER_ERROR", e.message, 500);
    }
});
exports.createCustomer = createCustomer;
// GET /customers/:id
const getCustomer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customer = yield prisma_1.default.customers.findFirst({
            where: { id: Number(req.params.id), deleted_at: null },
            include: { vehicles: true },
        });
        if (!customer)
            return (0, response_1.errorResponse)(res, "NOT_FOUND", "Customer tidak ditemukan", 404);
        return (0, response_1.successResponse)(res, customer);
    }
    catch (e) {
        return (0, response_1.errorResponse)(res, "SERVER_ERROR", e.message, 500);
    }
});
exports.getCustomer = getCustomer;
// PUT /customers/:id
const updateCustomer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;
    try {
        const existing = yield prisma_1.default.customers.findFirst({
            where: { id: Number(id), deleted_at: null },
        });
        if (!existing)
            return (0, response_1.errorResponse)(res, "NOT_FOUND", "Customer tidak ditemukan", 404);
        const data = yield prisma_1.default.customers.update({
            where: { id: Number(id) },
            data: { name, phone, email, address, updated_at: new Date() },
        });
        return (0, response_1.successResponse)(res, data, "Customer berhasil diupdate");
    }
    catch (e) {
        return (0, response_1.errorResponse)(res, "SERVER_ERROR", e.message, 500);
    }
});
exports.updateCustomer = updateCustomer;
// DELETE /customers/:id (soft delete)
const deleteCustomer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existing = yield prisma_1.default.customers.findFirst({
            where: { id: Number(req.params.id), deleted_at: null },
        });
        if (!existing)
            return (0, response_1.errorResponse)(res, "NOT_FOUND", "Customer tidak ditemukan", 404);
        yield prisma_1.default.customers.update({
            where: { id: Number(req.params.id) },
            data: { deleted_at: new Date() },
        });
        return (0, response_1.successResponse)(res, null, "Customer berhasil dihapus");
    }
    catch (e) {
        return (0, response_1.errorResponse)(res, "SERVER_ERROR", e.message, 500);
    }
});
exports.deleteCustomer = deleteCustomer;
// GET /customers/:id/history
const getCustomerHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customer = yield prisma_1.default.customers.findFirst({
            where: { id: Number(req.params.id) },
            select: { id: true, name: true },
        });
        if (!customer)
            return (0, response_1.errorResponse)(res, "NOT_FOUND", "Customer tidak ditemukan", 404);
        const transactions = yield prisma_1.default.transactions.findMany({
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
        return (0, response_1.successResponse)(res, { customer, transactions });
    }
    catch (e) {
        return (0, response_1.errorResponse)(res, "SERVER_ERROR", e.message, 500);
    }
});
exports.getCustomerHistory = getCustomerHistory;
