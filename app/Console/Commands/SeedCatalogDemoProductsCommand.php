<?php

namespace App\Console\Commands;

use Database\Seeders\CatalogDemoProductsSeeder;
use Illuminate\Console\Command;

class SeedCatalogDemoProductsCommand extends Command
{
    protected $signature = 'catalog:seed-demo-products
                            {--fresh : Replace galleries even when products already exist}';

    protected $description = 'Seed 2 demo products per catalog leaf category with matching Unsplash images (owner store)';

    public function handle(): int
    {
        $seeder = new CatalogDemoProductsSeeder;
        $seeder->fresh = (bool) $this->option('fresh');
        $seeder->setCommand($this);
        $seeder->run();

        $this->call('products:index-image-colors');

        return self::SUCCESS;
    }
}
