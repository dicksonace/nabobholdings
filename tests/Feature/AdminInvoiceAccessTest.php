<?php

namespace Tests\Feature;

use App\Enums\InvoiceType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Checkout;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminInvoiceAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_admin_can_view_and_download_any_invoice_type(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $buyer = User::factory()->create(['role' => UserRole::Buyer]);
        $seller = User::factory()->create(['role' => UserRole::Seller]);

        $checkout = Checkout::create([
            'checkout_number' => 'CHK-INV-1',
            'buyer_id' => $buyer->id,
            'status' => OrderStatus::Delivered,
            'payment_status' => PaymentStatus::Paid,
            'receiver_name' => 'Buyer',
            'receiver_phone' => '0700000000',
            'region' => 'Western',
            'city' => 'Colombo',
            'subtotal' => 100,
            'shipping_cost' => 0,
            'commission_amount' => 5,
            'total' => 100,
        ]);

        $customer = Invoice::create([
            'checkout_id' => $checkout->id,
            'user_id' => $buyer->id,
            'invoice_number' => 'INV-CUSTOMER-1',
            'type' => InvoiceType::Customer,
            'subtotal' => 100,
            'shipping_cost' => 0,
            'commission_amount' => 0,
            'total' => 100,
            'payment_status' => PaymentStatus::Paid->value,
            'issued_at' => now(),
            'line_items' => [[
                'product_name' => 'Phone',
                'quantity' => 1,
                'unit_price' => 100,
                'total' => 100,
            ]],
        ]);

        $sellerInvoice = Invoice::create([
            'checkout_id' => $checkout->id,
            'user_id' => $seller->id,
            'invoice_number' => 'INV-SELLER-1',
            'type' => InvoiceType::Seller,
            'subtotal' => 100,
            'shipping_cost' => 0,
            'commission_amount' => 5,
            'total' => 95,
            'payment_status' => PaymentStatus::Paid->value,
            'issued_at' => now(),
            'line_items' => [[
                'product_name' => 'Phone',
                'quantity' => 1,
                'unit_price' => 100,
                'total' => 100,
            ]],
        ]);

        $this->actingAs($admin)
            ->get(route('invoices.show', $customer))
            ->assertOk();

        $this->actingAs($admin)
            ->get(route('invoices.show', $sellerInvoice))
            ->assertOk();

        $this->actingAs($admin)
            ->get(route('invoices.pdf', $customer))
            ->assertOk();
    }

    public function test_buyer_cannot_open_seller_invoice(): void
    {
        $buyer = User::factory()->create(['role' => UserRole::Buyer]);
        $seller = User::factory()->create(['role' => UserRole::Seller]);

        $checkout = Checkout::create([
            'checkout_number' => 'CHK-INV-2',
            'buyer_id' => $buyer->id,
            'status' => OrderStatus::Delivered,
            'payment_status' => PaymentStatus::Paid,
            'receiver_name' => 'Buyer',
            'receiver_phone' => '0700000001',
            'region' => 'Western',
            'city' => 'Colombo',
            'subtotal' => 50,
            'shipping_cost' => 0,
            'commission_amount' => 2,
            'total' => 50,
        ]);

        $sellerInvoice = Invoice::create([
            'checkout_id' => $checkout->id,
            'user_id' => $seller->id,
            'invoice_number' => 'INV-SELLER-2',
            'type' => InvoiceType::Seller,
            'subtotal' => 50,
            'shipping_cost' => 0,
            'commission_amount' => 2,
            'total' => 48,
            'payment_status' => PaymentStatus::Paid->value,
            'issued_at' => now(),
            'line_items' => [[
                'product_name' => 'Cable',
                'quantity' => 1,
                'unit_price' => 50,
                'total' => 50,
            ]],
        ]);

        $this->actingAs($buyer)
            ->get(route('invoices.show', $sellerInvoice))
            ->assertForbidden();
    }
}
