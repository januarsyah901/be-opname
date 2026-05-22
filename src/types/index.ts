export interface User {
    id: number;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'kasir' | 'mekanik';
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface Customer {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface Vehicle {
    id: number;
    customer_id: number;
    plate_number: string;
    type: 'mobil' | 'motor';
    brand?: string;
    model?: string;
    year?: number;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface SparePart {
    id: number;
    category_id?: number;
    name: string;
    sku: string;
    barcode_value: string;
    barcode_image_url?: string;
    cost_price: number;
    sell_price: number;
    current_stock: number;
    minimum_stock: number;
    unit: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface StockMovement {
    id: number;
    spare_part_id: number;
    type: 'in' | 'out' | 'opname_adjustment' | 'transaction_out';
    quantity: number;
    note?: string;
    created_at: string;
}

export interface Opname {
    id: number;
    session_name: string;
    status: 'open' | 'closed';
    created_at: string;
    updated_at: string;
    closed_at: string | null;
}

export interface OpnameItem {
    id: number;
    opname_id: number;
    spare_part_id: number;
    system_count: number;
    physical_count: number | null;
    difference: number | null;
    created_at: string;
    updated_at: string;
}

export interface Transaction {
    id: number;
    invoice_number: string;
    customer_id: number;
    vehicle_id: number;
    transaction_date: string;
    total_amount: number;
    paid_amount: number;
    payment_method: string;
    payment_status: 'pending' | 'lunas' | 'sebagian';
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface TransactionItem {
    id: number;
    transaction_id: number;
    item_type: 'spare_part' | 'jasa';
    spare_part_id?: number;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export interface Setting {
    id: number;
    name: string;
    address?: string;
    phone?: string;
    wa_gateway_token?: string;
    wa_target_number?: string;
    updated_at: string;
}

// JWT Payload
export interface JwtPayload {
    id: number;
    email: string;
    role: string;
}

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
