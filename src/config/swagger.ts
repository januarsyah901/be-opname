import swaggerJsdoc from 'swagger-jsdoc';

const serverUrl = process.env.APP_URL
    ? `${process.env.APP_URL}/api/v1`
    : 'http://localhost:3000/api/v1';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'AutoService Inventory API',
            version: '1.0.0',
            description:
                'API Backend untuk AutoService Inventory Web Panel — Manajemen spare part, transaksi, stok opname, dan laporan bengkel.',
            contact: {
                name: 'AutoService Dev Team'
            }
        },
        servers: [
            {
                url: '/api/v1',
                description: 'Auto Detect (Relative Path)'
            },
            {
                url: serverUrl,
                description: process.env.APP_URL ? 'Production' : 'Local Development'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Masukkan token JWT. Contoh: `eyJ...`'
                }
            },
            schemas: {
                // ────────────── Response Wrappers ──────────────
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { type: 'object' },
                        message: { type: 'string', example: 'OK' },
                        meta: {
                            type: 'object',
                            properties: {
                                page: { type: 'integer', example: 1 },
                                total: { type: 'integer', example: 100 },
                                per_page: { type: 'integer', example: 20 }
                            }
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: {
                            type: 'object',
                            properties: {
                                code: { type: 'string', example: 'VALIDATION_ERROR' },
                                message: { type: 'string', example: 'Field name is required' },
                                details: { type: 'object' }
                            }
                        }
                    }
                },
                // ────────────── Auth ──────────────
                LoginRequest: {
                    type: 'object',
                    required: ['username', 'password'],
                    properties: {
                        username: { type: 'string', example: 'admin' },
                        password: { type: 'string', example: 'secret' }
                    }
                },
                // ────────────── User ──────────────
                UserRequest: {
                    type: 'object',
                    required: ['name', 'username', 'password', 'role'],
                    properties: {
                        name: { type: 'string', example: 'Budi Kasir' },
                        username: { type: 'string', example: 'budi.kasir' },
                        password: { type: 'string', example: 'password123' },
                        role: {
                            type: 'string',
                            enum: ['admin', 'kasir'],
                            example: 'kasir',
                            description: 'Role yang dapat dibuat via API. Role owner hanya tersedia via seeder. Admin hanya bisa buat kasir; owner bisa buat admin & kasir.'
                        }
                    }
                },
                // ────────────── Customer ──────────────
                CustomerRequest: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: { type: 'string', example: 'Andi Susanto' },
                        phone: { type: 'string', example: '081234567890' },
                        email: { type: 'string', format: 'email', example: 'andi@email.com' },
                        address: { type: 'string', example: 'Jl. Merdeka No. 10' }
                    }
                },
                // ────────────── Vehicle ──────────────
                VehicleRequest: {
                    type: 'object',
                    required: ['plate_number', 'type'],
                    properties: {
                        plate_number: { type: 'string', example: 'B 1234 XY' },
                        type: { type: 'string', enum: ['mobil', 'motor'], example: 'mobil' },
                        brand: { type: 'string', example: 'Toyota' },
                        model: { type: 'string', example: 'Avanza' },
                        year: { type: 'integer', example: 2020 },
                        frame_number: { type: 'string', example: 'MH1234567890', description: 'Nomor Rangka (VIN) kendaraan (opsional)' }
                    }
                },
                // ────────────── Category ──────────────
                CategoryRequest: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        name: { type: 'string', example: 'Oli & Pelumas' },
                        description: { type: 'string', example: 'Semua jenis oli mesin dan pelumas' }
                    }
                },
                // ────────────── Spare Part ──────────────
                SparePartRequest: {
                    type: 'object',
                    required: ['name', 'cost_price', 'sell_price'],
                    properties: {
                        category_id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Oli Mesin 1L' },
                        cost_price: { type: 'number', example: 45000 },
                        sell_price: { type: 'number', example: 65000 },
                        current_stock: { type: 'integer', example: 20 },
                        minimum_stock: { type: 'integer', example: 5 },
                        unit: { type: 'string', example: 'liter' }
                    }
                },
                // ────────────── Stock ──────────────
                StockInRequest: {
                    type: 'object',
                    required: ['spare_part_id', 'quantity'],
                    properties: {
                        spare_part_id: { type: 'integer', example: 42 },
                        quantity: { type: 'integer', example: 10 },
                        note: { type: 'string', example: 'Restock dari Supplier ABC' }
                    }
                },
                StockOutRequest: {
                    type: 'object',
                    required: ['spare_part_id', 'quantity'],
                    properties: {
                        spare_part_id: { type: 'integer', example: 42 },
                        quantity: { type: 'integer', example: 2 },
                        note: { type: 'string', example: 'Dipakai untuk servis B 1234 XY' }
                    }
                },
                // ────────────── Opname ──────────────
                OpnameRequest: {
                    type: 'object',
                    required: ['session_name'],
                    properties: {
                        session_name: { type: 'string', example: 'Opname Februari 2026' }
                    }
                },
                OpnameItemRequest: {
                    type: 'object',
                    required: ['spare_part_id', 'physical_count'],
                    properties: {
                        spare_part_id: { type: 'integer', example: 42 },
                        physical_count: { type: 'integer', example: 18 }
                    }
                },
                // ────────────── Transaction ──────────────
                TransactionRequest: {
                    type: 'object',
                    required: ['customer_id', 'vehicle_id', 'transaction_date', 'items'],
                    properties: {
                        customer_id: { type: 'integer', example: 1 },
                        vehicle_id: { type: 'integer', example: 1 },
                        transaction_date: { type: 'string', format: 'date', example: '2026-03-02' },
                        payment_method: { type: 'string', enum: ['cash', 'transfer', 'e-wallet'], example: 'cash' },
                        notes: { type: 'string', example: 'Ganti oli + tune up' },
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['item_type', 'item_name', 'quantity', 'unit_price'],
                                properties: {
                                    item_type: { type: 'string', enum: ['spare_part', 'jasa'], example: 'spare_part' },
                                    spare_part_id: { type: 'integer', example: 42, description: 'Wajib jika item_type = spare_part' },
                                    item_name: { type: 'string', example: 'Oli Mesin 1L' },
                                    quantity: { type: 'integer', example: 1 },
                                    unit_price: { type: 'number', example: 65000 },
                                    bundle_id: { type: 'integer', example: 1, description: 'ID Paket Service (opsional)' }
                                }
                            }
                        }
                    }
                },
                PaymentUpdateRequest: {
                    type: 'object',
                    required: ['paid_amount', 'payment_status'],
                    properties: {
                        paid_amount: { type: 'number', example: 215000 },
                        payment_status: {
                            type: 'string',
                            enum: ['lunas', 'dp', 'belum_bayar'],
                            example: 'lunas',
                            description: 'lunas = sudah bayar penuh | dp = bayar sebagian (DP) | belum_bayar = belum ada pembayaran'
                        }
                    }
                },
                // ────────────── Work Order ──────────────
                WorkOrderRequest: {
                    type: 'object',
                    required: ['customer_id', 'vehicle_id', 'layanan'],
                    properties: {
                        customer_id: { type: 'integer', example: 1 },
                        vehicle_id: { type: 'integer', example: 1 },
                        layanan: { type: 'string', example: 'Ganti Oli + Tune Up' },
                        keluhan: { type: 'string', example: 'Mesin bunyi kasar saat pagi hari' },
                        estimasi_biaya: { type: 'number', example: 350000 },
                        estimasi_selesai: { type: 'string', example: '2026-03-07' },
                        menginap: { type: 'boolean', example: false },
                        mekanik: { type: 'string', example: 'Budi' },
                        complaint_log: { type: 'string', example: 'Oli rembes, rem belakang kurang pakem', description: 'Catatan keluhan detail dari pelanggan' },
                        service_bundle_id: { type: 'integer', example: 1, description: 'ID Paket Service yang dipilih. Jika diisi, checklist item akan otomatis dibuat.' }
                    }
                },
                WorkOrderStatusRequest: {
                    type: 'object',
                    required: ['status'],
                    properties: {
                        status: {
                            type: 'string',
                            enum: ['menunggu', 'dikerjakan', 'menunggu_sparepart', 'selesai'],
                            example: 'dikerjakan',
                            description: 'Status baru work order. Jika berubah ke dikerjakan/selesai, notif WA otomatis terkirim ke pelanggan.'
                        }
                    }
                },
                AssignMechanicRequest: {
                    type: 'object',
                    required: ['mekanik'],
                    properties: {
                        mekanik: { type: 'string', example: 'Ahmad Fauzi' }
                    }
                },
                // ────────────── WA Notification ──────────────
                WaTestRequest: {
                    type: 'object',
                    properties: {
                        phone: { type: 'string', example: '6281234567890', description: 'Nomor tujuan (opsional, default ke wa_target_number di settings)' },
                        message: { type: 'string', example: 'Halo! Ini pesan test dari AutoService.' }
                    }
                },
                // ────────────── Settings ──────────────
                SettingsRequest: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', example: 'Bengkel AutoService' },
                        address: { type: 'string', example: 'Jl. Raya Bandung No. 99' },
                        phone: { type: 'string', example: '022-123456' },
                        logo_url: { type: 'string', example: 'https://cdn.example.com/logo.png' },
                        wa_gateway_token: { type: 'string', example: 'token_gateway_jika_pakai_pihak_ketiga', description: 'Token gateway WA pihak ketiga (opsional, tidak dipakai jika memakai WA Web.js)' },
                        wa_target_number: { type: 'string', example: '6281234567890', description: 'Nomor WA penerima notifikasi default (format internasional tanpa +)' }
                    }
                },
                // ────────────── Service Catalog ──────────────
                ServiceCatalogRequest: {
                    type: 'object',
                    required: ['name', 'standard_price', 'berlaku_untuk'],
                    properties: {
                        name: { type: 'string', example: 'Ganti Oli & Filter' },
                        description: { type: 'string', example: 'Penggantian oli mesin dan filter oli' },
                        kategori: {
                            type: 'string',
                            example: 'Mesin',
                            description: 'Kategori layanan: Mesin | Rem & Transmisi | Kelistrikan | AC & Kabin | Body & Cat | Lainnya'
                        },
                        standard_price: { type: 'number', example: 50000 },
                        durasi_estimasi: { type: 'string', example: '30-45 menit' },
                        berlaku_untuk: {
                            type: 'string',
                            enum: ['mobil', 'motor', 'keduanya'],
                            example: 'keduanya',
                            description: 'Jenis kendaraan yang dilayani'
                        },
                        garansi: { type: 'string', example: '1 bulan / 1.000 km', description: 'Garansi layanan (opsional)' }
                    }
                },
                // ────────────── Service Bundle ──────────────
                ServiceBundleRequest: {
                    type: 'object',
                    required: ['name', 'price'],
                    properties: {
                        name: { type: 'string', example: 'Paket Lengkap' },
                        description: { type: 'string', example: 'Servis menyeluruh untuk performa maksimal' },
                        price: { type: 'number', example: 250000 },
                        is_active: { type: 'boolean', example: true },
                        tasks: {
                            type: 'array',
                            items: { type: 'string', example: 'Setel Karburator' },
                            description: 'Daftar itemized job / checklist yang akan muncul di SPK'
                        }
                    }
                },
                WorkOrderChecklistRequest: {
                    type: 'object',
                    required: ['is_done'],
                    properties: {
                        is_done: { type: 'boolean', example: true }
                    }
                }
            }
        },
        security: [{ BearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'Autentikasi & manajemen sesi' },
            { name: 'Users', description: 'Manajemen pengguna (Owner & Admin only)' },
            { name: 'Customers', description: 'Manajemen data customer' },
            { name: 'Vehicles', description: 'Kendaraan milik customer' },
            { name: 'Categories', description: 'Kategori spare part' },
            { name: 'Spare Parts', description: 'Inventori spare part / barang' },
            { name: 'Stock', description: 'Pergerakan stok (masuk & keluar)' },
            { name: 'Opname', description: 'Sesi stock opname fisik' },
            { name: 'Work Orders', description: 'Work Order / antrian servis kendaraan' },
            { name: 'Service Catalog', description: 'Katalog jasa / layanan bengkel' },
            { name: 'Transactions', description: 'Transaksi / nota servis' },
            { name: 'Service Bundles', description: 'Master paket layanan & checklist' },
            { name: 'Reports', description: 'Laporan omset & stok' },
            { name: 'Notifications', description: 'Notifikasi WhatsApp & manajemen koneksi WA Web.js' },
            { name: 'Settings', description: 'Pengaturan profil bengkel' }
        ],
        paths: {
            // ══════════════════ AUTH ══════════════════
            '/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login user',
                    security: [],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } }
                    },
                    responses: {
                        200: {
                            description: 'Login berhasil, token dikembalikan',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: {
                                            token: 'eyJ...',
                                            expires_in: 86400,
                                            user: { id: 1, name: 'Admin', role: 'admin' }
                                        }
                                    }
                                }
                            }
                        },
                        401: { description: 'Kredensial tidak valid', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                    }
                }
            },
            '/auth/logout': {
                post: {
                    tags: ['Auth'],
                    summary: 'Logout (invalidate token)',
                    responses: {
                        200: { description: 'Logout berhasil' }
                    }
                }
            },
            '/auth/me': {
                get: {
                    tags: ['Auth'],
                    summary: 'Ambil data user yang sedang login',
                    responses: {
                        200: { description: 'Data user yang login' },
                        401: { description: 'Token tidak valid', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                    }
                }
            },
            // ══════════════════ USERS ══════════════════
            '/users': {
                get: {
                    tags: ['Users'],
                    summary: 'List semua user',
                    responses: { 200: { description: 'Daftar user' } }
                },
                post: {
                    tags: ['Users'],
                    summary: 'Buat user baru',
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserRequest' } } }
                    },
                    responses: {
                        201: { description: 'User berhasil dibuat' },
                        422: { description: 'Validasi gagal', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                    }
                }
            },
            '/users/{id}': {
                get: {
                    tags: ['Users'],
                    summary: 'Detail user',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Detail user' }, 404: { description: 'User tidak ditemukan' } }
                },
                put: {
                    tags: ['Users'],
                    summary: 'Update data user',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserRequest' } } } },
                    responses: { 200: { description: 'User diupdate' }, 404: { description: 'User tidak ditemukan' } }
                },
                delete: {
                    tags: ['Users'],
                    summary: 'Nonaktifkan user (soft delete)',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'User dihapus (soft)' }, 404: { description: 'User tidak ditemukan' } }
                }
            },
            // ══════════════════ CUSTOMERS ══════════════════
            '/customers': {
                get: {
                    tags: ['Customers'],
                    summary: 'List customer (paginated)',
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                        { name: 'search', in: 'query', schema: { type: 'string' } }
                    ],
                    responses: { 200: { description: 'Daftar customer' } }
                },
                post: {
                    tags: ['Customers'],
                    summary: 'Tambah customer baru',
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerRequest' } } } },
                    responses: { 201: { description: 'Customer berhasil dibuat' } }
                }
            },
            '/customers/{id}': {
                get: {
                    tags: ['Customers'],
                    summary: 'Detail customer beserta daftar kendaraannya',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Detail customer + kendaraan' }, 404: { description: 'Customer tidak ditemukan' } }
                },
                put: {
                    tags: ['Customers'],
                    summary: 'Update data customer',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerRequest' } } } },
                    responses: { 200: { description: 'Customer diupdate' } }
                },
                delete: {
                    tags: ['Customers'],
                    summary: 'Soft delete customer',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Customer dihapus (soft)' } }
                }
            },
            '/customers/{id}/history': {
                get: {
                    tags: ['Customers'],
                    summary: 'Riwayat servis customer',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: {
                        200: {
                            description: 'Riwayat transaksi customer',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: {
                                            customer: { id: 1, name: 'Andi Susanto' },
                                            transactions: [
                                                {
                                                    invoice_number: 'INV-20260302-001',
                                                    vehicle: { plate: 'B 1234 XY', type: 'mobil' },
                                                    total_amount: 350000,
                                                    payment_status: 'lunas',
                                                    transaction_date: '2026-03-01'
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            // ══════════════════ VEHICLES ══════════════════
            '/customers/{id}/vehicles': {
                get: {
                    tags: ['Vehicles'],
                    summary: 'List kendaraan milik customer',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Daftar kendaraan' } }
                },
                post: {
                    tags: ['Vehicles'],
                    summary: 'Tambah kendaraan untuk customer',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VehicleRequest' } } } },
                    responses: { 201: { description: 'Kendaraan ditambahkan' } }
                }
            },
            '/vehicles/{id}': {
                put: {
                    tags: ['Vehicles'],
                    summary: 'Update data kendaraan',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VehicleRequest' } } } },
                    responses: { 200: { description: 'Kendaraan diupdate' }, 404: { description: 'Kendaraan tidak ditemukan' } }
                }
            },
            // ══════════════════ CATEGORIES ══════════════════
            '/categories': {
                get: {
                    tags: ['Categories'],
                    summary: 'List semua kategori',
                    responses: { 200: { description: 'Daftar kategori' } }
                },
                post: {
                    tags: ['Categories'],
                    summary: 'Buat kategori baru',
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CategoryRequest' } } } },
                    responses: { 201: { description: 'Kategori dibuat' } }
                }
            },
            '/categories/{id}': {
                put: {
                    tags: ['Categories'],
                    summary: 'Update kategori',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CategoryRequest' } } } },
                    responses: { 200: { description: 'Kategori diupdate' } }
                },
                delete: {
                    tags: ['Categories'],
                    summary: 'Hapus kategori',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Kategori dihapus' } }
                }
            },
            // ══════════════════ SPARE PARTS ══════════════════
            '/spare-parts': {
                get: {
                    tags: ['Spare Parts'],
                    summary: 'List semua spare part / inventory item',
                    parameters: [
                        { name: 'category_id', in: 'query', schema: { type: 'integer' }, description: 'Filter berdasarkan kategori' },
                        { name: 'low_stock', in: 'query', schema: { type: 'boolean' }, description: 'Tampilkan hanya item yang stok menipis' },
                        { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Cari berdasarkan nama / SKU' }
                    ],
                    responses: { 200: { description: 'Daftar spare part' } }
                },
                post: {
                    tags: ['Spare Parts'],
                    summary: 'Tambah item baru (SKU & barcode di-generate otomatis oleh BE)',
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SparePartRequest' } } } },
                    responses: {
                        201: {
                            description: 'Item berhasil dibuat',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: {
                                            id: 42, sku: 'AS-MOB-0042',
                                            barcode_value: 'AS-MOB-0042',
                                            barcode_image_url: '/storage/barcodes/AS-MOB-0042.png'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/spare-parts/{id}': {
                get: {
                    tags: ['Spare Parts'],
                    summary: 'Detail item + riwayat stok',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Detail spare part' }, 404: { description: 'Item tidak ditemukan' } }
                },
                put: {
                    tags: ['Spare Parts'],
                    summary: 'Update data spare part',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SparePartRequest' } } } },
                    responses: { 200: { description: 'Item diupdate' } }
                },
                delete: {
                    tags: ['Spare Parts'],
                    summary: 'Soft delete spare part',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Item dihapus (soft)' } }
                }
            },
            '/spare-parts/{id}/barcode': {
                get: {
                    tags: ['Spare Parts'],
                    summary: 'Ambil barcode image (PNG/SVG)',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Barcode image URL' } }
                }
            },
            '/spare-parts/{id}/barcode/print': {
                post: {
                    tags: ['Spare Parts'],
                    summary: 'Generate PDF barcode untuk dicetak',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'PDF URL untuk cetak barcode' } }
                }
            },
            // ══════════════════ STOCK ══════════════════
            '/stock-movements': {
                get: {
                    tags: ['Stock'],
                    summary: 'Log semua pergerakan stok',
                    parameters: [
                        { name: 'spare_part_id', in: 'query', schema: { type: 'integer' }, description: 'Filter berdasarkan spare part tertentu' },
                        {
                            name: 'type', in: 'query',
                            schema: { type: 'string', enum: ['masuk', 'keluar', 'opname_adjustment'] },
                            description: 'Filter berdasarkan tipe pergerakan'
                        }
                    ],
                    responses: { 200: { description: 'Daftar log pergerakan stok' } }
                }
            },
            '/stock/in': {
                post: {
                    tags: ['Stock'],
                    summary: 'Catat stok masuk (restock)',
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StockInRequest' } } } },
                    responses: { 200: { description: 'Stok berhasil ditambah, stok terbaru dikembalikan' } }
                }
            },
            '/stock/out': {
                post: {
                    tags: ['Stock'],
                    summary: 'Catat stok keluar manual',
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StockOutRequest' } } } },
                    responses: {
                        200: { description: 'Stok berhasil dikurangi' },
                        422: { description: 'Stok tidak cukup (STOCK_INSUFFICIENT)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                    }
                }
            },
            // ══════════════════ OPNAME ══════════════════
            '/opnames': {
                get: {
                    tags: ['Opname'],
                    summary: 'List semua sesi opname',
                    responses: { 200: { description: 'Daftar sesi opname' } }
                },
                post: {
                    tags: ['Opname'],
                    summary: 'Mulai sesi opname baru',
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OpnameRequest' } } } },
                    responses: {
                        201: { description: 'Sesi opname berhasil dibuat' },
                        409: { description: 'Sudah ada sesi opname yang terbuka (OPNAME_ALREADY_OPEN)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                    }
                }
            },
            '/opnames/{id}': {
                get: {
                    tags: ['Opname'],
                    summary: 'Detail sesi opname beserta semua item',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Detail sesi opname' }, 404: { description: 'Sesi tidak ditemukan' } }
                }
            },
            '/opnames/{id}/items': {
                post: {
                    tags: ['Opname'],
                    summary: 'Input hitungan fisik per item',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OpnameItemRequest' } } } },
                    responses: { 200: { description: 'Hitungan fisik tersimpan' } }
                }
            },
            '/opnames/{id}/items/{item_id}': {
                put: {
                    tags: ['Opname'],
                    summary: 'Update hitungan fisik item',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
                        { name: 'item_id', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OpnameItemRequest' } } } },
                    responses: { 200: { description: 'Hitungan fisik diupdate' } }
                }
            },
            '/opnames/{id}/close': {
                post: {
                    tags: ['Opname'],
                    summary: 'Tutup sesi & apply adjustment stok otomatis',
                    description: 'BE otomatis membuat stock_movements dengan type `opname_adjustment` untuk semua item yang ada selisih.',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Sesi ditutup, stok disesuaikan' } }
                }
            },
            // ══════════════════ WORK ORDERS ══════════════════
            '/work-orders': {
                get: {
                    tags: ['Work Orders'],
                    summary: 'List semua work order (paginated)',
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                        {
                            name: 'status', in: 'query',
                            schema: { type: 'string', enum: ['menunggu', 'dikerjakan', 'menunggu_sparepart', 'selesai'] },
                            description: 'Filter berdasarkan status'
                        },
                        { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filter berdasarkan tanggal masuk (YYYY-MM-DD)' }
                    ],
                    responses: {
                        200: {
                            description: 'Daftar work order',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: [{
                                            id: 1,
                                            layanan: 'Ganti Oli + Tune Up',
                                            keluhan: 'Mesin bunyi kasar',
                                            status: 'menunggu',
                                            mekanik: 'Budi',
                                            estimasi_biaya: '350000.00',
                                            menginap: false,
                                            waktu_masuk: '2026-03-06T08:00:00.000Z',
                                            customers: { id: 1, name: 'Andi Susanto', phone: '081234567890' },
                                            vehicles: { id: 1, plate_number: 'B 1234 XY', type: 'mobil', brand: 'Toyota', model: 'Avanza' }
                                        }],
                                        meta: { page: 1, total: 1, per_page: 20 }
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    tags: ['Work Orders'],
                    summary: 'Buat work order baru',
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkOrderRequest' } } }
                    },
                    responses: {
                        201: { description: 'Work order berhasil dibuat' },
                        422: { description: 'Validasi gagal (customer_id / vehicle_id / layanan wajib)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                    }
                }
            },
            '/work-orders/{id}': {
                get: {
                    tags: ['Work Orders'],
                    summary: 'Detail work order',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Detail work order beserta data customer & kendaraan' }, 404: { description: 'Work order tidak ditemukan' } }
                },
                put: {
                    tags: ['Work Orders'],
                    summary: 'Update data work order (layanan, keluhan, estimasi, dll)',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkOrderRequest' } } }
                    },
                    responses: { 200: { description: 'Work order diupdate' }, 404: { description: 'Work order tidak ditemukan' } }
                },
                delete: {
                    tags: ['Work Orders'],
                    summary: 'Soft delete work order',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Work order berhasil dihapus (soft delete)' }, 404: { description: 'Work order tidak ditemukan' } }
                }
            },
            '/work-orders/{id}/status': {
                patch: {
                    tags: ['Work Orders'],
                    summary: 'Update status work order',
                    description: 'Mengubah status work order. Jika status berubah ke `dikerjakan` atau `selesai`, notifikasi WA otomatis dikirimkan ke nomor pelanggan.',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkOrderStatusRequest' } } }
                    },
                    responses: {
                        200: { description: 'Status berhasil diubah' },
                        404: { description: 'Work order tidak ditemukan' },
                        422: { description: 'Status tidak valid', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                    }
                }
            },
            '/work-orders/{id}/mechanic': {
                patch: {
                    tags: ['Work Orders'],
                    summary: 'Assign / ganti mekanik untuk work order',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignMechanicRequest' } } }
                    },
                    responses: {
                        200: { description: 'Mekanik berhasil ditugaskan' },
                        404: { description: 'Work order tidak ditemukan' },
                        422: { description: 'Nama mekanik wajib diisi', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                    }
                }
            },
            '/work-orders/{id}/checklist/{checklistId}': {
                patch: {
                    tags: ['Work Orders'],
                    summary: 'Update status checklist item (is_done)',
                    description: 'Digunakan oleh mekanik untuk menandai pekerjaan tertentu dalam paket service sudah selesai.',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
                        { name: 'checklistId', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkOrderChecklistRequest' } } }
                    },
                    responses: {
                        200: { description: 'Status checklist diupdate' },
                        404: { description: 'Work Order / Checklist Item tidak ditemukan' }
                    }
                }
            },
            // ══════════════════ TRANSACTIONS ══════════════════
            '/transactions': {
                get: {
                    tags: ['Transactions'],
                    summary: 'List transaksi',
                    parameters: [
                        { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filter tanggal (YYYY-MM-DD)' },
                        { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'lunas', 'sebagian'] } }
                    ],
                    responses: { 200: { description: 'Daftar transaksi' } }
                },
                post: {
                    tags: ['Transactions'],
                    summary: 'Buat nota / invoice baru',
                    description: 'BE otomatis: kurangi stok spare_part, hitung total, generate invoice_number.',
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TransactionRequest' } } } },
                    responses: {
                        201: { description: 'Transaksi berhasil dibuat' },
                        422: { description: 'Stok tidak cukup', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                    }
                }
            },
            '/transactions/{id}': {
                get: {
                    tags: ['Transactions'],
                    summary: 'Detail transaksi + semua item',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Detail transaksi' }, 404: { description: 'Transaksi tidak ditemukan' } }
                }
            },
            '/transactions/{id}/payment': {
                patch: {
                    tags: ['Transactions'],
                    summary: 'Update status & jumlah pembayaran',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PaymentUpdateRequest' } } } },
                    responses: { 200: { description: 'Status pembayaran diupdate' } }
                }
            },
            '/transactions/{id}/pdf': {
                get: {
                    tags: ['Transactions'],
                    summary: 'Generate PDF nota/invoice',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'URL file PDF nota' } }
                }
            },
            // ══════════════════ REPORTS ══════════════════
            '/reports/revenue': {
                get: {
                    tags: ['Reports'],
                    summary: 'Laporan omset (harian / bulanan)',
                    parameters: [
                        { name: 'period', in: 'query', required: true, schema: { type: 'string', enum: ['daily', 'monthly'] }, example: 'monthly' },
                        { name: 'date', in: 'query', required: true, schema: { type: 'string' }, example: '2026-03', description: 'YYYY-MM untuk monthly, YYYY-MM-DD untuk daily' }
                    ],
                    responses: {
                        200: {
                            description: 'Laporan omset',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: {
                                            period: '2026-03',
                                            total_revenue: 12500000,
                                            total_transactions: 48,
                                            gross_profit: 4200000,
                                            daily_breakdown: [{ date: '2026-03-01', revenue: 850000 }]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/reports/top-products': {
                get: {
                    tags: ['Reports'],
                    summary: 'Top spare part / produk terlaris',
                    parameters: [
                        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
                    ],
                    responses: { 200: { description: 'Daftar produk terlaris' } }
                }
            },
            '/reports/low-stock': {
                get: {
                    tags: ['Reports'],
                    summary: 'Daftar barang stok menipis',
                    responses: { 200: { description: 'Barang dengan stok di bawah minimum' } }
                }
            },
            '/reports/opname/{id}': {
                get: {
                    tags: ['Reports'],
                    summary: 'Rekap hasil opname tertentu',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Rekap opname' }, 404: { description: 'Opname tidak ditemukan' } }
                }
            },
            // ══════════════════ NOTIFICATIONS ══════════════════
            '/notifications/wa': {
                get: {
                    tags: ['Notifications'],
                    summary: 'Log semua notifikasi WhatsApp',
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                        { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'sent', 'failed'] }, description: 'Filter berdasarkan status pengiriman' }
                    ],
                    responses: {
                        200: {
                            description: 'Daftar log notifikasi WA',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: [{
                                            id: 1,
                                            wa_number: '6281234567890',
                                            message_body: 'Stok Oli Mesin 1L menipis (sisa 3 pcs)',
                                            status: 'sent',
                                            sent_at: '2026-03-06T08:00:00.000Z',
                                            created_at: '2026-03-06T07:59:55.000Z'
                                        }]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/notifications/wa/status': {
                get: {
                    tags: ['Notifications'],
                    summary: 'Cek status koneksi WhatsApp Web.js',
                    description: 'Mengembalikan status koneksi klien WA Web.js. Status yang mungkin: `initializing` | `qr_ready` | `authenticated` | `ready` | `disconnected`.',
                    responses: {
                        200: {
                            description: 'Status koneksi WA',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: {
                                            status: 'ready',
                                            qr_expires_at: null
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/notifications/wa/qr': {
                get: {
                    tags: ['Notifications'],
                    summary: 'Ambil QR code untuk scan WhatsApp',
                    description: 'Mengembalikan QR code dalam format base64 yang perlu di-scan melalui WhatsApp di HP. Hanya tersedia saat status `QR_REQUIRED`.',
                    responses: {
                        200: {
                            description: 'QR code berhasil diambil',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: { qr: 'data:image/png;base64,iVBORw0KGgo...' }
                                    }
                                }
                            }
                        },
                        404: { description: 'QR code belum tersedia (klien belum siap atau sudah terhubung)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                    }
                }
            },
            '/notifications/wa/restart': {
                post: {
                    tags: ['Notifications'],
                    summary: 'Restart koneksi WhatsApp Web.js',
                    description: 'Menghentikan dan memulai ulang klien WA Web.js. Gunakan jika koneksi bermasalah atau perlu scan ulang QR.',
                    responses: {
                        200: { description: 'Klien WA berhasil di-restart, tunggu QR code baru' }
                    }
                }
            },
            '/notifications/wa/test': {
                post: {
                    tags: ['Notifications'],
                    summary: 'Kirim pesan WA test',
                    description: 'Mengirim pesan WhatsApp test. Jika `phone` tidak disertakan, pesan dikirim ke `wa_target_number` yang tersimpan di settings bengkel.',
                    requestBody: {
                        required: false,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/WaTestRequest' } } }
                    },
                    responses: {
                        200: { description: 'Pesan test berhasil dikirim' },
                        503: { description: 'Klien WA belum terhubung (QR perlu di-scan)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                    }
                }
            },
            '/notifications/wa/retry/{id}': {
                post: {
                    tags: ['Notifications'],
                    summary: 'Kirim ulang notifikasi WA yang gagal',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID notifikasi dari log wa_notifications' }],
                    responses: {
                        200: { description: 'Notifikasi berhasil dikirim ulang' },
                        404: { description: 'Notifikasi tidak ditemukan', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                        503: { description: 'Klien WA belum terhubung', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                    }
                }
            },
            // ══════════════════ SERVICE CATALOG ══════════════════
            '/service-catalog': {
                get: {
                    tags: ['Service Catalog'],
                    summary: 'List semua jasa / layanan bengkel',
                    parameters: [
                        {
                            name: 'berlaku_untuk', in: 'query',
                            schema: { type: 'string', enum: ['mobil', 'motor', 'keduanya'] },
                            description: 'Filter berdasarkan jenis kendaraan'
                        },
                        {
                            name: 'is_active', in: 'query',
                            schema: { type: 'boolean' },
                            description: 'Filter berdasarkan status aktif (true/false)'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Daftar layanan',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: [{
                                            id: 1,
                                            name: 'Ganti Oli & Filter',
                                            kategori: 'Mesin',
                                            standard_price: '50000.00',
                                            durasi_estimasi: '30-45 menit',
                                            berlaku_untuk: 'keduanya',
                                            garansi: '1 bulan / 1.000 km',
                                            is_active: true
                                        }]
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    tags: ['Service Catalog'],
                    summary: 'Tambah jasa / layanan baru',
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ServiceCatalogRequest' } } }
                    },
                    responses: {
                        201: { description: 'Layanan berhasil ditambahkan' },
                        422: { description: 'Validasi gagal', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                    }
                }
            },
            '/service-catalog/{id}': {
                put: {
                    tags: ['Service Catalog'],
                    summary: 'Update data layanan',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ServiceCatalogRequest' } } }
                    },
                    responses: { 200: { description: 'Layanan diupdate' }, 404: { description: 'Layanan tidak ditemukan' } }
                },
                delete: {
                    tags: ['Service Catalog'],
                    summary: 'Hapus layanan',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Layanan berhasil dihapus' }, 404: { description: 'Layanan tidak ditemukan' } }
                }
            },
            '/service-catalog/{id}/toggle': {
                patch: {
                    tags: ['Service Catalog'],
                    summary: 'Aktifkan / nonaktifkan layanan',
                    description: 'Toggle field `is_active`. Jika aktif → nonaktif, jika nonaktif → aktif.',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: {
                        200: {
                            description: 'Status layanan berhasil diubah',
                            content: {
                                'application/json': {
                                    example: {
                                        success: true,
                                        data: { id: 1, name: 'Ganti Oli & Filter', is_active: false },
                                        message: 'Layanan berhasil dinonaktifkan'
                                    }
                                }
                            }
                        },
                        404: { description: 'Layanan tidak ditemukan', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                    }
                }
            },
            // ══════════════════ SERVICE BUNDLES ══════════════════
            '/service-bundles': {
                get: {
                    tags: ['Service Bundles'],
                    summary: 'List semua paket layanan',
                    responses: { 200: { description: 'Daftar paket layanan' } }
                },
                post: {
                    tags: ['Service Bundles'],
                    summary: 'Buat paket layanan baru beserta items checklist nya',
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ServiceBundleRequest' } } }
                    },
                    responses: { 201: { description: 'Paket berhasil dibuat' } }
                }
            },
            '/service-bundles/{id}': {
                get: {
                    tags: ['Service Bundles'],
                    summary: 'Detail paket layanan dan item nya',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Detail paket' }, 404: { description: 'Paket tidak ditemukan' } }
                },
                put: {
                    tags: ['Service Bundles'],
                    summary: 'Update paket layanan (termasuk replace tasks)',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ServiceBundleRequest' } } }
                    },
                    responses: { 200: { description: 'Paket diupdate' } }
                },
                delete: {
                    tags: ['Service Bundles'],
                    summary: 'Hapus paket layanan',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: { 200: { description: 'Paket dihapus' } }
                }
            },
            // ══════════════════ SETTINGS ══════════════════
            '/settings': {
                get: {
                    tags: ['Settings'],
                    summary: 'Ambil profil bengkel & konfigurasi',
                    responses: { 200: { description: 'Data settings bengkel' } }
                },
                put: {
                    tags: ['Settings'],
                    summary: 'Update profil bengkel + WA config',
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SettingsRequest' } } } },
                    responses: { 200: { description: 'Settings diupdate' } }
                }
            }
        }
    },
    apis: [] // We use inline definition above, no JSDoc needed
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
