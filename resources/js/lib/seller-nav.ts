import {
    LayoutDashboard,
    MessageSquare,
    Package,
    ShoppingCart,
    Star,
    Store,
    Tag,
    Wallet,
} from 'lucide-react';

import { PanelNavGroup } from '@/lib/panel-nav-types';
import { sellerOrdersStageHref } from '@/lib/seller-order-stages';

export type SellerNavKey =
    | 'dashboard'
    | 'appearance'
    | 'products'
    | 'orders'
    | 'payment-methods'
    | 'promotions'
    | 'reviews'
    | 'messages'
    | 'notifications'
    | 'wallet'
    | 'wallet-transactions'
    | 'wallet-withdrawals';

const sectionMap: Record<SellerNavKey, string> = {
    dashboard: 'dashboard',
    appearance: 'store',
    products: 'products',
    orders: 'orders',
    'payment-methods': 'finance',
    promotions: 'marketing',
    reviews: 'customers',
    messages: 'communication',
    notifications: 'communication',
    wallet: 'finance',
    'wallet-transactions': 'finance',
    'wallet-withdrawals': 'finance',
};

export function sellerNavSection(active: SellerNavKey): string {
    return sectionMap[active];
}

export function sellerNavGroups(active: SellerNavKey): PanelNavGroup[] {
    const section = sellerNavSection(active);

    return [
        {
            key: 'dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            defaultOpen: true,
            items: [{ key: 'overview', label: 'Overview', href: route('manage.dashboard'), mobile: true }],
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
                { key: 'products-deleted', label: 'Deleted', href: route('manage.products.index', { status: 'deleted' }) },
            ],
        },
        {
            key: 'orders',
            label: 'Sales',
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
                { key: 'orders-cancelled', label: 'Cancelled orders', href: sellerOrdersStageHref('cancelled'), badgeKey: 'cancelled_orders' },
                { key: 'orders-refunds', label: 'Refund requests', href: route('manage.refunds.index'), badgeKey: 'open_refunds' },
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
            icon: Star,
            defaultOpen: section === 'customers',
            items: [{ key: 'reviews', label: 'Product Reviews', href: route('manage.reviews.index') }],
        },
        {
            key: 'communication',
            label: 'Communication',
            icon: MessageSquare,
            defaultOpen: section === 'communication',
            items: [
                { key: 'messages', label: 'Inbox', href: route('chat.index'), badgeKey: 'unread_messages', mobile: true },
                { key: 'notifications', label: 'Notifications', href: route('notifications.index'), badgeKey: 'unread_notifications' },
            ],
        },
        {
            key: 'finance',
            label: 'Finance',
            icon: Wallet,
            defaultOpen: section === 'finance',
            items: [
                { key: 'wallet', label: 'Withdraw to MoMo', href: route('manage.wallet'), mobile: true },
                { key: 'wallet-transactions', label: 'Transactions', href: route('manage.wallet.transactions') },
                { key: 'wallet-withdrawals', label: 'Withdrawals', href: route('manage.wallet.withdrawals') },
                { key: 'payment-methods', label: 'Payment Methods', href: route('manage.payment-methods.index') },
            ],
        },
    ];
}

export function sellerMobileNavItems(active: SellerNavKey) {
    return sellerNavGroups(active)
        .flatMap((group) => group.items)
        .filter((item) => item.mobile);
}
