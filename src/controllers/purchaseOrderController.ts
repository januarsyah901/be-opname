import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { getPagination } from '../utils/helpers';

// GET /purchase-orders
export const listPurchaseOrders = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const { from, perPage } = getPagination(page);

    try {
        const [data, total] = await Promise.all([
            prisma.purchase_orders.findMany({
                include: { items: true },
                orderBy: { created_at: 'desc' },
                skip: from,
                take: perPage
            }),
            prisma.purchase_orders.count()
        ]);

        // Transform to match FE expectations
        const transformed = data.map(po => ({
            id: po.id,
            noPO: po.no_po,
            tanggal: po.tanggal,
            supplier: po.supplier,
            status: po.status,
            totalNilai: Number(po.total_nilai),
            estimasiTiba: po.estimasi_tiba,
            catatan: po.catatan,
            items: po.items.map(item => ({
                sku: item.sku,
                nama: item.nama,
                qty: item.qty,
                hargaSatuan: Number(item.harga_satuan)
            }))
        }));

        return successResponse(res, transformed, 'OK', 200, { page, total, per_page: perPage });
    } catch (e: any) {
        return errorResponse(res, 'SERVER_ERROR', e.message, 500);
    }
};

// POST /purchase-orders
export const createPurchaseOrder = async (req: Request, res: Response) => {
    const { noPO, tanggal, supplier, items, estimasiTiba, catatan } = req.body;

    if (!noPO || !tanggal || !supplier || !items || items.length === 0) {
        return errorResponse(res, 'VALIDATION_ERROR', 'noPO, tanggal, supplier, and items are required', 422);
    }

    try {
        const totalNilai = items.reduce((sum: number, item: any) => sum + (Number(item.qty) * Number(item.hargaSatuan)), 0);

        const data = await prisma.purchase_orders.create({
            data: {
                no_po: noPO,
                tanggal: new Date(tanggal),
                supplier,
                total_nilai: totalNilai,
                estimasi_tiba: estimasiTiba ? new Date(estimasiTiba) : null,
                catatan,
                items: {
                    create: items.map((item: any) => ({
                        sku: item.sku,
                        nama: item.nama,
                        qty: Number(item.qty),
                        harga_satuan: Number(item.hargaSatuan),
                        spare_part_id: item.spare_part_id ? Number(item.spare_part_id) : null
                    }))
                }
            },
            include: { items: true }
        });

        return successResponse(res, data, 'Purchase Order created successfully', 201);
    } catch (e: any) {
        if (e.code === 'P2002') {
            return errorResponse(res, 'CONFLICT', 'Nomor PO sudah ada', 409);
        }
        return errorResponse(res, 'SERVER_ERROR', e.message, 500);
    }
};

// DELETE /purchase-orders/:id
export const deletePurchaseOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.purchase_orders.delete({ where: { id: Number(id) } });
        return successResponse(res, null, 'Purchase Order deleted successfully');
    } catch (e: any) {
        return errorResponse(res, 'NOT_FOUND', 'Purchase Order tidak ditemukan', 404);
    }
};
