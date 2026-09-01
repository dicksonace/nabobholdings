<?php

namespace Tests\Feature\Admin;

use App\Enums\ProductStatus;
use App\Enums\UserRole;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function createProduct(int $sellerId, ProductStatus $status, int $quantity, bool $preorder = false): void
    {
        Product::create([
            'seller_id' => $sellerId,
            'name' => 'Product '.uniqid(),
            'slug' => 'product-'.uniqid(),
            'price' => 100,
            'quantity' => $quantity,
            'status' => $status,
            'is_preorder' => $preorder,
        ]);
    }

    public function test_dashboard_product_counts_are_consistent(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $seller = User::factory()->create(['role' => UserRole::Seller]);

        $this->createProduct($seller->id, ProductStatus::Approved, 5);
        $this->createProduct($seller->id, ProductStatus::Approved, 0);
        $this->createProduct($seller->id, ProductStatus::Draft, 10);

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));

        $response->assertOk();
        $stats = $response->viewData('page')['props']['stats'];

        $this->assertSame(2, $stats['total_products']);
        $this->assertSame(1, $stats['live_products']);
        $this->assertSame(1, $stats['out_of_stock']);
        $this->assertSame($stats['live_products'] + $stats['out_of_stock'], $stats['total_products']);
    }

    public function test_admin_orders_index_filters_paid_orders(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $response = $this->actingAs($admin)->get(route('admin.orders.index', ['payment_status' => 'paid']));

        $response->assertOk();
        $filters = $response->viewData('page')['props']['filters'];
        $this->assertSame('paid', $filters['payment_status']);
    }

    public function test_admin_buyers_index_filters_new_users_this_month(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $response = $this->actingAs($admin)->get(route('admin.buyers.index', ['period' => 'month']));

        $response->assertOk();
        $period = $response->viewData('page')['props']['period'];
        $this->assertSame('month', $period);
    }
}
