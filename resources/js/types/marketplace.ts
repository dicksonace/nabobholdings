export interface SellerProfile {
    id: number;
    user_id?: number;
    business_name: string | null;
    store_name: string | null;
    slug: string;
    status: string;
    rating: number;
    total_sales: number;
    store_description?: string | null;
    shop_photo?: string | null;
    business_address?: string | null;
    is_business_registered?: boolean;
    approved_at?: string | null;
    rejection_reason?: string | null;
}

export interface ProductImage {
    id: number;
    path: string;
    is_primary: boolean;
}

export interface Product {
    id: number;
    category_id?: number | null;
    name: string;
    slug: string;
    description?: string;
    meta_title?: string | null;
    meta_description?: string | null;
    meta_keywords?: string | null;
    specifications?: Record<string, string> | null;
    price: number;
    discount_price?: number | null;
    quantity: number;
    brand?: string;
    status: string;
    is_preorder: boolean;
    free_shipping: boolean;
    delivery_fee?: number | null;
    delivery_days?: number | null;
    in_ghana: boolean;
    is_negotiable?: boolean;
    cash_on_delivery?: boolean;
    pickup_available?: boolean;
    ships_nationwide?: boolean;
    video_path?: string | null;
    video_duration?: number | null;
    rating: number;
    review_count: number;
    views?: number;
    wishlist_adds?: number;
    images: ProductImage[];
    seller?: {
        id: number;
        name: string;
        email?: string;
        mobile?: string;
        whatsapp?: string;
        region?: string;
        city?: string;
        digital_address?: string;
        residential_address?: string;
        seller_profile?: SellerProfile;
    };
    category?: { id: number; name: string; slug?: string; icon?: string | null; spec_schema?: { fields: SpecField[] } | null };
}

export interface CartItem {
    id: number;
    quantity: number;
    product: Product;
}

export interface WishlistItem {
    id: number;
    product_id: number;
    product: Product;
    created_at?: string;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface Wallet {
    available_balance: number;
    pending_balance: number;
    total_earnings: number;
    withdrawn_amount: number;
}

export interface Withdrawal {
    id: number;
    amount: number;
    momo_number: string;
    account_name: string;
    network: string;
    status: string;
    paystack_reference?: string | null;
    paystack_status?: string | null;
    payout_channel?: string | null;
    failure_reason?: string | null;
    rejection_reason?: string | null;
    proof_path?: string | null;
    admin_notes?: string | null;
    created_at?: string;
    processed_at?: string;
}

export interface WalletTransaction {
    id: number;
    type: string;
    amount: number;
    description: string;
    reference?: string | null;
    order_item_id?: number | null;
    withdrawal_id?: number | null;
    created_at?: string;
    available_after?: number | null;
    pending_after?: number | null;
    balance_after?: number | null;
}

export const walletTransactionLabels: Record<string, string> = {
    sale_pending: 'Sale (Pending)',
    sale_released: 'Funds Released',
    withdrawal: 'Withdrawal Request',
    withdrawal_completed: 'Payout Sent',
    withdrawal_refunded: 'Withdrawal Refunded',
    fund_added: 'Funds Added',
    fund_removed: 'Funds Removed',
    order_payment: 'Order Payment',
    order_refund: 'Order Refund',
    sale_reversed: 'Sale Reversed',
    direct_cancel_debit: 'Pay-to-seller Cancel',
};

export function formatWalletTransactionType(type: string): string {
    return walletTransactionLabels[type] ?? type.replace(/_/g, ' ');
}

export interface Order {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    payment_method?: string;
    receiver_name: string;
    receiver_phone: string;
    region: string;
    city: string;
    subtotal: number;
    shipping_cost: number;
    total: number;
    created_at: string;
    can_request_refund?: boolean;
    items?: OrderItem[];
}

export interface OrderItem {
    id: number;
    product_id?: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    seller_amount: number;
    status: string;
    funds_release_status?: string | null;
    funds_release_notes?: string | null;
    rejection_reason?: string | null;
    cancellation_code?: string | null;
    cancelled_by?: string | null;
    cancelled_at?: string | null;
    refund_status?: string | null;
    courier_name?: string;
    tracking_number?: string;
    vehicle_number?: string | null;
    driver_phone?: string | null;
    package_image?: string | null;
    awaiting_confirmation_at?: string | null;
    auto_confirm_in?: string | null;
    auto_confirm_at?: string | null;
    product?: Product;
    order?: Order;
    dispute?: {
        id: number;
        status: string;
        reason: string;
        description?: string;
        resolution_notes?: string | null;
    } | null;
}

export interface SpecField {
    key: string;
    label: string;
    type: 'text' | 'select';
    options?: string[];
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    icon?: string | null;
    spec_schema?: { fields: SpecField[] } | null;
}

export interface ProductReview {
    id: number;
    rating: number;
    comment?: string | null;
    created_at?: string;
    user?: { name: string };
}

// Currency symbol is admin-configurable and injected from shared Inertia props
// (see resources/js/app.tsx). Defaults to USD until the real value is set.
let currencySymbol = '$';

export function setCurrencySymbol(symbol: string): void {
    if (symbol && symbol.trim() !== '') {
        currencySymbol = symbol.trim();
    }
}

export function getCurrencySymbol(): string {
    return currencySymbol;
}

export function formatPrice(amount: number): string {
    return `${currencySymbol}${Number(amount).toFixed(2)}`;
}

export const orderStatusLabels: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    call_confirmed: 'Call buyer',
    packed: 'Packing',
    shipped: 'Out for delivery',
    awaiting_confirmation: 'Confirm delivery',
    delivered: 'Completed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
};

export const orderFulfillmentSteps = [
    { key: 'processing', label: 'Processing' },
    { key: 'packed', label: 'Packing' },
    { key: 'shipped', label: 'Out for delivery' },
    { key: 'awaiting_confirmation', label: 'Delivered' },
    { key: 'delivered', label: 'Completed' },
] as const;

export const codOrderFulfillmentSteps = [
    { key: 'pending', label: 'Cash on delivery' },
    { key: 'processing', label: 'Processing' },
    { key: 'call_confirmed', label: 'Seller called' },
    { key: 'packed', label: 'Packing' },
    { key: 'shipped', label: 'Package on the way' },
    { key: 'delivered', label: 'Complete' },
] as const;

export const bankTransferFulfillmentSteps = [
    { key: 'pending', label: 'Bank transfer' },
    { key: 'processing', label: 'Processing' },
    { key: 'call_confirmed', label: 'Seller called' },
    { key: 'packed', label: 'Packing' },
    { key: 'shipped', label: 'Package on the way' },
    { key: 'delivered', label: 'Complete' },
] as const;

export function offlineFulfillmentSteps(paymentMethod?: string | null) {
    return paymentMethod === 'bank_transfer' ? bankTransferFulfillmentSteps : codOrderFulfillmentSteps;
}

export interface OfflineSellerFlowStep {
    status: string;
    label: string;
    hint: string;
}

export function offlineSellerFlow(paymentMethod?: string | null): OfflineSellerFlowStep[] {
    if (paymentMethod === 'bank_transfer') {
        return [
            { status: 'pending', label: 'Bank transfer', hint: 'New bank transfer order — start processing when ready.' },
            { status: 'processing', label: 'Start processing', hint: 'Bank transfer order — begin preparing after payment is verified.' },
            { status: 'call_confirmed', label: 'Call buyer', hint: 'Call the buyer to confirm the order, then continue.' },
            { status: 'packed', label: 'Mark as packing', hint: 'Pack the item after you spoke with the buyer.' },
            { status: 'shipped', label: 'Package on the way', hint: 'Optional: add driver & vehicle if someone else is delivering.' },
            { status: 'delivered', label: 'Complete delivery', hint: 'Buyer received the order — mark complete.' },
        ];
    }

    return [
        { status: 'pending', label: 'Cash on delivery', hint: 'New COD order — start processing when ready.' },
        { status: 'processing', label: 'Start processing', hint: 'Cash on delivery order — begin preparing.' },
        { status: 'call_confirmed', label: 'Call buyer', hint: 'Call the buyer to confirm the order, then continue.' },
        { status: 'packed', label: 'Mark as packing', hint: 'Pack the item after you spoke with the buyer.' },
        { status: 'shipped', label: 'Package on the way', hint: 'Optional: add driver & vehicle if someone else is delivering.' },
        { status: 'delivered', label: 'Complete (cash collected)', hint: 'Buyer paid cash on delivery — mark the order complete.' },
    ];
}

export function formatOrderStatus(status: string | { value?: string } | null | undefined): string {
    const key = typeof status === 'string' ? status : status?.value ?? '';
    if (!key) {
        return 'Unknown';
    }

    return orderStatusLabels[key] ?? key.replace(/_/g, ' ');
}

/** Colored pill classes for buyer/seller order status badges. */
export function orderStatusBadgeClass(status: string | { value?: string } | null | undefined): string {
    const key = typeof status === 'string' ? status : status?.value ?? '';

    switch (key) {
        case 'packed':
            return 'bg-amber-500 text-white';
        case 'shipped':
            return 'bg-orange-500 text-white';
        case 'processing':
            return 'bg-blue-500 text-white';
        case 'call_confirmed':
            return 'bg-fuchsia-500 text-white';
        case 'awaiting_confirmation':
            return 'bg-cyan-500 text-white';
        case 'delivered':
            return 'bg-emerald-500 text-white';
        case 'pending':
            return 'bg-violet-500 text-white';
        case 'cancelled':
            return 'bg-red-500 text-white';
        case 'refunded':
            return 'bg-slate-500 text-white';
        default:
            return 'bg-gray-500 text-white';
    }
}

const FULFILLMENT_RANK: Record<string, number> = {
    pending: 0,
    processing: 1,
    call_confirmed: 2,
    packed: 3,
    shipped: 4,
    awaiting_confirmation: 5,
    delivered: 6,
    cancelled: -1,
    refunded: -1,
};

/** Furthest fulfillment status among order items (ignores cancelled/refunded when others remain). */
export function mostAdvancedItemStatus(
    items: Array<{ status?: string | null }> | null | undefined,
): string | null {
    if (!items?.length) {
        return null;
    }

    let best: string | null = null;
    let bestRank = -2;

    for (const item of items) {
        const status = String(item.status ?? '');
        const rank = FULFILLMENT_RANK[status] ?? -2;
        if (rank > bestRank) {
            bestRank = rank;
            best = status;
        }
    }

    return best;
}

export function buyerFulfillmentLabel(
    status: string | null | undefined,
    paymentMethod?: string | null,
): string {
    if (paymentMethod === 'cash' && status === 'pending') {
        return 'Cash on delivery';
    }

    if (paymentMethod === 'bank_transfer' && status === 'pending') {
        return 'Bank transfer';
    }

    return formatOrderStatus(status);
}

export function isOfflineCheckoutPayment(paymentMethod?: string | null): boolean {
    return paymentMethod === 'cash' || paymentMethod === 'bank_transfer';
}

export function formatPaymentMethodLabel(paymentMethod?: string | null): string | null {
    if (!paymentMethod) return null;
    if (paymentMethod === 'cash') return 'Cash on delivery';
    if (paymentMethod === 'bank_transfer') return 'Bank transfer';
    if (paymentMethod === 'direct') return 'Direct payment';
    if (paymentMethod === 'wallet') return 'Wallet';
    return paymentMethod.replace(/_/g, ' ');
}

export function productEffectivePrice(product: { price: number; discount_price?: number | null }): number {
    const price = Number(product.price) || 0;
    const discount = product.discount_price != null ? Number(product.discount_price) : null;

    if (discount !== null && discount > 0 && discount < price) {
        return discount;
    }

    return price;
}

export function productHasDiscount(product: { price: number; discount_price?: number | null }): boolean {
    const price = Number(product.price) || 0;
    const discount = product.discount_price != null ? Number(product.discount_price) : null;

    return discount !== null && discount > 0 && discount < price;
}

/** Integer percent for badges; floors so 99.9% never rounds up to 100%. */
export function productDiscountPercent(product: { price: number; discount_price?: number | null }): number {
    if (!productHasDiscount(product)) {
        return 0;
    }

    const price = Number(product.price) || 0;
    const discount = Number(product.discount_price);
    const raw = (1 - discount / price) * 100;

    return Math.min(99, Math.floor(raw));
}

const PRODUCT_IMAGE_PLACEHOLDER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="none"><rect width="400" height="300" fill="#F3F4F6"/><rect x="150" y="100" width="100" height="80" rx="8" fill="#E5E7EB"/><circle cx="175" cy="125" r="12" fill="#D1D5DB"/><path d="M150 170 L200 140 L250 170 L250 180 L150 180 Z" fill="#D1D5DB"/><text x="200" y="220" text-anchor="middle" fill="#9CA3AF" font-family="sans-serif" font-size="14">No image</text></svg>';

export const PRODUCT_IMAGE_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(PRODUCT_IMAGE_PLACEHOLDER_SVG)}`;

export function productImageUrl(path: string | undefined): string {
    if (!path) return PRODUCT_IMAGE_PLACEHOLDER;
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
    return `/storage/${path}`;
}

export function productVideoUrl(path: string | undefined): string {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    return `/storage/${path}`;
}

/** Compact social-proof numbers: 980, 1.2k, 3.4M */
export function formatCompactCount(value: number | null | undefined): string {
    const n = Math.max(0, Math.floor(Number(value) || 0));
    if (n < 1000) return String(n);
    if (n < 1_000_000) {
        const k = n / 1000;
        return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}k`;
    }
    const m = n / 1_000_000;
    return `${m >= 10 ? Math.round(m) : Math.round(m * 10) / 10}M`;
}
