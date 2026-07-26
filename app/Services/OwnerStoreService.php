<?php

namespace App\Services;

use App\Enums\SellerStatus;
use App\Enums\UserRole;
use App\Models\Conversation;
use App\Models\Dispute;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\SellerCoupon;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Boots the single owner store for an admin in single-seller mode.
 * Keeps seller_id FKs working without a multi-vendor marketplace.
 */
class OwnerStoreService
{
    public function __construct(
        private StoreCustomizationService $customizations,
    ) {}

    /**
     * Ensure the admin has an approved seller profile, wallet, and completed store setup.
     */
    public function ensureForAdmin(User $admin): SellerProfile
    {
        if (! $admin->isAdmin()) {
            throw new \InvalidArgumentException('Owner store can only be attached to an admin user.');
        }

        return DB::transaction(function () use ($admin) {
            $brandName = PlatformSettings::brandName();

            $profile = SellerProfile::firstOrCreate(
                ['user_id' => $admin->id],
                [
                    'business_name' => $brandName,
                    'store_name' => $brandName,
                    'store_description' => 'Official '.PlatformSettings::brandName().' store.',
                    'status' => SellerStatus::Approved,
                    'approved_at' => now(),
                    'approved_by' => $admin->id,
                    'accept_marketplace_payments' => true,
                    'accept_direct_payments' => true,
                ],
            );

            if ($profile->status !== SellerStatus::Approved) {
                $profile->update([
                    'status' => SellerStatus::Approved,
                    'approved_at' => $profile->approved_at ?? now(),
                    'approved_by' => $profile->approved_by ?? $admin->id,
                    'rejection_reason' => null,
                ]);
            }

            WalletService::ensure($admin);

            $customization = $this->customizations->forProfile($profile->fresh());
            if (! $customization->isSetupComplete()) {
                $this->customizations->completeSetup($customization);
            }

            return $profile->fresh(['storeCustomization']);
        });
    }

    /**
     * Move catalog + order ownership from other sellers onto the admin owner store.
     *
     * @return array{products: int, order_items: int, orders: int, disputes: int, coupons: int, conversations: int, payments: int, sellers_suspended: int}
     */
    public function claimExistingCatalog(User $admin): array
    {
        $this->ensureForAdmin($admin);
        $ownerId = $admin->id;

        return DB::transaction(function () use ($ownerId) {
            $otherSellerIds = User::query()
                ->where('role', UserRole::Seller)
                ->where('id', '!=', $ownerId)
                ->pluck('id');

            $products = Product::withTrashed()
                ->where('seller_id', '!=', $ownerId)
                ->update(['seller_id' => $ownerId]);

            $orderItems = OrderItem::query()
                ->where('seller_id', '!=', $ownerId)
                ->update(['seller_id' => $ownerId]);

            $orders = Order::query()
                ->whereNotNull('seller_id')
                ->where('seller_id', '!=', $ownerId)
                ->update(['seller_id' => $ownerId]);

            $disputes = Dispute::query()
                ->where('seller_id', '!=', $ownerId)
                ->update(['seller_id' => $ownerId]);

            $coupons = SellerCoupon::query()
                ->where('seller_id', '!=', $ownerId)
                ->update(['seller_id' => $ownerId]);

            $conversations = Conversation::query()
                ->where('seller_id', '!=', $ownerId)
                ->update(['seller_id' => $ownerId]);

            $payments = Payment::query()
                ->whereNotNull('seller_id')
                ->where('seller_id', '!=', $ownerId)
                ->update(['seller_id' => $ownerId]);

            $sellersSuspended = 0;
            if ($otherSellerIds->isNotEmpty()) {
                $sellersSuspended = SellerProfile::query()
                    ->whereIn('user_id', $otherSellerIds)
                    ->where('status', '!=', SellerStatus::Suspended)
                    ->update([
                        'status' => SellerStatus::Suspended,
                        'rejection_reason' => 'Merged into single-owner store.',
                    ]);
            }

            return [
                'products' => $products,
                'order_items' => $orderItems,
                'orders' => $orders,
                'disputes' => $disputes,
                'coupons' => $coupons,
                'conversations' => $conversations,
                'payments' => $payments,
                'sellers_suspended' => $sellersSuspended,
            ];
        });
    }
}
