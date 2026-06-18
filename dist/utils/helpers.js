"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPagination = exports.generateInvoiceNumber = exports.generateSKU = void 0;
/**
 * Generate SKU dari nama kategori dan ID item.
 * Contoh: "Oli Mesin 1L" + id=42 → "AS-OLI-0042"
 */
const generateSKU = (categoryName, id) => {
    const prefix = categoryName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 3);
    const paddedId = String(id).padStart(4, '0');
    return `AS-${prefix}-${paddedId}`;
};
exports.generateSKU = generateSKU;
/**
 * Generate invoice number berdasarkan tanggal dan urutan.
 * Contoh: INV-20260302-001
 */
const generateInvoiceNumber = (date, seq) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const paddedSeq = String(seq).padStart(3, '0');
    return `INV-${y}${m}${d}-${paddedSeq}`;
};
exports.generateInvoiceNumber = generateInvoiceNumber;
/**
 * Pagination helper - Default to 100000 to return all rows if not specified.
 * This ensures client-side pagination on the frontend works correctly with full datasets.
 */
const getPagination = (page = 1, perPage = 100000) => {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    return { from, to, perPage };
};
exports.getPagination = getPagination;
