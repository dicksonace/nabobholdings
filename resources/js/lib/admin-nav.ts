import {
    BookOpen,
    LayoutDashboard,
    MessageSquare,
    Package,
    Settings,
    ShoppingCart,
    Store,
    Tag,
    Users,
    Wallet,
} from 'lucide-react';

import { PanelNavGroup } from '@/lib/panel-nav-types';
import { sellerOrdersStageHref } from '@/lib/seller-order-stages';

/**
 * Unified Owner Back Office nav (single-seller mode).
 * Combines former admin oversight + seller operations into one panel.
 */
export type AdminNavKey =
    | 'dashboard'
    | 'appearance'
    | 'products'
    | 'categories'
    | 'orders'
    | 'orders-unprocessed'
    | 'orders-awaiting-direct'
    | 'orders-confirm-delivery'
    | 'orders-cancellations'
    | 'promotions'
    | 'reviews'
    | 'buyers'
    | 'wallet'
    | 'wallet-transactions'
    | 'wallet-withdrawals'
    | 'payment-methods'
    | 'withdrawals'
    | 'wallet-funding'
    | 'manual-funding-settings'
    | 'manual-top-ups'
    | 'pending-funds'
    | 'disputes'
    | 'messages'
    | 'chats'
    | 'buyer-announcements'
    | 'brand'
    | 'guide'
    // Legacy multi-seller pages (routes still exist; not shown in nav)
    | 'sellers'
    | 'stores'
    | 'invites'
    | 'announcements'
    | 'seller-reports';

const sectionMap: Record<AdminNavKey, string> = {
    dashboard: 'dashboard',
    appearance: 'store',
    products: 'products',
    categories: 'products',
    orders: 'orders',
    'orders-unprocessed': 'orders',
    'orders-awaiting-direct': 'orders',
    'orders-confirm-delivery': 'orders',
    'orders-cancellations': 'orders',
    promotions: 'marketing',
    reviews: 'customers',
    buyers: 'customers',
    wallet: 'finance',
    'wallet-transactions': 'finance',
    'wallet-withdrawals': 'finance',
    'payment-methods': 'finance',
    withdrawals: 'finance',
    'wallet-funding': 'finance',
    'manual-funding-settings': 'finance',
    'manual-top-ups': 'finance',
    'pending-funds': 'finance',
    disputes: 'support',
    messages: 'support',
    chats: 'support',
    'buyer-announcements': 'support',
    brand: 'settings',
    guide: 'guide',
    sellers: 'guide',
    stores: 'store',
    invites: 'guide',
    announcements: 'support',
    'seller-reports': 'support',
};

/** Map seller page active keys onto the owner (admin) nav. */
export function sellerKeyToAdminNavKey(sellerKey: string): AdminNavKey {
    const map: Record<string, AdminNavKey> = {
        dashboard: 'dashboard',
        appearance: 'appearance',
        products: 'products',
        orders: 'orders',
        'payment-methods': 'payment-methods',
        promotions: 'promotions',
        reviews: 'reviews',
        messages: 'chats',
        notifications: 'messages',
        wallet: 'wallet',
        'wallet-transactions': 'wallet-transactions',
        'wallet-withdrawals': 'wallet-withdrawals',
    };

    return map[sellerKey] ?? 'dashboard';
}

export function adminNavSection(active: AdminNavKey): string {
    return sectionMap[active];
}

export function adminNavGroups(active: AdminNavKey): PanelNavGroup[] {
    const section = adminNavSection(active);

    return [
        {
            key: 'dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            defaultOpen: true,
            items: [{ key: 'overview', label: 'Overview', href: route('admin.dashboard') }],
        },
        {
            key: 'store',
            label: 'Store',
            icon: Store,
            defaultOpen: section === 'store',
            items: [{ key: 'appearance', label: 'Customize Store', href: route('manage.store-appearance.index') }],
        },
        {
            key: 'products',
            label: 'Products',
            icon: Package,
            defaultOpen: section === 'products',
            items: [
                { key: 'products-all', label: 'All Products', href: route('manage.products.index'), mobile: true, defaultOnPath: true },
                { key: 'products-add', label: 'Add Product', href: route('manage.products.create') },
                { key: 'products-live', label: 'Active Products', href: route('manage.products.index', { status: 'approved' }) },
                { key: 'products-draft', label: 'Hidden / Draft', href: route('manage.products.index', { status: 'draft' }) },
                { key: 'products-sold-out', label: 'Out of Stock', href: route('manage.products.index', { status: 'sold_out' }) },
                { key: 'categories', label: 'Categories', href: route('admin.categories.index') },
            ],
        },
        {
            key: 'orders',
            label: 'Orders',
            icon: ShoppingCart,
            defaultOpen: section === 'orders',
            items: [
                { key: 'orders-hub', label: 'Sales center', href: route('manage.orders.index'), mobile: true, defaultOnPath: true },
                { key: 'orders-new', label: 'New orders', href: sellerOrdersStageHref('new'), badgeKey: 'pending_orders' },
                { key: 'orders-processing', label: 'Processing', href: sellerOrdersStageHref('processing'), badgeKey: 'processing_orders' },
                { key: 'orders-call', label: 'Call buyer', href: sellerOrdersStageHref('call'), badgeKey: 'call_orders' },
                { key: 'orders-packing', label: 'Packing', href: sellerOrdersStageHref('packing'), badgeKey: 'packing_orders' },
                { key: 'orders-delivery', label: 'Out for delivery', href: sellerOrdersStageHref('delivery'), badgeKey: 'delivery_orders' },
                { key: 'orders-awaiting', label: 'Awaiting buyer', href: sellerOrdersStageHref('awaiting'), badgeKey: 'awaiting_orders' },
                { key: 'orders-completed', label: 'Completed', href: sellerOrdersStageHref('completed') },
                { key: 'orders-cancelled', label: 'Cancelled', href: sellerOrdersStageHref('cancelled'), badgeKey: 'cancelled_orders' },
                {
                    key: 'orders-unprocessed',
                    label: 'Unprocessed 24h+',
                    href: route('admin.orders.unprocessed'),
                    badgeKey: 'stale_unprocessed_orders',
                },
                {
                    key: 'orders-awaiting-direct',
                    label: 'Awaiting direct payment',
                    href: route('admin.orders.awaiting-direct'),
                    badgeKey: 'awaiting_direct_payments',
                },
                {
                    key: 'orders-confirm-delivery',
                    label: 'Confirm delivery',
                    href: route('admin.orders.confirm-delivery'),
                    badgeKey: 'awaiting_buyer_confirmation',
                },
            ],
        },
        {
            key: 'marketing',
            label: 'Marketing',
            icon: Tag,
            defaultOpen: section === 'marketing',
            items: [{ key: 'promotions', label: 'Coupons & Promotions', href: route('manage.promotions.index') }],
        },
        {
            key: 'customers',
            label: 'Customers',
            icon: Users,
            defaultOpen: section === 'customers',
            items: [
                { key: 'buyers', label: 'All Buyers', href: route('admin.buyers.index') },
                { key: 'reviews', label: 'Product Reviews', href: route('manage.reviews.index') },
            ],
        },
        {
            key: 'finance',
            label: 'Finance',
            icon: Wallet,
            defaultOpen: section === 'finance',
            items: [
                { key: 'wallet', label: 'Store Wallet', href: route('manage.wallet'), mobile: true },
                { key: 'wallet-transactions', label: 'Transactions', href: route('manage.wallet.transactions') },
                { key: 'wallet-withdrawals', label: 'My Withdrawals', href: route('manage.wallet.withdrawals') },
                { key: 'payment-methods', label: 'Payment Methods', href: route('manage.payment-methods.index') },
                { key: 'withdrawals-buyers', label: 'Buyer Withdrawals', href: route('admin.withdrawals.index', { status: 'pending', role: 'buyer' }), badgeKey: 'pending_withdrawals' },
                { key: 'manual-top-ups', label: 'Manual Top-ups', href: route('admin.manual-top-ups.index'), badgeKey: 'pending_manual_top_ups' },
                { key: 'manual-funding-settings', label: 'Receive Accounts', href: route('admin.manual-funding.settings') },
                { key: 'wallet-funding', label: 'Adjust Buyer Wallets', href: route('admin.wallet-funding.index') },
            ],
        },
        {
            key: 'support',
            label: 'Support',
            icon: MessageSquare,
            defaultOpen: section === 'support',
            items: [
                { key: 'disputes-open', label: 'Refund requests', href: route('admin.disputes.index', { status: 'open' }), badgeKey: 'open_disputes', defaultOnPath: true },
                { key: 'chats', label: 'Customer Chats', href: route('chat.index'), badgeKey: 'unread_chat_messages' },
                { key: 'buyer-announcements', label: 'Message Buyers', href: route('admin.buyer-announcements.index') },
                { key: 'messages', label: 'Contact Messages', href: route('admin.contact-messages.index'), badgeKey: 'unread_messages' },
            ],
        },
        {
            key: 'settings',
            label: 'Settings',
            icon: Settings,
            defaultOpen: section === 'settings',
            items: [{ key: 'brand', label: 'Brand, Currency & Contact', href: route('admin.brand.settings') }],
        },
        {
            key: 'guide',
            label: 'Help',
            icon: BookOpen,
            defaultOpen: section === 'guide',
            items: [{ key: 'guide', label: 'How it works', href: route('admin.guide') }],
        },
    ];
}
