<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use App\Services\OwnerStoreService;
use Illuminate\Console\Command;

class ClaimOwnerStoreCommand extends Command
{
    protected $signature = 'store:claim-owner
                            {--email=admin@nabobholdings.com : Admin email that owns the store}
                            {--claim : Also move existing products/orders onto this owner}';

    protected $description = 'Ensure the admin has the single owner store (and optionally claim all catalog/orders)';

    public function handle(OwnerStoreService $ownerStores): int
    {
        $email = (string) $this->option('email');
        $admin = User::query()->where('email', $email)->where('role', UserRole::Admin)->first();

        if (! $admin) {
            $this->error("Admin user not found: {$email}");

            return self::FAILURE;
        }

        $profile = $ownerStores->ensureForAdmin($admin);
        $this->info("Owner store ready for {$admin->email} (slug: {$profile->slug}).");

        if ($this->option('claim')) {
            $stats = $ownerStores->claimExistingCatalog($admin);
            $this->table(array_keys($stats), [array_values($stats)]);
            $this->info('Existing catalog and orders claimed by the owner store.');
        }

        return self::SUCCESS;
    }
}
