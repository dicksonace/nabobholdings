<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductStatus;
use App\Enums\SellerStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\SellerProfile;
use App\Models\User;
use App\Services\ReviewService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductRatingSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_ratings_sync_clears_fake_counters_without_reviews(): void
    {
        $seller = User::factory()->create(['role' => UserRole::Seller]);
        SellerProfile::create([
            'user_id' => $seller->id,
            'store_name' => 'Demo Store',
            'business_name' => 'Demo Store',
            'status' => SellerStatus::Approved,
            'rating' => 4.8,
        ]);

        $product = Product::create([
            'seller_id' => $seller->id,
            'name' => 'Fake Rated Tractor',
            'slug' => 'fake-rated-tractor',
            'price' => 1000,
            'quantity' => 5,
            'status' => ProductStatus::Approved,
            'rating' => 4.9,
            'review_count' => 19,
        ]);

        $this->artisan('ratings:sync')->assertSuccessful();

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'rating' => 0,
            'review_count' => 0,
        ]);

        $this->assertDatabaseHas('seller_profiles', [
            'user_id' => $seller->id,
            'rating' => 0,
        ]);
    }

    public function test_delivered_buyer_can_post_review_and_update_product_rating(): void
    {
        $seller = User::factory()->create(['role' => UserRole::Seller]);
        SellerProfile::create([
            'user_id' => $seller->id,
            'store_name' => 'Live Store',
            'business_name' => 'Live Store',
            'status' => SellerStatus::Approved,
            'rating' => 0,
        ]);

        $buyer = User::factory()->create(['role' => UserRole::Buyer]);

        $product = Product::create([
            'seller_id' => $seller->id,
            'name' => 'Real Tractor',
            'slug' => 'real-tractor',
            'price' => 2000,
            'quantity' => 3,
            'status' => ProductStatus::Approved,
            'rating' => 0,
            'review_count' => 0,
        ]);

        $order = Order::create([
            'order_number' => 'ORD-TEST-1',
            'buyer_id' => $buyer->id,
            'seller_id' => $seller->id,
            'status' => OrderStatus::Delivered,
            'payment_status' => PaymentStatus::Paid,
            'receiver_name' => 'Buyer',
            'receiver_phone' => '0700000000',
            'region' => 'Western',
            'city' => 'Colombo',
            'subtotal' => 2000,
            'shipping_cost' => 0,
            'total' => 2000,
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'seller_id' => $seller->id,
            'product_name' => $product->name,
            'unit_price' => 2000,
            'quantity' => 1,
            'commission_rate' => 0,
            'commission_amount' => 0,
            'seller_amount' => 2000,
            'status' => OrderStatus::Delivered,
        ]);

        $this->actingAs($buyer)
            ->post(route('products.reviews.store', $product->slug), [
                'order_item_id' => $item->id,
                'rating' => 5,
                'comment' => 'Excellent machine.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('reviews', [
            'product_id' => $product->id,
            'user_id' => $buyer->id,
            'rating' => 5,
        ]);

        $product->refresh();
        $this->assertSame(5.0, (float) $product->rating);
        $this->assertSame(1, (int) $product->review_count);
    }

    public function test_sync_keeps_rating_from_real_reviews(): void
    {
        $seller = User::factory()->create(['role' => UserRole::Seller]);
        $buyer = User::factory()->create(['role' => UserRole::Buyer]);

        $product = Product::create([
            'seller_id' => $seller->id,
            'name' => 'Synced Tractor',
            'slug' => 'synced-tractor',
            'price' => 1500,
            'quantity' => 2,
            'status' => ProductStatus::Approved,
            'rating' => 0,
            'review_count' => 0,
        ]);

        $order = Order::create([
            'order_number' => 'ORD-TEST-2',
            'buyer_id' => $buyer->id,
            'seller_id' => $seller->id,
            'status' => OrderStatus::Delivered,
            'payment_status' => PaymentStatus::Paid,
            'receiver_name' => 'Buyer',
            'receiver_phone' => '0700000001',
            'region' => 'Western',
            'city' => 'Colombo',
            'subtotal' => 1500,
            'shipping_cost' => 0,
            'total' => 1500,
        ]);

        Review::create([
            'product_id' => $product->id,
            'user_id' => $buyer->id,
            'order_id' => $order->id,
            'rating' => 4,
            'comment' => 'Good',
        ]);

        ReviewService::syncProductRating($product->fresh());

        $product->refresh();
        $this->assertSame(4.0, (float) $product->rating);
        $this->assertSame(1, (int) $product->review_count);
    }
}
