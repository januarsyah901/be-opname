/**
 * Generate SKU dari nama kategori dan ID item.
 * Contoh: "Oli Mesin 1L" + id=42 → "AS-OLI-0042"
 */
export const generateSKU = (categoryName: string, id: number): string => {
    const prefix = categoryName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 3);
    const paddedId = String(id).padStart(4, '0');
    return `AS-${prefix}-${paddedId}`;
};

/**
 * Generate invoice number berdasarkan tanggal dan urutan.
 * Contoh: INV-20260302-001
 */
export const generateInvoiceNumber = (date: Date, seq: number): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const paddedSeq = String(seq).padStart(3, '0');
    return `INV-${y}${m}${d}-${paddedSeq}`;
};

/**
 * Pagination helper - Default to 100000 to return all rows if not specified.
 * This ensures client-side pagination on the frontend works correctly with full datasets.
 */
export const getPagination = (page = 1, perPage = 100000) => {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    return { from, to, perPage };
};
