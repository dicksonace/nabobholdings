<?php

namespace Tests\Feature;

use App\Enums\ProductStatus;
use App\Enums\SellerStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\SellerProfile;
use App\Models\StoreCustomization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SellerProductUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function approvedSeller(): User
    {
        $seller = User::factory()->create(['role' => UserRole::Seller]);

        $profile = SellerProfile::create([
            'user_id' => $seller->id,
            'store_name' => 'Edit Store',
            'status' => SellerStatus::Approved,
            'approved_at' => now(),
        ]);

        StoreCustomization::create([
            'seller_profile_id' => $profile->id,
            'setup_completed_at' => now(),
            'published_at' => now(),
            'published_settings' => [],
            'draft_settings' => [],
        ]);

        return $seller->fresh();
    }

    public function test_seller_can_open_edit_page_and_update_product_details(): void
    {
        $seller = $this->approvedSeller();
        $category = Category::create([
            'name' => 'TVs',
            'slug' => 'tvs-'.uniqid(),
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $product = Product::create([
            'seller_id' => $seller->id,
            'category_id' => $category->id,
            'name' => 'Old TV',
            'slug' => 'old-tv-'.uniqid(),
            'price' => 50000,
            'discount_price' => 50,
            'quantity' => 10,
            'status' => ProductStatus::Approved,
        ]);

        ProductImage::create([
            'product_id' => $product->id,
            'path' => 'products/tv.jpg',
            'is_primary' => true,
            'sort_order' => 0,
        ]);

        $this->actingAs($seller)
            ->get(route('manage.products.edit', $product))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('seller/products/edit')
                ->where('product.name', 'Old TV'));

        $this->actingAs($seller)
            ->from(route('manage.products.edit', $product))
            ->put(route('manage.products.update', $product), [
                'name' => 'Samsung Smart TV',
                'category_id' => $category->id,
                'price' => 48000,
                'discount_price' => 45000,
                'quantity' => 8,
                'shipping_type' => 'buyer',
            ])
            ->assertRedirect(route('manage.products.index'));

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Samsung Smart TV',
            'quantity' => 8,
        ]);
    }
}
