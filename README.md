# BE-OPNAME (Backend System)

Backend service untuk aplikasi Bengkel Opname (BE-OPNAME) yang dibangun menggunakan Node.js, TypeScript, Express, Prisma, dan Supabase.

## Fitur Utama

- **REST API**: Menyediakan endpoint untuk manajemen sparepart, montir, transaksi servis, dan pengguna.
- **WhatsApp Gateway**: Integrasi pengiriman notifikasi otomatis via WhatsApp menggunakan `whatsapp-web.js` dan headless Chromium (Puppeteer) ketika:
  - Stok sparepart menipis di bawah limit minimal.
  - Status pengerjaan servis berubah (dikerjakan / selesai).

## Deployment

Aplikasi ini dideploy menggunakan **CapRover** (PaaS) di dalam kontainer **Docker** dan diekspos melalui **Cloudflare Tunnel (Zero Trust)**.

### Perintah Lokal

```bash
# Jalankan development server
npm run dev

# Jalankan worker whatsapp
npm run wa:worker

# Build berkas TypeScript
npm run build

# Start production server
npm run start
```
##