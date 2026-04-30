import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { getPagination } from '../utils/helpers';
import { sendServiceProgressNotification } from '../services/waClientService';

const INSPECTION_TEMPLATE = [
    {
        section: 'PENGECEKAN AREA MESIN',
        items: [
            'Kondisi Oli Mesin',
            'Filter Udara',
            'Kondisi Belt',
            'Rembesan/Kebocoran Oli/Air',
            'Kesehatan Aki',
            'Voltase Pengisian',
            'Kondisi Saat Starter',
            'Engine Mounting (Mesin, Tengah, Transmisi)',
            'Coolant/Air Radiator',
            'Tutup Radiator',
            'Oli Power Stering',
            'Getaran & Suara Mesin',
            'Kondisi Minyak Rem/Kopling',
            'Air Washer',
        ],
    },
    {
        section: 'PENGECEKAN AREA DALAM KABIN',
        items: [
            'Indikator Dashboard',
            'Check Engine & DTC (Computer Scanning)',
            'Kondisi Doorlock',
            'Kondisi Power Window',
            'Lampu Kabin',
            'Electric Mirror/Manual Mirror',
            'Doortrim',
            'Handrem',
            'Pedal Rem & Kopling',
            'Audio dan Aksesoris (cam rear ops)',
            'Kondisi Air Conditioner (Hembusan Blower, Temperatur)',
            'Filter Kabin & Evap',
            'Freeplay Steering',
        ],
    },
    {
        section: 'PENGECEKAN AREA EXTERIOR & UNDERSTEL',
        items: [
            'Lampu Utama & Foglamp',
            'Lampu Sein & Hazard',
            'Lampu Rem & Mundur',
            'Kondisi Bukaan Pintu + Engsel',
            'Kondisi Velg, Ban, + Cadangan',
            'Kondisi Discbrake',
            'Kondisi Kaki-Kaki (Tie Rod, Ball Joint, Support, Boot, dsb.)',
            'Kondisi Fleksibel Rem',
            'Kondisi Shock',
        ],
    },
];

const buildInspectionItems = () =>
    INSPECTION_TEMPLATE.flatMap((section, sectionIndex) =>
        section.items.map((item, itemIndex) => ({
            section: section.section,
            item_name: item,
            sort_order: sectionIndex * 100 + itemIndex + 1,
        }))
    );

// ===========================================================================
// GET /work-orders
// ===========================================================================
export const listWorkOrders = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const { from, perPage } = getPagination(page);
    const { status, date } = req.query;

    try {
        const where: any = { deleted_at: null };
        if (status) where.status = String(status);
        if (date) {
            const d = new Date(String(date));
            const nextDay = new Date(d);
            nextDay.setDate(nextDay.getDate() + 1);
            where.waktu_masuk = { gte: d, lt: nextDay };
        }

        const [data, total] = await Promise.all([
            prisma.work_orders.findMany({
                where,
                include: {
                    customers: { select: { id: true, name: true, phone: true } },
                    vehicles: { select: { id: true, plate_number: true, type: true, brand: true, model: true, frame_number: true } },
                    service_bundles: true,
                    checklists: true
                },
                orderBy: { waktu_masuk: 'desc' },
                skip: from,
                take: perPage
            }),
            prisma.work_orders.count({ where })
        ]);

        return successResponse(res, data, 'OK', 200, { page, total, per_page: perPage });
    } catch (e: any) {
        return errorResponse(res, 'SERVER_ERROR', e.message, 500);
    }
};

// ===========================================================================
// POST /work-orders
// ===========================================================================
export const createWorkOrder = async (req: Request, res: Response) => {
    const {
        customer_id,
        vehicle_id,
        noPolisi,
        noRangka,
        tipe,
        kendaraan,
        pelanggan,
        waPelanggan,
        layanan,
        keluhan,
        estimasi_biaya,
        estimasi_selesai,
        menginap,
        mekanik,
        complaint_log,
        service_bundle_id,
        image_url_1,
        image_url_2,
        image_url_3
    } = req.body;

    if (!layanan || (Array.isArray(layanan) && layanan.length === 0)) {
        return errorResponse(res, 'VALIDATION_ERROR', 'Layanan wajib diisi', 422);
    }

    const formattedLayanan = Array.isArray(layanan) ? layanan.join(', ') : String(layanan);

    try {
        let finalCustomerId = customer_id ? Number(customer_id) : null;
        let finalVehicleId = vehicle_id ? Number(vehicle_id) : null;
        if (!finalCustomerId && pelanggan) {
            const existingCustomer = await prisma.customers.findFirst({
                where: { 
                    name: String(pelanggan),
                    ...(waPelanggan && { phone: String(waPelanggan) }),
                    deleted_at: null 
                }
            });

            if (existingCustomer) {
                finalCustomerId = existingCustomer.id;
            } else {
                const newCustomer = await prisma.customers.create({
                    data: { 
                        name: String(pelanggan), 
                        phone: waPelanggan ? String(waPelanggan) : null 
                    }
                });
                finalCustomerId = newCustomer.id;
            }
        }

        if (!finalVehicleId && noPolisi) {
            const plate = String(noPolisi).toUpperCase().replace(/\s/g, '');
            const existingVehicle = await prisma.vehicles.findFirst({
                where: { plate_number: plate }
            });

            if (existingVehicle) {
                // Update frame_number if provided
                if (noRangka) {
                    await prisma.vehicles.update({
                        where: { id: existingVehicle.id },
                        data: { frame_number: String(noRangka) }
                    });
                }
                finalVehicleId = existingVehicle.id;
            } else if (finalCustomerId) {
                const parts = String(kendaraan || '').trim().split(/\s+/);
                const brand = parts[0];
                const model = parts.slice(1).join(' ');

                if (!brand || !model) {
                    return errorResponse(res, 'VALIDATION_ERROR', 'Merek dan Model kendaraan wajib diisi (contoh: "Honda Vario")', 422);
                }

                const newVehicle = await prisma.vehicles.create({
                    data: {
                        customer_id: finalCustomerId,
                        plate_number: plate,
                        type: String(tipe || 'Mobil'),
                        brand,
                        model,
                        frame_number: noRangka ? String(noRangka) : null
                    }
                });
                finalVehicleId = newVehicle.id;
            }
        }

        if (!finalCustomerId || !finalVehicleId) {
            return errorResponse(res, 'VALIDATION_ERROR', 'Gagal memproses data Pelanggan atau Kendaraan. Pastikan nama dan plat nomor terisi.', 422);
        }

        // Ambil task checklist dari bundle jika ada
        let bundleItems: any[] = [];
        if (service_bundle_id) {
            const bundle = await prisma.service_bundles.findUnique({
                where: { id: Number(service_bundle_id) },
                include: { items: true }
            });
            if (bundle) {
                bundleItems = bundle.items;
            }
        }

        const wo = await prisma.work_orders.create({
            data: {
                customer_id: finalCustomerId,
                vehicle_id: finalVehicleId,
                layanan: formattedLayanan,
                keluhan: keluhan ?? null,
                complaint_log: complaint_log ?? null,
                service_bundle_id: service_bundle_id ? Number(service_bundle_id) : null,
                status: 'menunggu',
                mekanik: mekanik ?? null,
                estimasi_biaya: estimasi_biaya ? parseFloat(estimasi_biaya) : 0,
                estimasi_selesai: estimasi_selesai ?? null,
                menginap: menginap === true || menginap === 'true',
                image_url_1: image_url_1 ?? null,
                image_url_2: image_url_2 ?? null,
                image_url_3: image_url_3 ?? null,
                waktu_masuk: new Date(),
                created_at: new Date(),
                checklists: {
                    create: bundleItems.map(it => ({ task_name: it.task_name }))
                }
            },
            include: {
                customers: { select: { id: true, name: true, phone: true } },
                vehicles: { select: { id: true, plate_number: true, type: true, brand: true, model: true, frame_number: true } },
                checklists: true
            }
        });

        return successResponse(res, wo, 'Work order berhasil dibuat', 201);
    } catch (e: any) {
        return errorResponse(res, 'SERVER_ERROR', e.message, 500);
    }
};

// ===========================================================================
// GET /work-orders/:id
// ===========================================================================
export const getWorkOrder = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const wo = await prisma.work_orders.findFirst({
            where: { id: Number(id), deleted_at: null },
            include: {
                customers: { select: { id: true, name: true, phone: true, email: true } },
                vehicles: { select: { id: true, plate_number: true, type: true, brand: true, model: true, year: true, frame_number: true } },
                service_bundles: true,
                checklists: true
            }
        });

        if (!wo) return errorResponse(res, 'NOT_FOUND', 'Work order tidak ditemukan', 404);

        return successResponse(res, wo, 'OK');
    } catch (e: any) {
        return errorResponse(res, 'SERVER_ERROR', e.message, 500);
    }
};

// ===========================================================================
// PUT /work-orders/:id
// ===========================================================================
export const updateWorkOrder = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { noRangka, layanan, keluhan, estimasi_biaya, estimasi_selesai, menginap, mekanik, complaint_log, service_bundle_id, image_url_1, image_url_2, image_url_3 } = req.body;

    try {
        const existing = await prisma.work_orders.findFirst({
            where: { id: Number(id), deleted_at: null }
        });
        if (!existing) return errorResponse(res, 'NOT_FOUND', 'Work order tidak ditemukan', 404);

        // Update vehicle frame number if provided
        if (noRangka && existing.vehicle_id) {
            await prisma.vehicles.update({
                where: { id: existing.vehicle_id },
                data: { frame_number: String(noRangka) }
            });
        }

        const updated = await prisma.work_orders.update({
            where: { id: Number(id) },
            data: {
                ...(layanan !== undefined && { 
                    layanan: Array.isArray(layanan) ? layanan.join(', ') : String(layanan) 
                }),
                ...(keluhan !== undefined && { keluhan }),
                ...(estimasi_biaya !== undefined && { estimasi_biaya: parseFloat(estimasi_biaya) }),
                ...(estimasi_selesai !== undefined && { estimasi_selesai }),
                ...(menginap !== undefined && { menginap: menginap === true || menginap === 'true' }),
                ...(mekanik !== undefined && { mekanik }),
                ...(complaint_log !== undefined && { complaint_log }),
                ...(service_bundle_id !== undefined && { service_bundle_id: service_bundle_id ? Number(service_bundle_id) : null }),
                ...(image_url_1 !== undefined && { image_url_1 }),
                ...(image_url_2 !== undefined && { image_url_2 }),
                ...(image_url_3 !== undefined && { image_url_3 }),
            },
            include: {
                customers: { select: { id: true, name: true, phone: true } },
                vehicles: { select: { id: true, plate_number: true, type: true, brand: true, model: true, frame_number: true } },
                checklists: true
            }
        });

        return successResponse(res, updated, 'Work order berhasil diupdate');
    } catch (e: any) {
        return errorResponse(res, 'SERVER_ERROR', e.message, 500);
    }
};

// ===========================================================================
// PATCH /work-orders/:id/status
// ===========================================================================
export const updateWorkOrderStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['menunggu', 'dikerjakan', 'menunggu_sparepart', 'selesai'];
    if (!status || !validStatuses.includes(status)) {
        return errorResponse(
            res,
            'VALIDATION_ERROR',
            `Status tidak valid. Gunakan: ${validStatuses.join(' | ')}`,
            422
        );
    }

    try {
        const wo = await prisma.work_orders.findFirst({
            where: { id: Number(id), deleted_at: null },
            include: {
                customers: { select: { phone: true, name: true } },
                vehicles: { select: { plate_number: true } }
            }
        });

        if (!wo) return errorResponse(res, 'NOT_FOUND', 'Work order tidak ditemukan', 404);

        const updated = await prisma.work_orders.update({
            where: { id: Number(id) },
            data: { status },
            include: {
                customers: { select: { id: true, name: true, phone: true } },
                vehicles: { select: { id: true, plate_number: true, type: true, brand: true, model: true } }
            }
        });
        if (
            (status === 'dikerjakan' || status === 'selesai') &&
            wo.customers?.phone
        ) {
            sendServiceProgressNotification(
                wo.customers.phone,
                wo.vehicles?.plate_number ?? 'N/A',
                status,
                Number(id)
            ).catch((err) => console.error('[WO] WA notif error:', err));
        }

        return successResponse(res, updated, `Status work order diubah ke "${status}"`);
    } catch (e: any) {
        return errorResponse(res, 'SERVER_ERROR', e.message, 500);
    }
};

// ===========================================================================
// PATCH /work-orders/:id/mechanic
// ===========================================================================
export const assignMechanic = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { mekanik } = req.body;

    if (!mekanik) {
        return errorResponse(res, 'VALIDATION_ERROR', 'Nama mekanik wajib diisi', 422);
    }

    try {
        const existing = await prisma.work_orders.findFirst({
            where: { id: Number(id), deleted_at: null }
        });
        if (!existing) return errorResponse(res, 'NOT_FOUND', 'Work order tidak ditemukan', 404);

        const updated = await prisma.work_orders.update({
            where: { id: Number(id) },
            data: { mekanik: String(mekanik) },
            include: {
                customers: { select: { id: true, name: true, phone: true } },
                vehicles: { select: { id: true, plate_number: true, type: true, brand: true, model: true, frame_number: true } }
            }
        });

        return successResponse(res, updated, `Mekanik "${mekanik}" berhasil ditugaskan`);
    } catch (e: any) {
        return errorResponse(res, 'SERVER_ERROR', e.message, 500);
    }
};

// ===========================================================================
// DELETE /work-orders/:id (soft delete)
// ===========================================================================
export const deleteWorkOrder = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const existing = await prisma.work_orders.findFirst({
            where: { id: Number(id), deleted_at: null }
        });
        if (!existing) return errorResponse(res, 'NOT_FOUND', 'Work order tidak ditemukan', 404);

        await prisma.work_orders.update({
            where: { id: Number(id) },
            data: { deleted_at: new Date() }
        });

        return successResponse(res, null, 'Work order berhasil dihapus');
    } catch (e: any) {
        return errorResponse(res, 'SERVER_ERROR', e.message, 500);
    }
};

// ===========================================================================
// GET /work-orders/:id/inspection
// ===========================================================================
export const getWorkOrderInspection = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const wo = await prisma.work_orders.findFirst({
            where: { id: Number(id), deleted_at: null },
            include: {
                customers: { select: { id: true, name: true, phone: true } },
                vehicles: { select: { id: true, plate_number: true, type: true, brand: true, model: true, frame_number: true } },
                inspection: { include: { items: { orderBy: { sort_order: 'asc' } } } }
            }
        });

        if (!wo) return errorResponse(res, 'NOT_FOUND', 'Work order tidak ditemukan', 404);

        let inspection = wo.inspection;
        if (!inspection) {
            inspection = await prisma.work_order_inspections.create({
                data: {
                    work_order_id: wo.id,
                    inspected_by: wo.mekanik ?? null,
                    items: { create: buildInspectionItems() }
                },
                include: { items: { orderBy: { sort_order: 'asc' } } }
            });
        }

        return successResponse(res, { work_order: wo, inspection }, 'OK');
    } catch (e: any) {
        return errorResponse(res, 'SERVER_ERROR', e.message, 500);
    }
};

// ===========================================================================
// PUT /work-orders/:id/inspection
// ===========================================================================
export const updateWorkOrderInspection = async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        inspection_date,
        kilometer,
        pengerjaan,
        service_request_note,
        repair_note,
        inspected_by,
        items = []
    } = req.body;

    const validStatuses = ['unchecked', 'baik', 'repair_replace'];
    const invalidItem = Array.isArray(items)
        ? items.find((item: any) => item.status && !validStatuses.includes(item.status))
        : true;

    if (invalidItem) {
        return errorResponse(res, 'VALIDATION_ERROR', 'Status inspeksi tidak valid', 422);
    }

    try {
        const existingWorkOrder = await prisma.work_orders.findFirst({
            where: { id: Number(id), deleted_at: null },
            include: { inspection: true }
        });

        if (!existingWorkOrder) return errorResponse(res, 'NOT_FOUND', 'Work order tidak ditemukan', 404);

        const inspection = await prisma.$transaction(async (tx) => {
            const baseInspection = existingWorkOrder.inspection
                ? await tx.work_order_inspections.update({
                    where: { id: existingWorkOrder.inspection.id },
                    data: {
                        ...(inspection_date !== undefined && { inspection_date: new Date(inspection_date) }),
                        ...(kilometer !== undefined && { kilometer: kilometer ? String(kilometer) : null }),
                        ...(pengerjaan !== undefined && { pengerjaan: pengerjaan ? String(pengerjaan) : null }),
                        ...(service_request_note !== undefined && { service_request_note: service_request_note ? String(service_request_note) : null }),
                        ...(repair_note !== undefined && { repair_note: repair_note ? String(repair_note) : null }),
                        ...(inspected_by !== undefined && { inspected_by: inspected_by ? String(inspected_by) : null }),
                    },
                })
                : await tx.work_order_inspections.create({
                    data: {
                        work_order_id: Number(id),
                        inspection_date: inspection_date ? new Date(inspection_date) : new Date(),
                        kilometer: kilometer ? String(kilometer) : null,
                        pengerjaan: pengerjaan ? String(pengerjaan) : null,
                        service_request_note: service_request_note ? String(service_request_note) : null,
                        repair_note: repair_note ? String(repair_note) : null,
                        inspected_by: inspected_by ? String(inspected_by) : null,
                        items: { create: buildInspectionItems() }
                    },
                });

            await Promise.all(items.map((item: any) => {
                if (!item.id) return Promise.resolve();
                return tx.work_order_inspection_items.updateMany({
                    where: {
                        id: Number(item.id),
                        inspection_id: baseInspection.id,
                    },
                    data: {
                        status: item.status ?? 'unchecked',
                        note: item.note ? String(item.note) : null,
                    },
                });
            }));

            return tx.work_order_inspections.findUnique({
                where: { id: baseInspection.id },
                include: { items: { orderBy: { sort_order: 'asc' } } }
            });
        }, { timeout: 20000 });

        return successResponse(res, inspection, 'Inspection checklist berhasil disimpan');
    } catch (e: any) {
        return errorResponse(res, 'SERVER_ERROR', e.message, 500);
    }
};
// ===========================================================================
// PATCH /work-orders/:id/checklist/:checklistId
// ===========================================================================
export const updateWorkOrderChecklist = async (req: Request, res: Response) => {
    const { id, checklistId } = req.params;
    const { is_done } = req.body;

    try {
        const item = await prisma.work_order_checklists.update({
            where: { id: Number(checklistId), work_order_id: Number(id) },
            data: { is_done: is_done === true || is_done === 'true' }
        });
        return successResponse(res, item, 'Status checklist berhasil diupdate');
    } catch (e: any) {
        return errorResponse(res, 'SERVER_ERROR', e.message, 500);
    }
};
