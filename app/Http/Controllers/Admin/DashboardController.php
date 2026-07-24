<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductStatus;
use App\Enums\SellerStatus;
use App\Enums\UserRole;
use App\Enums\WithdrawalStatus;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\SellerProfile;
use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfToday = $now->copy()->startOfDay();
        $startOf7d = $now->copy()->subDays(6)->startOfDay();
        $seriesStart = $now->copy()->subDays(29)->startOfDay();

        $paidOrders = Order::where('payment_status', PaymentStatus::Paid);

        $stats = [
            // Revenue
            'total_revenue' => (float) (clone $paidOrders)->sum('total'),
            'revenue_today' => (float) (clone $paidOrders)->where('created_at', '>=', $startOfToday)->sum('total'),
            'revenue_month' => (float) (clone $paidOrders)->where('created_at', '>=', $startOfMonth)->sum('total'),
            'avg_order_value' => (float) (clone $paidOrders)->avg('total'),

            // Orders
            'total_orders' => Order::count(),
            'orders_today' => Order::where('created_at', '>=', $startOfToday)->count(),
            'orders_week' => Order::where('created_at', '>=', $startOf7d)->count(),
            'orders_month' => Order::where('created_at', '>=', $startOfMonth)->count(),
            'paid_orders' => (clone $paidOrders)->count(),
            'cancelled_orders' => Order::where('status', OrderStatus::Cancelled)->count(),
            'delivered_orders' => Order::where('status', OrderStatus::Delivered)->count(),

            // Commission earned by the platform (paid orders)
            'total_commission' => (float) (clone $paidOrders)->sum('commission_amount'),

            // Users
            'total_users' => User::count(),
            'total_buyers' => User::where('role', UserRole::Buyer)->count(),
            'total_sellers' => User::where('role', UserRole::Seller)->count(),
            'new_users_month' => User::where('created_at', '>=', $startOfMonth)->count(),

            // Sellers
            'approved_sellers' => SellerProfile::where('status', SellerStatus::Approved)->count(),
            'pending_sellers' => SellerProfile::where('status', SellerStatus::Pending)->count(),
            'suspended_sellers' => SellerProfile::where('status', SellerStatus::Suspended)->count(),

            // Products
            'total_products' => Product::count(),
            'live_products' => Product::where('status', ProductStatus::Approved)->count(),
            'pending_products' => Product::where('status', ProductStatus::Pending)->count(),
            'out_of_stock' => Product::where('quantity', '<=', 0)->count(),

            // Withdrawals
            'pending_withdrawals' => Withdrawal::where('status', WithdrawalStatus::Pending)->count(),
            'pending_withdrawals_amount' => (float) Withdrawal::where('status', WithdrawalStatus::Pending)->sum('amount'),
            'paid_withdrawals_amount' => (float) Withdrawal::where('status', WithdrawalStatus::Paid)->sum('amount'),
        ];

        // 30-day revenue + orders time series
        $revenueByDay = (clone $paidOrders)
            ->where('created_at', '>=', $seriesStart)
            ->selectRaw('DATE(created_at) as d, SUM(total) as revenue')
            ->groupBy('d')
            ->pluck('revenue', 'd');

        $ordersByDay = Order::where('created_at', '>=', $seriesStart)
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
            ->groupBy('d')
            ->pluck('c', 'd');

        $signupsByDay = User::where('created_at', '>=', $seriesStart)
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
            ->groupBy('d')
            ->pluck('c', 'd');

        $series = [];
        for ($i = 0; $i < 30; $i++) {
            $day = $now->copy()->subDays(29 - $i)->format('Y-m-d');
            $series[] = [
                'date' => $day,
                'revenue' => (float) ($revenueByDay[$day] ?? 0),
                'orders' => (int) ($ordersByDay[$day] ?? 0),
                'signups' => (int) ($signupsByDay[$day] ?? 0),
            ];
        }

        // Order status breakdown (all statuses, zero-filled)
        $rawOrderStatus = Order::selectRaw('status, COUNT(*) as c')->groupBy('status')->pluck('c', 'status');
        $orderStatusBreakdown = collect(OrderStatus::cases())
            ->map(fn (OrderStatus $s) => [
                'key' => $s->value,
                'label' => ucwords(str_replace('_', ' ', $s->value)),
                'count' => (int) ($rawOrderStatus[$s->value] ?? 0),
            ])
            ->values();

        // Seller status breakdown
        $rawSellerStatus = SellerProfile::selectRaw('status, COUNT(*) as c')->groupBy('status')->pluck('c', 'status');
        $sellerStatusBreakdown = collect(SellerStatus::cases())
            ->map(fn (SellerStatus $s) => [
                'key' => $s->value,
                'label' => ucfirst($s->value),
                'count' => (int) ($rawSellerStatus[$s->value] ?? 0),
            ])
            ->values();

        // Users by role
        $rawRoles = User::selectRaw('role, COUNT(*) as c')->groupBy('role')->pluck('c', 'role');
        $usersByRole = collect(UserRole::cases())
            ->map(fn (UserRole $r) => [
                'key' => $r->value,
                'label' => ucfirst($r->value).'s',
                'count' => (int) ($rawRoles[$r->value] ?? 0),
            ])
            ->values();

        // Top products by views
        $topProducts = Product::orderByDesc('views')
            ->limit(6)
            ->get(['id', 'name', 'views', 'purchase_count', 'price'])
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'views' => (int) $p->views,
                'purchases' => (int) $p->purchase_count,
                'price' => (float) $p->price,
            ]);

        // Top categories by number of products
        $topCategories = Category::withCount('products')
            ->orderByDesc('products_count')
            ->limit(6)
            ->get(['id', 'name'])
            ->map(fn (Category $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'products' => (int) $c->products_count,
            ]);

        // Top sellers by paid revenue (falls back to product count when no sales yet)
        $topSellers = Order::where('payment_status', PaymentStatus::Paid)
            ->whereNotNull('seller_id')
            ->selectRaw('seller_id, SUM(total) as revenue, COUNT(*) as orders')
            ->groupBy('seller_id')
            ->orderByDesc('revenue')
            ->limit(6)
            ->get();

        if ($topSellers->isEmpty()) {
            $topSellers = Product::whereNotNull('seller_id')
                ->selectRaw('seller_id, COUNT(*) as products, 0 as revenue')
                ->groupBy('seller_id')
                ->orderByDesc('products')
                ->limit(6)
                ->get();
        }

        $sellerNames = User::whereIn('id', $topSellers->pluck('seller_id'))->pluck('name', 'id');
        $topSellers = $topSellers->map(fn ($row) => [
            'id' => $row->seller_id,
            'name' => $sellerNames[$row->seller_id] ?? 'Seller #'.$row->seller_id,
            'revenue' => (float) ($row->revenue ?? 0),
            'orders' => (int) ($row->orders ?? 0),
            'products' => (int) ($row->products ?? 0),
        ])->values();

        $recentOrders = Order::with('buyer')->latest()->limit(6)->get();
        $pendingSellers = SellerProfile::with('user')->where('status', SellerStatus::Pending)->latest()->limit(5)->get();
        $pendingWithdrawals = Withdrawal::with('user:id,name,email,role')
            ->where('status', WithdrawalStatus::Pending)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Withdrawal $w) => [
                'id' => $w->id,
                'amount' => (float) $w->amount,
                'network' => $w->network,
                'momo_number' => $w->momo_number,
                'account_name' => $w->account_name,
                'created_at' => $w->created_at?->toIso8601String(),
                'user' => $w->user ? [
                    'name' => $w->user->name,
                    'email' => $w->user->email,
                    'role' => $w->user->role?->value,
                ] : null,
            ]);

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'series' => $series,
            'orderStatusBreakdown' => $orderStatusBreakdown,
            'sellerStatusBreakdown' => $sellerStatusBreakdown,
            'usersByRole' => $usersByRole,
            'topProducts' => $topProducts,
            'topCategories' => $topCategories,
            'topSellers' => $topSellers,
            'recentOrders' => $recentOrders,
            'pendingSellers' => $pendingSellers,
            'pendingWithdrawals' => $pendingWithdrawals,
        ]);
    }
}
