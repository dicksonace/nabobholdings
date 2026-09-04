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

    public function test_seller_can_update_product_with_form_data_style_payload(): void
    {
        $seller = $this->approvedSeller();
        $category = Category::create([
            'name' => 'Phones',
            'slug' => 'phones-'.uniqid(),
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $product = Product::create([
            'seller_id' => $seller->id,
            'category_id' => $category->id,
            'name' => 'Old Phone',
            'slug' => 'old-phone-'.uniqid(),
            'price' => 60000,
            'discount_price' => 55000,
            'quantity' => 100,
            'status' => ProductStatus::Approved,
            'free_shipping' => false,
            'delivery_fee' => 400,
            'delivery_days' => 7,
        ]);

        ProductImage::create([
            'product_id' => $product->id,
            'path' => 'products/phone.jpg',
            'is_primary' => true,
            'sort_order' => 0,
        ]);

        // Mimic Inertia forceFormData: stringy booleans + image_count=0 (no new uploads).
        $this->actingAs($seller)
            ->from(route('manage.products.edit', $product))
            ->post(route('manage.products.update', $product), [
                '_method' => 'PUT',
                'name' => 'Updated Phone',
                'category_id' => (string) $category->id,
                'price' => '60000.00',
                'discount_price' => '55000.00',
                'quantity' => '100',
                'shipping_type' => 'paid',
                'delivery_fee' => '400',
                'delivery_days' => '7',
                'image_count' => '0',
                'free_shipping' => 'false',
                'is_negotiable' => 'false',
                'cash_on_delivery' => 'true',
                'pickup_available' => 'false',
                'ships_nationwide' => 'true',
                'in_ghana' => 'true',
                'remove_video' => 'false',
            ])
            ->assertRedirect(route('manage.products.index'));

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Updated Phone',
            'cash_on_delivery' => 1,
            'delivery_fee' => 400,
        ]);
    }
}
