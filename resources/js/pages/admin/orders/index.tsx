import { Head, Link } from '@inertiajs/react';

import AdminOrderTabs from '@/components/admin/admin-order-tabs';
import AdminLayout from '@/layouts/admin-layout';
import { formatPrice, Order, Paginated } from '@/types/marketplace';

interface OrderFilters {
    payment_status?: string | null;
    status?: string | null;
    period?: string | null;
}

interface OrdersIndexProps {
    orders: Paginated<Order & {
        buyer: { name: string };
        checkout?: { checkout_number: string } | null;
        payment_channel?: string;
    }>;
    filters?: OrderFilters;
}

function filterLabel(filters: OrderFilters): string | null {
    const parts: string[] = [];
    if (filters.payment_status) {
        parts.push(`${filters.payment_status} payment`);
    }
    if (filters.status) {
        parts.push(filters.status.replace(/_/g, ' '));
    }
    if (filters.period === '7d') {
        parts.push('last 7 days');
    } else if (filters.period === 'today') {
        parts.push('today');
    } else if (filters.period === 'month') {
        parts.push('this month');
    }
    return parts.length > 0 ? parts.join(' · ') : null;
}

export default function AdminOrdersIndex({ orders, filters = {} }: OrdersIndexProps) {
    const activeFilter = filterLabel(filters);

    return (
        <AdminLayout title="Orders" active="orders">
            <Head title="Orders" />
            <AdminOrderTabs active="all" />

            {activeFilter && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                    <span>
                        Showing <strong className="capitalize">{activeFilter}</strong> orders
                    </span>
                    <Link href={route('admin.orders.index')} className="font-medium text-orange-600 hover:underline">
                        Clear filter
                    </Link>
                </div>
            )}

            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="min-w-[720px] w-full text-sm">
                    <thead className="border-b bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Order</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Buyer</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Total</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Checkout</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Channel</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Payment</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {orders.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                    No orders match this filter.
                                </td>
                            </tr>
                        ) : (
                            orders.data.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <Link href={route('admin.orders.show', order.id)} className="font-medium text-orange-600 hover:underline">
                                            {order.order_number}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">{order.buyer?.name}</td>
                                    <td className="px-4 py-3 text-orange-500">{formatPrice(order.total)}</td>
                                    <td className="px-4 py-3 capitalize">{order.status}</td>
                                    <td className="px-4 py-3 text-gray-500">{order.checkout?.checkout_number ?? '—'}</td>
                                    <td className="px-4 py-3 capitalize">{order.payment_channel === 'direct' ? 'Direct' : 'Marketplace'}</td>
                                    <td className="px-4 py-3 capitalize">{order.payment_status}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
