# 📖 Frontend API Integration Guide — AutoService Inventory

> Dokumen ini menjelaskan cara frontend (React, Vue, Next.js, atau vanilla JS) mengonsumsi
> REST API AutoService Inventory secara lengkap dan konsisten.

---

## 📌 Daftar Isi

1. [Base URL & Environment](#1-base-url--environment)
2. [Autentikasi](#2-autentikasi)
3. [Format Response](#3-format-response)
4. [Setup HTTP Client (Axios)](#4-setup-http-client-axios)
5. [Modul Auth](#5-modul-auth)
6. [Modul Users](#6-modul-users)
7. [Modul Customers & Vehicles](#7-modul-customers--vehicles)
8. [Modul Categories](#8-modul-categories)
9. [Modul Spare Parts](#9-modul-spare-parts)
10. [Modul Stock](#10-modul-stock)
11. [Modul Opname](#11-modul-opname)
12. [Modul Work Orders](#12-modul-work-orders)
13. [Modul Transactions](#13-modul-transactions)
14. [Modul Reports](#14-modul-reports)
15. [Modul Notifications & WA](#15-modul-notifications--wa)
16. [Modul Settings](#16-modul-settings)
17. [Error Handling Global](#17-error-handling-global)
18. [Tips & Best Practices](#18-tips--best-practices)

---

## 1. Base URL & Environment

```env
# .env (development)
VITE_API_BASE_URL=http://localhost:3000/api/v1

# .env.production
VITE_API_BASE_URL=https://your-production-domain.vercel.app/api/v1
```

> Swagger UI tersedia di: `http://localhost:3000/` (local) atau `https://your-domain.vercel.app/`
> OpenAPI JSON: `GET /api/docs.json`

---

## 2. Autentikasi

API menggunakan **JWT Bearer Token**.

### Cara kerja:
1. Login → dapatkan `token`
2. Simpan `token` di `localStorage` (atau `httpOnly cookie` jika lebih aman)
3. Sertakan di setiap request: `Authorization: Bearer <token>`

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Format Response

Semua response mengikuti **struktur yang konsisten**:

### ✅ Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "OK"
}
```

### ✅ Success Response dengan Pagination
```json
{
  "success": true,
  "data": [ ... ],
  "message": "OK",
  "meta": {
    "page": 1,
    "total": 42,
    "per_page": 20
  }
}
```

### ❌ Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "customer_id, vehicle_id, dan layanan wajib diisi",
    "details": {}
  }
}
```

| Error Code | HTTP Status | Keterangan |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Field tidak valid / kurang |
| `NOT_FOUND` | 404 | Resource tidak ditemukan |
| `UNAUTHORIZED` | 401 | Token tidak ada / tidak valid |
| `CONFLICT` | 409 | Data duplikat (misal: username sudah ada) |
| `STOCK_INSUFFICIENT` | 422 | Stok tidak mencukupi |
| `OPNAME_ALREADY_OPEN` | 409 | Ada sesi opname yang belum ditutup |
| `SERVER_ERROR` | 500 | Error internal server |

---

## 4. Setup HTTP Client (Axios)

Install: `npm install axios`

```ts
// src/lib/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // http://localhost:3000/api/v1
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 detik
});

// ── Request interceptor: otomatis sisipkan token ──────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: global error handling ───────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const code = error.response?.data?.error?.code;
    const status = error.response?.status;

    if (status === 401 || code === 'UNAUTHORIZED') {
      // Token expired / tidak valid → redirect ke login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 5. Modul Auth

### 5.1 Login
```ts
// POST /auth/login
interface LoginPayload {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  expires_in: number;
  user: { id: number; name: string; role: string };
}

async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post('/auth/login', payload);
  // Simpan token
  localStorage.setItem('token', data.data.token);
  localStorage.setItem('user', JSON.stringify(data.data.user));
  return data.data;
}
```

### 5.2 Logout
```ts
// POST /auth/logout
async function logout() {
  await apiClient.post('/auth/logout');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
```

### 5.3 Ambil data user yang sedang login
```ts
// GET /auth/me
async function getMe() {
  const { data } = await apiClient.get('/auth/me');
  return data.data; // { id, name, username, role }
}
```

---

## 6. Modul Users

> ⚠️ Endpoint ini hanya boleh diakses oleh user dengan role `admin`.

```ts
// GET /users — List semua user
async function getUsers() {
  const { data } = await apiClient.get('/users');
  return data.data; // User[]
}

// POST /users — Buat user baru
async function createUser(payload: {
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'mekanik' | 'kasir';
}) {
  const { data } = await apiClient.post('/users', payload);
  return data.data;
}

// PUT /users/:id — Update user
async function updateUser(id: number, payload: Partial<{
  name: string;
  username: string;
  password: string;
  role: string;
  is_active: boolean;
}>) {
  const { data } = await apiClient.put(`/users/${id}`, payload);
  return data.data;
}

// DELETE /users/:id — Soft delete
async function deleteUser(id: number) {
  const { data } = await apiClient.delete(`/users/${id}`);
  return data;
}
```

---

## 7. Modul Customers & Vehicles

```ts
// GET /customers?page=1&search=andi
async function getCustomers(page = 1, search = '') {
  const { data } = await apiClient.get('/customers', {
    params: { page, search }
  });
  return data; // { data: Customer[], meta: { page, total, per_page } }
}

// POST /customers
async function createCustomer(payload: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}) {
  const { data } = await apiClient.post('/customers', payload);
  return data.data;
}

// GET /customers/:id — Detail + list kendaraan
async function getCustomer(id: number) {
  const { data } = await apiClient.get(`/customers/${id}`);
  return data.data;
}

// GET /customers/:id/history — Riwayat servis
async function getCustomerHistory(id: number) {
  const { data } = await apiClient.get(`/customers/${id}/history`);
  return data.data; // { customer, transactions[] }
}

// ── Vehicles ──────────────────────────────────────────────────────────────

// GET /customers/:id/vehicles
async function getVehicles(customerId: number) {
  const { data } = await apiClient.get(`/customers/${customerId}/vehicles`);
  return data.data;
}

// POST /customers/:id/vehicles — Tambah kendaraan
async function addVehicle(customerId: number, payload: {
  plate_number: string;
  type: 'mobil' | 'motor';
  brand?: string;
  model?: string;
  year?: number;
}) {
  const { data } = await apiClient.post(`/customers/${customerId}/vehicles`, payload);
  return data.data;
}

// PUT /vehicles/:id — Update kendaraan
async function updateVehicle(vehicleId: number, payload: object) {
  const { data } = await apiClient.put(`/vehicles/${vehicleId}`, payload);
  return data.data;
}
```

---

## 8. Modul Categories

```ts
// GET /categories
async function getCategories() {
  const { data } = await apiClient.get('/categories');
  return data.data;
}

// POST /categories
async function createCategory(payload: { name: string; description?: string }) {
  const { data } = await apiClient.post('/categories', payload);
  return data.data;
}

// PUT /categories/:id
async function updateCategory(id: number, payload: { name: string; description?: string }) {
  const { data } = await apiClient.put(`/categories/${id}`, payload);
  return data.data;
}

// DELETE /categories/:id
async function deleteCategory(id: number) {
  const { data } = await apiClient.delete(`/categories/${id}`);
  return data;
}
```

---

## 9. Modul Spare Parts

```ts
// GET /spare-parts?category_id=1&low_stock=true&search=oli
async function getSpareParts(params?: {
  category_id?: number;
  low_stock?: boolean;
  search?: string;
}) {
  const { data } = await apiClient.get('/spare-parts', { params });
  return data.data;
}

// POST /spare-parts — SKU & barcode digenerate otomatis oleh BE
async function createSparePart(payload: {
  name: string;
  cost_price: number;
  sell_price: number;
  category_id?: number;
  current_stock?: number;
  minimum_stock?: number;
  unit?: string;
}) {
  const { data } = await apiClient.post('/spare-parts', payload);
  // Response: { id, sku, barcode_value, barcode_image_url, ... }
  return data.data;
}

// GET /spare-parts/:id — Detail + riwayat stok
async function getSparePart(id: number) {
  const { data } = await apiClient.get(`/spare-parts/${id}`);
  return data.data;
}

// GET /spare-parts/:id/barcode — URL gambar barcode
async function getBarcode(id: number) {
  const { data } = await apiClient.get(`/spare-parts/${id}/barcode`);
  return data.data; // { barcode_image_url }
}
```

---

## 10. Modul Stock

```ts
// POST /stock/in — Stok masuk (restock)
async function stockIn(payload: {
  spare_part_id: number;
  quantity: number;
  note?: string;
}) {
  const { data } = await apiClient.post('/stock/in', payload);
  return data.data; // { current_stock: 30 }
}

// POST /stock/out — Stok keluar manual
async function stockOut(payload: {
  spare_part_id: number;
  quantity: number;
  note?: string;
}) {
  try {
    const { data } = await apiClient.post('/stock/out', payload);
    return data.data;
  } catch (err: any) {
    if (err.response?.data?.error?.code === 'STOCK_INSUFFICIENT') {
      throw new Error('Stok tidak mencukupi!');
    }
    throw err;
  }
}

// GET /stock-movements?spare_part_id=42&type=in
async function getStockMovements(params?: {
  spare_part_id?: number;
  type?: 'in' | 'out' | 'opname_adjustment';
}) {
  const { data } = await apiClient.get('/stock-movements', { params });
  return data.data;
}
```

---

## 11. Modul Opname

```ts
// GET /opnames — List semua sesi
async function getOpnames() {
  const { data } = await apiClient.get('/opnames');
  return data.data;
}

// POST /opnames — Mulai sesi baru
async function createOpname(session_name: string) {
  const { data } = await apiClient.post('/opnames', { session_name });
  return data.data;
}

// GET /opnames/:id — Detail sesi + semua item
async function getOpname(id: number) {
  const { data } = await apiClient.get(`/opnames/${id}`);
  return data.data;
}

// POST /opnames/:id/items — Input hitungan fisik
async function addOpnameItem(opnameId: number, payload: {
  spare_part_id: number;
  physical_count: number;
}) {
  const { data } = await apiClient.post(`/opnames/${opnameId}/items`, payload);
  return data.data;
}

// PUT /opnames/:id/items/:item_id — Update hitungan
async function updateOpnameItem(opnameId: number, itemId: number, physical_count: number) {
  const { data } = await apiClient.put(`/opnames/${opnameId}/items/${itemId}`, {
    physical_count
  });
  return data.data;
}

// POST /opnames/:id/close — Tutup sesi & apply adjustment
async function closeOpname(id: number) {
  const { data } = await apiClient.post(`/opnames/${id}/close`);
  return data.data;
}
```

---

## 12. Modul Work Orders

> Work Order adalah antrian servis kendaraan yang masuk ke bengkel.
> Saat status berubah ke `dikerjakan` atau `selesai`, notifikasi WA otomatis dikirim ke pelanggan.

```ts
// GET /work-orders?page=1&status=menunggu&date=2026-03-06
async function getWorkOrders(params?: {
  page?: number;
  status?: 'menunggu' | 'dikerjakan' | 'menunggu_sparepart' | 'selesai';
  date?: string; // YYYY-MM-DD
}) {
  const { data } = await apiClient.get('/work-orders', { params });
  return data; // { data: WorkOrder[], meta }
}

// POST /work-orders — Buat WO baru
async function createWorkOrder(payload: {
  customer_id: number;
  vehicle_id: number;
  layanan: string;         // deskripsi layanan yang diminta
  keluhan?: string;
  estimasi_biaya?: number;
  estimasi_selesai?: string; // misal: "2026-03-07" atau "2 hari"
  menginap?: boolean;
  mekanik?: string;
}) {
  const { data } = await apiClient.post('/work-orders', payload);
  return data.data;
}

// GET /work-orders/:id — Detail WO
async function getWorkOrder(id: number) {
  const { data } = await apiClient.get(`/work-orders/${id}`);
  return data.data;
}

// PUT /work-orders/:id — Update data WO
async function updateWorkOrder(id: number, payload: Partial<{
  layanan: string;
  keluhan: string;
  estimasi_biaya: number;
  estimasi_selesai: string;
  menginap: boolean;
  mekanik: string;
}>) {
  const { data } = await apiClient.put(`/work-orders/${id}`, payload);
  return data.data;
}

// PATCH /work-orders/:id/status — Update status
// ⚡ Trigger notif WA ke pelanggan saat status = 'dikerjakan' atau 'selesai'
async function updateWorkOrderStatus(
  id: number,
  status: 'menunggu' | 'dikerjakan' | 'menunggu_sparepart' | 'selesai'
) {
  const { data } = await apiClient.patch(`/work-orders/${id}/status`, { status });
  return data.data;
}

// PATCH /work-orders/:id/mechanic — Assign mekanik
async function assignMechanic(id: number, mekanik: string) {
  const { data } = await apiClient.patch(`/work-orders/${id}/mechanic`, { mekanik });
  return data.data;
}

// DELETE /work-orders/:id — Soft delete
async function deleteWorkOrder(id: number) {
  const { data } = await apiClient.delete(`/work-orders/${id}`);
  return data;
}
```

### Status Work Order Flow
```
menunggu ──► dikerjakan ──► selesai
              │
              └──► menunggu_sparepart ──► dikerjakan
```

---

## 13. Modul Transactions

```ts
// GET /transactions?date=2026-03-06&status=belum_bayar
async function getTransactions(params?: {
  date?: string;
  status?: 'belum_bayar' | 'lunas' | 'sebagian';
}) {
  const { data } = await apiClient.get('/transactions', { params });
  return data.data;
}

// POST /transactions — Buat nota/invoice baru
// BE otomatis: kurangi stok spare_part, hitung total, generate invoice_number
async function createTransaction(payload: {
  customer_id: number;
  vehicle_id: number;
  transaction_date: string; // YYYY-MM-DD
  payment_method?: 'cash' | 'transfer' | 'debit';
  notes?: string;
  items: Array<{
    item_type: 'spare_part' | 'jasa';
    spare_part_id?: number;  // wajib jika item_type = 'spare_part'
    item_name: string;
    quantity: number;
    unit_price: number;
  }>;
}) {
  const { data } = await apiClient.post('/transactions', payload);
  return data.data; // { id, invoice_number, total_amount, ... }
}

// GET /transactions/:id — Detail transaksi + semua item
async function getTransaction(id: number) {
  const { data } = await apiClient.get(`/transactions/${id}`);
  return data.data;
}

// PATCH /transactions/:id/payment — Update status & jumlah bayar
async function updatePayment(id: number, payload: {
  paid_amount: number;
  payment_status: 'belum_bayar' | 'lunas' | 'sebagian';
}) {
  const { data } = await apiClient.patch(`/transactions/${id}/payment`, payload);
  return data.data;
}

// GET /transactions/:id/pdf — URL PDF nota
async function getTransactionPdf(id: number) {
  const { data } = await apiClient.get(`/transactions/${id}/pdf`);
  return data.data; // { pdf_url }
}
```

---

## 14. Modul Reports

```ts
// GET /reports/revenue?period=monthly&date=2026-03
async function getRevenue(period: 'daily' | 'monthly', date: string) {
  const { data } = await apiClient.get('/reports/revenue', {
    params: { period, date }
  });
  // Response: { period, total_revenue, total_transactions, gross_profit, daily_breakdown }
  return data.data;
}

// GET /reports/top-products?limit=10
async function getTopProducts(limit = 10) {
  const { data } = await apiClient.get('/reports/top-products', {
    params: { limit }
  });
  return data.data;
}

// GET /reports/low-stock — Barang yang stok di bawah minimum
async function getLowStockReport() {
  const { data } = await apiClient.get('/reports/low-stock');
  return data.data;
}

// GET /reports/opname/:id — Rekap hasil opname
async function getOpnameReport(opnameId: number) {
  const { data } = await apiClient.get(`/reports/opname/${opnameId}`);
  return data.data;
}
```

---

## 15. Modul Notifications & WA

> Endpoint ini mengelola koneksi **WhatsApp Web.js** yang digunakan untuk kirim notifikasi otomatis.

```ts
// GET /notifications/wa?status=failed — Log semua notif WA
async function getWaNotifications(params?: {
  page?: number;
  status?: 'pending' | 'sent' | 'failed';
}) {
  const { data } = await apiClient.get('/notifications/wa', { params });
  return data; // { data: WaNotification[], meta }
}

// GET /notifications/wa/status — Cek status koneksi WA
async function getWaStatus() {
  const { data } = await apiClient.get('/notifications/wa/status');
  return data.data; // { status: 'CONNECTED' | 'QR_REQUIRED' | 'LOADING' | 'DISCONNECTED', ready: boolean }
}

// GET /notifications/wa/qr — Ambil QR code (tampilkan sebagai <img>)
async function getWaQr() {
  const { data } = await apiClient.get('/notifications/wa/qr');
  return data.data.qr; // string base64 → pakai sebagai src di <img>
}
// Contoh pemakaian di React:
// <img src={qrBase64} alt="Scan dengan WhatsApp" style={{ width: 256 }} />

// POST /notifications/wa/restart — Restart koneksi WA
async function restartWa() {
  const { data } = await apiClient.post('/notifications/wa/restart');
  return data;
}

// POST /notifications/wa/test — Kirim pesan test
async function sendWaTest(payload?: { phone?: string; message?: string }) {
  const { data } = await apiClient.post('/notifications/wa/test', payload ?? {});
  return data;
}

// POST /notifications/wa/retry/:id — Kirim ulang notif yang gagal
async function retryWaNotification(id: number) {
  const { data } = await apiClient.post(`/notifications/wa/retry/${id}`);
  return data;
}
```

### Contoh: Halaman Manajemen WA Connection (React)

```tsx
import { useEffect, useState } from 'react';
import { getWaStatus, getWaQr, restartWa } from '../api/notifications';

export default function WaConnectionPage() {
  const [status, setStatus] = useState<string>('LOADING');
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    const poll = setInterval(async () => {
      const result = await getWaStatus();
      setStatus(result.status);

      if (result.status === 'QR_REQUIRED') {
        const qrCode = await getWaQr();
        setQr(qrCode);
      } else {
        setQr(null);
      }
    }, 5000); // polling setiap 5 detik

    return () => clearInterval(poll);
  }, []);

  return (
    <div>
      <h2>WhatsApp Connection</h2>
      <p>Status: <strong>{status}</strong></p>
      {status === 'QR_REQUIRED' && qr && (
        <img src={qr} alt="Scan QR dengan WhatsApp" style={{ width: 256 }} />
      )}
      {status === 'CONNECTED' && <p>✅ WhatsApp terhubung!</p>}
      <button onClick={restartWa}>🔄 Restart Koneksi</button>
    </div>
  );
}
```

---

## 16. Modul Settings

```ts
// GET /settings
async function getSettings() {
  const { data } = await apiClient.get('/settings');
  return data.data; // { name, address, phone, logo_url, wa_target_number }
}

// PUT /settings
async function updateSettings(payload: {
  name?: string;
  address?: string;
  phone?: string;
  logo_url?: string;
  wa_target_number?: string; // format internasional tanpa +, contoh: 6281234567890
}) {
  const { data } = await apiClient.put('/settings', payload);
  return data.data;
}
```

---

## 17. Error Handling Global

Gunakan try-catch yang konsisten di setiap API call:

```ts
// src/utils/handleApiError.ts
export function getApiErrorMessage(err: any): string {
  return err?.response?.data?.error?.message
    ?? err?.message
    ?? 'Terjadi kesalahan, coba lagi.';
}

export function getApiErrorCode(err: any): string {
  return err?.response?.data?.error?.code ?? 'UNKNOWN_ERROR';
}
```

### Contoh pemakaian di React dengan toast:
```tsx
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../utils/handleApiError';

async function handleSubmit() {
  try {
    await createWorkOrder(formData);
    toast.success('Work order berhasil dibuat!');
  } catch (err) {
    toast.error(getApiErrorMessage(err));
  }
}
```

---

## 18. Tips & Best Practices

### ✅ Gunakan token yang tersimpan dengan aman
```ts
// Hindari menyimpan token di sessionStorage jika butuh persist setelah refresh
// localStorage → persist, cocok untuk dashboard internal
localStorage.setItem('token', token);
```

### ✅ Struktur folder API yang disarankan
```
src/
├── api/
│   ├── apiClient.ts       ← axios instance + interceptors
│   ├── auth.ts
│   ├── customers.ts
│   ├── spareParts.ts
│   ├── workOrders.ts
│   ├── transactions.ts
│   ├── notifications.ts
│   └── ...
├── utils/
│   └── handleApiError.ts
└── ...
```

### ✅ Pagination
Semua endpoint list yang mendukung pagination mengembalikan `meta`:
```ts
const response = await getCustomers(page, search);
const items = response.data;
const { total, per_page } = response.meta;
const totalPages = Math.ceil(total / per_page);
```

### ✅ Polling untuk status WA
Karena koneksi WA bersifat async (perlu scan QR), gunakan `setInterval` untuk polling status, dan hentikan polling saat status = `CONNECTED`.

### ✅ Re-fetch setelah mutasi
Setelah POST/PUT/DELETE, lakukan re-fetch data agar tampilan selalu sinkron:
```ts
await createWorkOrder(payload);
await refetchWorkOrders(); // panggil ulang getWorkOrders()
```

### ✅ Handle 401 otomatis
Interceptor di `apiClient.ts` sudah menangani redirect ke `/login` saat token expired (HTTP 401). Tidak perlu handle manual di setiap komponen.

---

> 📅 Dokumen ini dibuat: 2026-03-06
> 🔗 Swagger UI: [http://localhost:3000](http://localhost:3000)
> 📦 Repo Backend: [github.com/januarsyah901/BE-OPNAME](https://github.com/januarsyah901/BE-OPNAME)
