<?php

namespace App\Console\Commands;

use App\Models\Category;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class SyncCatalogCategoriesCommand extends Command
{
    protected $signature = 'catalog:sync-categories {--deactivate-old : Hide leftover empty categories not in this catalog}';

    protected $description = 'Upsert the Nabob Holdings product category tree (parents + children)';

    /**
     * @return array<int, array{name: string, icon: string, children: list<string>}>
     */
    private function tree(): array
    {
        return [
            [
                'name' => 'Vehicles & Auto',
                'icon' => '🚗',
                'children' => [
                    'Cars',
                    'Mini Trucks',
                    'Vans',
                    'Motorcycles',
                    'Bicycles',
                    'Auto Parts',
                    'Engines',
                    'Gearboxes',
                    'Wheels & Tires',
                    'Batteries',
                ],
            ],
            [
                'name' => 'Heavy Machinery',
                'icon' => '🚜',
                'children' => [
                    'Excavators',
                    'Forklifts',
                    'Generators',
                    'Compressors',
                    'Construction Equipment',
                    'Agricultural Machinery',
                ],
            ],
            [
                'name' => 'Marine',
                'icon' => '🚤',
                'children' => [
                    'Outboard Motors',
                    'Boats',
                    'Jet Skis',
                    'Marine Parts',
                ],
            ],
            [
                'name' => 'Home & Living',
                'icon' => '🏠',
                'children' => [
                    'Furniture',
                    'Office Furniture',
                    'Kitchen Equipment',
                    'Air Conditioners',
                    'Refrigerators',
                    'Washing Machines',
                ],
            ],
            [
                'name' => 'Electronics',
                'icon' => '⚡',
                'children' => [
                    'TVs',
                    'Audio Systems',
                    'Cameras',
                    'Computers',
                    'Laptops',
                    'Gaming Consoles',
                    'Smartphones',
                ],
            ],
            [
                'name' => 'Solar & Power',
                'icon' => '🔋',
                'children' => [
                    'Solar Panels',
                    'Inverters',
                    'Lithium Batteries',
                    'UPS Systems',
                ],
            ],
            [
                'name' => 'Medical',
                'icon' => '🏥',
                'children' => [
                    'Electric Wheelchairs',
                    'Hospital Beds',
                    'Walking Aids',
                    'Medical Equipment',
                ],
            ],
            [
                'name' => 'Sports & Outdoor',
                'icon' => '🎣',
                'children' => [
                    'Fishing Equipment',
                    'Diving Equipment',
                    'Camping Gear',
                    'Cycling Accessories',
                ],
            ],
        ];
    }

    public function handle(): int
    {
        $keepSlugs = [];
        $parentOrder = 10;

        foreach ($this->tree() as $group) {
            $parentSlug = Str::slug($group['name']);
            $keepSlugs[] = $parentSlug;

            $parent = Category::updateOrCreate(
                ['slug' => $parentSlug],
                [
                    'name' => $group['name'],
                    'icon' => $group['icon'],
                    'parent_id' => null,
                    'is_active' => true,
                    'sort_order' => $parentOrder,
                    'spec_schema' => null,
                ]
            );

            $this->line("Parent: {$parent->name}");

            $childOrder = 1;
            foreach ($group['children'] as $childName) {
                $childSlug = Str::slug($childName);
                $keepSlugs[] = $childSlug;

                Category::updateOrCreate(
                    ['slug' => $childSlug],
                    [
                        'name' => $childName,
                        'icon' => $group['icon'],
                        'parent_id' => $parent->id,
                        'is_active' => true,
                        'sort_order' => $childOrder,
                        'spec_schema' => config("category_specs.{$childSlug}")
                            ? ['fields' => config("category_specs.{$childSlug}.fields")]
                            : null,
                    ]
                );

                $this->line("  └─ {$childName}");
                $childOrder++;
            }

            $parentOrder += 10;
        }

        if ($this->option('deactivate-old')) {
            $hidden = Category::query()
                ->whereNotIn('slug', $keepSlugs)
                ->whereDoesntHave('products')
                ->update(['is_active' => false]);

            $this->info("Hidden {$hidden} empty leftover categor(ies).");
        }

        $this->info('Catalog categories synced. Owner Panel → Products → Categories can edit these anytime.');

        return self::SUCCESS;
    }
}
