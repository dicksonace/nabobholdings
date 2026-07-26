import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Boxes,
    CheckCircle2,
    Clock,
    DollarSign,
    Package,
    PackageX,
    Percent,
    ShoppingCart,
    Store,
    TrendingUp,
    UserPlus,
    Users,
    Wallet,
    XCircle,
} from 'lucide-react';
import { ComponentType } from 'react';

import { DonutChart, RankBars, TrendChart } from '@/components/admin/dashboard-charts';
import AdminLayout from '@/layouts/admin-layout';
import { formatPrice, Order, SellerProfile } from '@/types/marketplace';

interface Breakdown {
    key: string;
    label: string;
    count: number;
}

interface PendingWithdrawalRow {
    id: number;
    amount: number;
    network: string | null;
    momo_number: string | null;
    account_name: string | null;
    created_at: string | null;
    user: { name: string; email: string; role?: string } | null;
}

interface AdminDashboardProps {
    stats: {
        total_revenue: number;
        revenue_today: number;
        revenue_month: number;
        avg_order_value: number;
        total_orders: number;
        orders_today: number;
        orders_week: number;
        orders_month: number;
        paid_orders: number;
        cancelled_orders: number;
        delivered_orders: number;
        total_commission: number;
        total_users: number;
        total_buyers: number;
        total_sellers: number;
        new_users_month: number;
        approved_sellers: number;
        pending_sellers: number;
        suspended_sellers: number;
        total_products: number;
        live_products: number;
        pending_products: number;
        out_of_stock: number;
        pending_withdrawals: number;
        pending_withdrawals_amount: number;
        paid_withdrawals_amount: number;
    };
    series: { date: string; revenue: number; orders: number; signups: number }[];
    orderStatusBreakdown: Breakdown[];
    sellerStatusBreakdown: Breakdown[];
    usersByRole: Breakdown[];
    topProducts: { id: number; name: string; views: number; purchases: number; price: number }[];
    topCategories: { id: number; name: string; products: number }[];
    topSellers: { id: number; name: string; revenue: number; orders: number; products: number }[];
    recentOrders: (Order & { buyer: { name: string } })[];
    pendingSellers: (SellerProfile & { user: { name: string; email: string } })[];
    pendingWithdrawals: PendingWithdrawalRow[];
}

interface HeroCard {
    label: string;
    value: string;
    sub: string;
    icon: ComponentType<{ className?: string }>;
    ring: string;
    iconColor: string;
    href?: string;
}

interface Chip {
    label: string;
    value: string | number;
    icon: ComponentType<{ className?: string }>;
    color: string;
    href?: string;
}

export default function AdminDashboard({
    stats,
    series,
    orderStatusBreakdown,
    sellerStatusBreakdown,
    usersByRole,
    topProducts,
    topCategories,
    topSellers,
    recentOrders,
    pendingSellers,
    pendingWithdrawals = [],
}: AdminDashboardProps) {
    const hero: HeroCard[] = [
        {
            label: 'Total Revenue',
            value: formatPrice(stats.total_revenue),
            sub: `${formatPrice(stats.revenue_today)} today · ${formatPrice(stats.revenue_month)} this month`,
            icon: DollarSign,
            ring: 'from-green-500/10 to-green-500/0',
            iconColor: 'text-green-600',
        },
        {
            label: 'Orders',
            value: String(stats.total_orders),
            sub: `${stats.orders_today} today · ${stats.orders_month} this month`,
            icon: ShoppingCart,
            ring: 'from-orange-500/10 to-orange-500/0',
            iconColor: 'text-orange-600',
            href: route('admin.orders.index'),
        },
        {
            label: 'Avg Order Value',
            value: formatPrice(stats.avg_order_value),
            sub: `${stats.paid_orders} paid orders`,
            icon: TrendingUp,
            ring: 'from-indigo-500/10 to-indigo-500/0',
            iconColor: 'text-indigo-600',
        },
        {
            label: 'Platform Commission',
            value: formatPrice(stats.total_commission),
            sub: 'Earned on paid orders',
            icon: Percent,
            ring: 'from-violet-500/10 to-violet-500/0',
            iconColor: 'text-violet-600',
        },
    ];

    const chips: Chip[] = [
        { label: 'Paid orders', value: stats.paid_orders, icon: CheckCircle2, color: 'text-green-500' },
        { label: 'Delivered', value: stats.delivered_orders, icon: CheckCircle2, color: 'text-emerald-500' },
        { label: 'Cancelled', value: stats.cancelled_orders, icon: XCircle, color: 'text-rose-500' },
        { label: 'Orders (7d)', value: stats.orders_week, icon: ShoppingCart, color: 'text-orange-500' },
        { label: 'Total users', value: stats.total_users, icon: Users, color: 'text-gray-500', href: route('admin.buyers.index') },
        { label: 'New users (mo)', value: stats.new_users_month, icon: UserPlus, color: 'text-sky-500' },
        { label: 'Buyers', value: stats.total_buyers, icon: Users, color: 'text-blue-500', href: route('admin.buyers.index') },
        {
            label: 'Sellers',
            value: stats.total_sellers,
            icon: Store,
            color: 'text-purple-500',
            href: route('admin.sellers.index', { status: 'all' }),
        },
        {
            label: 'Approved sellers',
            value: stats.approved_sellers,
            icon: Store,
            color: 'text-emerald-500',
            href: route('admin.sellers.index', { status: 'approved' }),
        },
        {
            label: 'Pending sellers',
            value: stats.pending_sellers,
            icon: Clock,
            color: 'text-amber-500',
            href: route('admin.sellers.index', { status: 'pending' }),
        },
        { label: 'Suspended', value: stats.suspended_sellers, icon: AlertTriangle, color: 'text-rose-500' },
        {
            label: 'Products',
            value: stats.total_products,
            icon: Package,
            color: 'text-indigo-500',
            href: route('admin.products.index', { status: 'all' }),
        },
        {
            label: 'Live products',
            value: stats.live_products,
            icon: Boxes,
            color: 'text-green-500',
            href: route('admin.products.index', { status: 'approved' }),
        },
        {
            label: 'Pending products',
            value: stats.pending_products,
            icon: Clock,
            color: 'text-amber-500',
            href: route('admin.products.index', { status: 'all' }),
        },
        { label: 'Out of stock', value: stats.out_of_stock, icon: PackageX, color: 'text-rose-500' },
        {
            label: 'Pending payouts',
            value: formatPrice(stats.pending_withdrawals_amount),
            icon: Wallet,
            color: 'text-red-500',
            href: route('admin.withdrawals.index', { status: 'pending' }),
        },
    ];

    return (
        <AdminLayout title="Owner Panel" active="dashboard">
            <Head title="Admin Dashboard" />

            {/* Hero KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {hero.map((card) => {
                    const inner = (
                        <div className={`rounded-2xl border border-gray-100 bg-gradient-to-br ${card.ring} bg-white p-5 shadow-sm transition hover:shadow-md`}>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500">{card.label}</p>
                                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                            </div>
                            <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
                            <p className="mt-1 text-xs text-gray-400">{card.sub}</p>
                        </div>
                    );
                    return card.href ? (
                        <Link key={card.label} href={card.href}>
                            {inner}
                        </Link>
                    ) : (
                        <div key={card.label}>{inner}</div>
                    );
                })}
            </div>

            {/* Compact stat chips */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
                {chips.map((chip) => {
                    const inner = (
                        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:ring-2 hover:ring-orange-100">
                            <div className="flex items-center gap-2">
                                <chip.icon className={`h-4 w-4 ${chip.color}`} />
                                <p className="truncate text-xs text-gray-500">{chip.label}</p>
                            </div>
                            <p className="mt-1 text-lg font-bold text-gray-900">{chip.value}</p>
                        </div>
                    );
                    return chip.href ? (
                        <Link key={chip.label} href={chip.href}>
                            {inner}
                        </Link>
                    ) : (
                        <div key={chip.label}>{inner}</div>
                    );
                })}
            </div>

            {/* Trend chart */}
            <div className="mt-6">
                <TrendChart data={series} />
            </div>

            {/* Breakdown donuts */}
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <DonutChart title="Orders by status" data={orderStatusBreakdown} />
                <DonutChart title="Users by role" data={usersByRole} />
                <DonutChart title="Sellers by status" data={sellerStatusBreakdown} />
            </div>

            {/* Ranked lists */}
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <RankBars
                    title="Top products"
                    subtitle="By total views"
                    items={topProducts.map((p) => ({
                        id: p.id,
                        name: p.name,
                        value: p.views,
                        sub: `${p.purchases} sold · ${formatPrice(p.price)}`,
                    }))}
                    accent="#f97316"
                    formatValue={(v) => `${v.toLocaleString()} views`}
                />
                <RankBars
                    title="Top categories"
                    subtitle="By number of products"
                    items={topCategories.map((c) => ({ id: c.id, name: c.name, value: c.products }))}
                    accent="#6366f1"
                    formatValue={(v) => `${v} items`}
                />
                <RankBars
                    title="Top sellers"
                    subtitle="By paid revenue"
                    items={topSellers.map((s) => ({
                        id: s.id,
                        name: s.name,
                        value: s.revenue > 0 ? s.revenue : s.products,
                        sub: s.revenue > 0 ? `${s.orders} orders` : `${s.products} products`,
                    }))}
                    accent="#10b981"
                    formatValue={(v) => (v >= 1000 ? formatPrice(v) : String(v))}
                    emptyText="No seller sales yet."
                />
            </div>

            {/* Operational lists */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Pending Seller Approvals</h3>
                        <Link
                            href={route('admin.sellers.index', { status: 'pending' })}
                            className="text-sm text-orange-500 hover:underline"
                        >
                            View all / Approve
                        </Link>
                    </div>
                    {pendingSellers.length === 0 ? (
                        <p className="mt-4 text-sm text-gray-500">No pending applications.</p>
                    ) : (
                        <div className="mt-4 divide-y">
                            {pendingSellers.map((seller) => (
                                <Link
                                    key={seller.id}
                                    href={route('admin.sellers.show', seller.id)}
                                    className="flex justify-between py-3 text-sm hover:bg-gray-50"
                                >
                                    <div>
                                        <p className="font-medium">{seller.business_name ?? seller.store_name}</p>
                                        <p className="text-gray-500">{seller.user.email}</p>
                                    </div>
                                    <span className="font-medium text-orange-500">Approve →</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Withdrawal payouts</h3>
                        <Link
                            href={route('admin.withdrawals.index', { status: 'pending' })}
                            className="text-sm text-orange-500 hover:underline"
                        >
                            Open payouts
                        </Link>
                    </div>
                    {pendingWithdrawals.length === 0 ? (
                        <p className="mt-4 text-sm text-gray-500">No pending withdrawal requests.</p>
                    ) : (
                        <div className="mt-4 divide-y">
                            {pendingWithdrawals.map((w) => (
                                <Link
                                    key={w.id}
                                    href={route('admin.withdrawals.index', { status: 'pending' })}
                                    className="flex justify-between gap-3 py-3 text-sm hover:bg-gray-50"
                                >
                                    <div className="min-w-0">
                                        <p className="font-medium">{w.user?.name ?? 'User'}</p>
                                        <p className="truncate text-gray-500">
                                            {w.momo_number}
                                            {w.network ? ` · ${w.network}` : ''}
                                            {w.user?.role ? ` · ${w.user.role}` : ''}
                                        </p>
                                    </div>
                                    <p className="shrink-0 font-medium text-orange-500">{formatPrice(w.amount)}</p>
                                </Link>
                            ))}
                        </div>
                    )}
                    <p className="mt-3 text-xs text-gray-500">
                        Flow: Start processing → send MoMo → Mark paid (optional proof).
                    </p>
                </div>
            </div>

            <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Recent Orders</h3>
                    <Link href={route('admin.orders.index')} className="text-sm text-orange-500 hover:underline">
                        View all
                    </Link>
                </div>
                {recentOrders.length === 0 ? (
                    <p className="mt-4 text-sm text-gray-500">No orders yet.</p>
                ) : (
                    <div className="mt-4 divide-y">
                        {recentOrders.map((order) => (
                            <Link
                                key={order.id}
                                href={route('admin.orders.show', order.id)}
                                className="flex justify-between py-3 text-sm hover:bg-gray-50"
                            >
                                <div>
                                    <p className="font-medium">{order.order_number}</p>
                                    <p className="text-gray-500">{order.buyer?.name}</p>
                                </div>
                                <p className="font-medium text-orange-500">{formatPrice(order.total)}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
