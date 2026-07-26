<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Console\Command;

class ReleasePendingStoreFundsCommand extends Command
{
    protected $signature = 'store:release-pending-funds
                            {--email=admin@nabobholdings.com : Store owner admin email}';

    protected $description = 'Release all marketplace pending funds into the owner store available balance (single-seller mode)';

    public function handle(OrderService $orders): int
    {
        $email = (string) $this->option('email');
        $admin = User::query()->where('email', $email)->where('role', UserRole::Admin)->first();

        if (! $admin) {
            $this->error("Admin user not found: {$email}");

            return self::FAILURE;
        }

        $items = $orders->pendingFundReleaseItemsQuery()
            ->where('seller_id', $admin->id)
            ->get();

        $released = 0;
        $failed = 0;

        foreach ($items as $item) {
            try {
                $orders->releaseSellerFunds($item, $admin->id, adminOverride: true);
                $released++;
            } catch (\Throwable $e) {
                $failed++;
                $this->warn("Item #{$item->id}: {$e->getMessage()}");
            }
        }

        $this->info("Released funds for {$released} order item(s). Failed: {$failed}.");

        return self::SUCCESS;
    }
}
