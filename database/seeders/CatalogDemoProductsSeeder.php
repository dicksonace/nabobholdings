<?php

namespace Database\Seeders;

use App\Enums\ProductStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use App\Services\CategorySpecService;
use App\Services\OwnerStoreService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds 2 demo products per active leaf category with category-matched Unsplash images.
 * Attaches everything to the admin owner store.
 */
class CatalogDemoProductsSeeder extends Seeder
{
    /**
     * When true, replace galleries on existing demo products (matched by slug).
     */
    public bool $fresh = false;

    public function run(): void
    {
        $admin = User::where('email', 'admin@nabobholdings.com')->first()
            ?? User::where('role', UserRole::Admin)->first();

        if (! $admin) {
            $this->command?->error('Admin owner not found. Run DatabaseSeeder first.');

            return;
        }

        app(OwnerStoreService::class)->ensureForAdmin($admin);

        $leaves = Category::query()
            ->whereNotNull('parent_id')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->keyBy('slug');

        if ($leaves->isEmpty()) {
            $this->command?->warn('No leaf categories. Run: php artisan catalog:sync-categories');

            return;
        }

        $created = 0;
        $updated = 0;

        foreach ($this->catalog() as $slug => $items) {
            $category = $leaves->get($slug);
            if (! $category) {
                $this->command?->warn("Skipping missing category: {$slug}");

                continue;
            }

            foreach ($items as $item) {
                $result = $this->upsertProduct($admin, $category, $item);
                if ($result === 'created') {
                    $created++;
                } else {
                    $updated++;
                }
            }
        }

        $this->command?->info("Catalog demo products ready. Created: {$created}, updated: {$updated}.");
        $this->command?->info('Run: php artisan products:index-image-colors');
    }

    /**
     * @param  array{name: string, brand: string, price: float, description?: string, images: list<string>}  $item
     */
    private function upsertProduct(User $seller, Category $category, array $item): string
    {
        $slug = Str::slug($item['name']);

        $product = Product::query()
            ->where('seller_id', $seller->id)
            ->where('slug', $slug)
            ->first();

        $payload = [
            'category_id' => $category->id,
            'name' => $item['name'],
            'description' => $item['description'] ?? $this->description($item['name'], $category->name),
            'specifications' => CategorySpecService::generateSpecs($category->slug),
            'brand' => $item['brand'],
            'price' => $item['price'],
            'discount_price' => isset($item['discount']) ? $item['discount'] : null,
            'quantity' => $item['quantity'] ?? random_int(3, 40),
            'condition' => $item['condition'] ?? 'used',
            'status' => ProductStatus::Approved,
            'is_preorder' => false,
            'free_shipping' => $item['free_shipping'] ?? false,
            'in_ghana' => true,
            'ships_nationwide' => true,
            'rating' => $item['rating'] ?? round(random_int(42, 50) / 10, 1),
            'review_count' => $item['review_count'] ?? random_int(2, 48),
            'views' => random_int(80, 2400),
        ];

        if (! $product) {
            $product = Product::create([
                'seller_id' => $seller->id,
                'slug' => $slug,
                ...$payload,
            ]);
            $this->syncImages($product, $item['images'], true);

            return 'created';
        }

        $product->update($payload);

        if ($this->fresh || $product->images()->count() === 0) {
            $this->syncImages($product, $item['images'], true);
        }

        return 'updated';
    }

    /**
     * @param  list<string>  $images
     */
    private function syncImages(Product $product, array $images, bool $replace): void
    {
        if ($replace) {
            $product->images()->delete();
        }

        foreach (array_values($images) as $index => $url) {
            ProductImage::create([
                'product_id' => $product->id,
                'path' => $url,
                'is_primary' => $index === 0,
                'sort_order' => $index,
            ]);
        }
    }

    private function description(string $name, string $category): string
    {
        return "The {$name} is listed under {$category} on Nabob Holdings — inspected stock, "
            .'clear photos, and secure checkout. Nationwide delivery available from our Accra warehouse.';
    }

    private function img(string $photoId): string
    {
        return "https://images.unsplash.com/{$photoId}?auto=format&fit=crop&w=800&h=800&q=80";
    }

    /**
     * @return array<string, list<array{name: string, brand: string, price: float, images: list<string>, discount?: float, condition?: string}>>
     */
    private function catalog(): array
    {
        $u = fn (string $id) => $this->img($id);

        return [
            'cars' => [
                [
                    'name' => 'Toyota Corolla 2018 Automatic',
                    'brand' => 'Toyota',
                    'price' => 78500,
                    'condition' => 'used',
                    'images' => [
                        $u('photo-1492144534655-ae79c964c9d7'),
                        $u('photo-1503376780353-7e6692767b70'),
                        $u('photo-1549317661-bd32c8ce0db2'),
                    ],
                ],
                [
                    'name' => 'Honda Civic 2019 Sport',
                    'brand' => 'Honda',
                    'price' => 92000,
                    'condition' => 'used',
                    'images' => [
                        $u('photo-1552519507-da3b142c6e3d'),
                        $u('photo-1583121274602-3e2820c69888'),
                    ],
                ],
            ],
            'mini-trucks' => [
                [
                    'name' => 'Suzuki Carry Mini Truck 2017',
                    'brand' => 'Suzuki',
                    'price' => 54000,
                    'images' => [
                        $u('photo-1601584115197-04ecc1da58d8'),
                        $u('photo-1519003722824-194d4455a60c'),
                    ],
                ],
                [
                    'name' => 'Toyota LiteAce Pickup',
                    'brand' => 'Toyota',
                    'price' => 61000,
                    'images' => [
                        $u('photo-1591768793355-74d04bbadc8e'),
                        $u('photo-1566576912321-d58ddd7a6088'),
                    ],
                ],
            ],
            'vans' => [
                [
                    'name' => 'Toyota HiAce Commuter Van',
                    'brand' => 'Toyota',
                    'price' => 128000,
                    'images' => [
                        $u('photo-1544620341-3e2789181968'),
                        $u('photo-1464219789935-c2d9d9aba644'),
                    ],
                ],
                [
                    'name' => 'Nissan Urvan Cargo Van',
                    'brand' => 'Nissan',
                    'price' => 98000,
                    'images' => [
                        $u('photo-1527786356703-4b100091cd2c'),
                        $u('photo-1558618666-fcd25c85cd64'),
                    ],
                ],
            ],
            'motorcycles' => [
                [
                    'name' => 'Yamaha YBR 125 Street Bike',
                    'brand' => 'Yamaha',
                    'price' => 9800,
                    'images' => [
                        $u('photo-1558981806-ec54e32f0c38'),
                        $u('photo-1558611848-73f7eb4001a1'),
                    ],
                ],
                [
                    'name' => 'Honda CG 125 Delivery Bike',
                    'brand' => 'Honda',
                    'price' => 8500,
                    'images' => [
                        $u('photo-1568772585407-9361f9bf3a87'),
                        $u('photo-1449426468159-d96dbf08f19f'),
                    ],
                ],
            ],
            'bicycles' => [
                [
                    'name' => 'Giant Escape City Bicycle',
                    'brand' => 'Giant',
                    'price' => 2200,
                    'images' => [
                        $u('photo-1485965120184-e220f721d03e'),
                        $u('photo-1571068316344-75bc76f77890'),
                    ],
                ],
                [
                    'name' => 'Trek Marlin Mountain Bike',
                    'brand' => 'Trek',
                    'price' => 3100,
                    'images' => [
                        $u('photo-1511994298241-608e28f14f59'),
                        $u('photo-1507035895480-2b3156c31fc8'),
                    ],
                ],
            ],
            'auto-parts' => [
                [
                    'name' => 'OEM Brake Pad Set (Front)',
                    'brand' => 'Bosch',
                    'price' => 480,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1486262715619-5773291c4e0f'),
                        $u('photo-1492144534655-ae79c964c9d7'),
                    ],
                ],
                [
                    'name' => 'Performance Air Filter Kit',
                    'brand' => 'K&N',
                    'price' => 320,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1619642751034-765dfdf7c58e'),
                        $u('photo-1487759806021-d4c4a5f1f8d4'),
                    ],
                ],
            ],
            'engines' => [
                [
                    'name' => 'Toyota 1NZ-FE Complete Engine',
                    'brand' => 'Toyota',
                    'price' => 14500,
                    'images' => [
                        $u('photo-1558618666-fcd25c85cd64'),
                        $u('photo-1486262715619-5773291c4e0f'),
                    ],
                ],
                [
                    'name' => 'Honda D15B Reconditioned Engine',
                    'brand' => 'Honda',
                    'price' => 11200,
                    'images' => [
                        $u('photo-1619642751034-765dfdf7c58e'),
                        $u('photo-1503376780353-7e6692767b70'),
                    ],
                ],
            ],
            'gearboxes' => [
                [
                    'name' => 'Toyota Automatic Transmission Aisin',
                    'brand' => 'Aisin',
                    'price' => 8900,
                    'images' => [
                        $u('photo-1487759806021-d4c4a5f1f8d4'),
                        $u('photo-1486262715619-5773291c4e0f'),
                    ],
                ],
                [
                    'name' => 'Manual 5-Speed Gearbox Assembly',
                    'brand' => 'Getrag',
                    'price' => 6400,
                    'images' => [
                        $u('photo-1619642751034-765dfdf7c58e'),
                        $u('photo-1558618666-fcd25c85cd64'),
                    ],
                ],
            ],
            'wheels-tires' => [
                [
                    'name' => 'Michelin Primacy 205/55R16 Set of 4',
                    'brand' => 'Michelin',
                    'price' => 2800,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1558617332-c70ce2b0a3b6'),
                        $u('photo-1578844251758-2f71da9c3f86'),
                    ],
                ],
                [
                    'name' => 'Alloy Rim 16" Gunmetal Pair',
                    'brand' => 'Enkei',
                    'price' => 1950,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1615900119312-2acd3c0f3d3b'),
                        $u('photo-1511919884225-912b8c0e5f7b'),
                    ],
                ],
            ],
            'batteries' => [
                [
                    'name' => 'Bosch S4 Car Battery 60Ah',
                    'brand' => 'Bosch',
                    'price' => 780,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1593941707882-a5bba14938c7'),
                        $u('photo-1620712943543-bcc4688e7485'),
                    ],
                ],
                [
                    'name' => 'Amaron Go 12V Automotive Battery',
                    'brand' => 'Amaron',
                    'price' => 650,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1609599006353-e629aaabfeae'),
                        $u('photo-1593941707874-ef25a8d4eef5'),
                    ],
                ],
            ],
            'excavators' => [
                [
                    'name' => 'Komatsu PC200 Excavator',
                    'brand' => 'Komatsu',
                    'price' => 485000,
                    'images' => [
                        $u('photo-1581094794329-c8112a89af12'),
                        $u('photo-1504307651254-35680f356dfd'),
                    ],
                ],
                [
                    'name' => 'Caterpillar 320D Hydraulic Excavator',
                    'brand' => 'Caterpillar',
                    'price' => 520000,
                    'images' => [
                        $u('photo-1541888946425-d81bb19240f5'),
                        $u('photo-1581092160562-40aa08e78837'),
                    ],
                ],
            ],
            'forklifts' => [
                [
                    'name' => 'Toyota 3-Ton Diesel Forklift',
                    'brand' => 'Toyota',
                    'price' => 95000,
                    'images' => [
                        $u('photo-1586528116311-ad8dd3c8310d'),
                        $u('photo-1566576912321-d58ddd7a6088'),
                    ],
                ],
                [
                    'name' => 'Hangcha Electric Forklift 2.5T',
                    'brand' => 'Hangcha',
                    'price' => 78000,
                    'images' => [
                        $u('photo-1587293852726-70cdb56c2866'),
                        $u('photo-1601584115197-04ecc1da58d8'),
                    ],
                ],
            ],
            'generators' => [
                [
                    'name' => 'Perkins 50kVA Diesel Generator',
                    'brand' => 'Perkins',
                    'price' => 68500,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1473341304170-971dccb5ac1e'),
                        $u('photo-1621905251189-08b45d6a269e'),
                    ],
                ],
                [
                    'name' => 'Honda EU70is Portable Generator',
                    'brand' => 'Honda',
                    'price' => 24500,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1558449028-b53a0e118c3d'),
                        $u('photo-1509391366360-2e959784a276'),
                    ],
                ],
            ],
            'compressors' => [
                [
                    'name' => 'Atlas Copco Screw Compressor',
                    'brand' => 'Atlas Copco',
                    'price' => 42000,
                    'images' => [
                        $u('photo-1581092162384-8987c1d64718'),
                        $u('photo-1565043589221-1a6fd9ae45c7'),
                    ],
                ],
                [
                    'name' => 'Ingersoll Rand Air Compressor 10HP',
                    'brand' => 'Ingersoll Rand',
                    'price' => 18500,
                    'images' => [
                        $u('photo-1581092918056-0c4c3acd3789'),
                        $u('photo-1581092160562-40aa08e78837'),
                    ],
                ],
            ],
            'construction-equipment' => [
                [
                    'name' => 'Concrete Mixer 350L Diesel',
                    'brand' => 'Winget',
                    'price' => 12500,
                    'images' => [
                        $u('photo-1504307651254-35680f356dfd'),
                        $u('photo-1541888946425-d81bb19240f5'),
                    ],
                ],
                [
                    'name' => 'Plate Compactor Vibratory',
                    'brand' => 'Wacker Neuson',
                    'price' => 6800,
                    'images' => [
                        $u('photo-1581094794329-c8112a89af12'),
                        $u('photo-1581092162384-8987c1d64718'),
                    ],
                ],
            ],
            'agricultural-machinery' => [
                [
                    'name' => 'John Deere Compact Tractor',
                    'brand' => 'John Deere',
                    'price' => 185000,
                    'images' => [
                        $u('photo-1625246333195-78d9c38ad449'),
                        $u('photo-1574943320219-553eb213f72d'),
                    ],
                ],
                [
                    'name' => 'Mahindra Power Tiller 12HP',
                    'brand' => 'Mahindra',
                    'price' => 18500,
                    'images' => [
                        $u('photo-1464226184884-fa280b87e415'),
                        $u('photo-1500382017468-9049fed747ef'),
                    ],
                ],
            ],
            'outboard-motors' => [
                [
                    'name' => 'Yamaha 40HP 2-Stroke Outboard',
                    'brand' => 'Yamaha',
                    'price' => 28500,
                    'images' => [
                        $u('photo-1544551763-46a013bb70d5'),
                        $u('photo-1567899378494-47b22a2ae96a'),
                    ],
                ],
                [
                    'name' => 'Mercury 15HP 4-Stroke Outboard',
                    'brand' => 'Mercury',
                    'price' => 16200,
                    'images' => [
                        $u('photo-1559827260-dc66d52bef19'),
                        $u('photo-1544551763-77ef2d0cfc6c'),
                    ],
                ],
            ],
            'boats' => [
                [
                    'name' => 'Fiberglass Fishing Boat 18ft',
                    'brand' => 'Nabob Marine',
                    'price' => 45000,
                    'images' => [
                        $u('photo-1567899378494-47b22a2ae96a'),
                        $u('photo-1544551763-46a013bb70d5'),
                    ],
                ],
                [
                    'name' => 'Aluminum Work Boat 16ft',
                    'brand' => 'Lowe',
                    'price' => 32000,
                    'images' => [
                        $u('photo-1559827260-dc66d52bef19'),
                        $u('photo-1500517081416-5c0d8b7f0a0e'),
                    ],
                ],
            ],
            'jet-skis' => [
                [
                    'name' => 'Yamaha WaveRunner VX Cruiser',
                    'brand' => 'Yamaha',
                    'price' => 78000,
                    'images' => [
                        $u('photo-1567899378494-47b22a2ae96a'),
                        $u('photo-1544551763-77ef2d0cfc6c'),
                    ],
                ],
                [
                    'name' => 'Sea-Doo Spark Trixx Jet Ski',
                    'brand' => 'Sea-Doo',
                    'price' => 65000,
                    'images' => [
                        $u('photo-1559827260-dc66d52bef19'),
                        $u('photo-1544551763-46a013bb70d5'),
                    ],
                ],
            ],
            'marine-parts' => [
                [
                    'name' => 'Stainless Propeller 13x19',
                    'brand' => 'Michigan Wheel',
                    'price' => 1450,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1544551763-46a013bb70d5'),
                        $u('photo-1559827260-dc66d52bef19'),
                    ],
                ],
                [
                    'name' => 'Marine Battery Dual Purpose 100Ah',
                    'brand' => 'Optima',
                    'price' => 2100,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1593941707882-a5bba14938c7'),
                        $u('photo-1609599006353-e629aaabfeae'),
                    ],
                ],
            ],
            'furniture' => [
                [
                    'name' => 'Solid Wood Dining Set 6-Seater',
                    'brand' => 'HomeCraft',
                    'price' => 4200,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1555041469-a586c61ea9bc'),
                        $u('photo-1617806118233-18e1de247200'),
                    ],
                ],
                [
                    'name' => 'Linen Sofa 3-Seater Grey',
                    'brand' => 'ComfortHome',
                    'price' => 3800,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1586023492125-27b2c045efd7'),
                        $u('photo-1493663284031-b7e3aefcae8e'),
                    ],
                ],
            ],
            'office-furniture' => [
                [
                    'name' => 'Ergonomic Mesh Office Chair',
                    'brand' => 'Herman Style',
                    'price' => 1250,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1580480055273-228ff5388ef8'),
                        $u('photo-1592078615290-033ee584e267'),
                    ],
                ],
                [
                    'name' => 'Executive Desk Oak Finish',
                    'brand' => 'OfficePro',
                    'price' => 2100,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1518455027359-f3f8164ba6bd'),
                        $u('photo-1497366216548-37526070297c'),
                    ],
                ],
            ],
            'kitchen-equipment' => [
                [
                    'name' => 'Commercial Gas Range 4-Burner',
                    'brand' => 'Imperial',
                    'price' => 5600,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1556911220-bff31c875d0e'),
                        $u('photo-1556909114-f6e7ad7d3136'),
                    ],
                ],
                [
                    'name' => 'Stainless Prep Table 6ft',
                    'brand' => 'KitchenAid Pro',
                    'price' => 2400,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1556909172-54557c7e4fb7'),
                        $u('photo-1565538810643-b5bdb714032a'),
                    ],
                ],
            ],
            'air-conditioners' => [
                [
                    'name' => 'Midea 1.5HP Split Air Conditioner',
                    'brand' => 'Midea',
                    'price' => 3200,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1631545806609-c4450c0f0e3a'),
                        $u('photo-1585771724684-38269d6639fd'),
                    ],
                ],
                [
                    'name' => 'Samsung WindFree 2.0HP Inverter AC',
                    'brand' => 'Samsung',
                    'price' => 5100,
                    'condition' => 'new',
                    'discount' => 4650,
                    'images' => [
                        $u('photo-1631545806609-c4450c0f0e3a'),
                        $u('photo-1558449028-b53a0e118c3d'),
                    ],
                ],
            ],
            'refrigerators' => [
                [
                    'name' => 'Hisense 300L Double Door Fridge',
                    'brand' => 'Hisense',
                    'price' => 3800,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1571175443880-49e1d25b2bc5'),
                        $u('photo-1584568694244-14fbdf83bd30'),
                    ],
                ],
                [
                    'name' => 'Samsung 450L Side-by-Side Fridge',
                    'brand' => 'Samsung',
                    'price' => 7200,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1584568694244-14fbdf83bd30'),
                        $u('photo-1571175443880-49e1d25b2bc5'),
                    ],
                ],
            ],
            'washing-machines' => [
                [
                    'name' => 'LG 7kg Front Load Washer',
                    'brand' => 'LG',
                    'price' => 4100,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1626806787461-74be3b6e6f3a'),
                        $u('photo-1610557892470-55d9e80c0bce'),
                    ],
                ],
                [
                    'name' => 'Samsung 8kg Top Load Washer',
                    'brand' => 'Samsung',
                    'price' => 2950,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1610557892470-55d9e80c0bce'),
                        $u('photo-1626806787461-74be3b6e6f3a'),
                    ],
                ],
            ],
            'tvs' => [
                [
                    'name' => 'Samsung 55" 4K Crystal UHD TV',
                    'brand' => 'Samsung',
                    'price' => 5200,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1593359677879-a4bb92f829d1'),
                        $u('photo-1461151304267-38535e780c79'),
                    ],
                ],
                [
                    'name' => 'LG 65" OLED C3 Smart TV',
                    'brand' => 'LG',
                    'price' => 12500,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1593784991095-a205069470b6'),
                        $u('photo-1593359677879-a4bb92f829d1'),
                    ],
                ],
            ],
            'audio-systems' => [
                [
                    'name' => 'Sony WH-1000XM5 Headphones',
                    'brand' => 'Sony',
                    'price' => 3200,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1505740420928-5e560c06d30e'),
                        $u('photo-1484704849700-f032a568e944'),
                    ],
                ],
                [
                    'name' => 'JBL PartyBox 310 Speaker',
                    'brand' => 'JBL',
                    'price' => 4100,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1608043152269-423dbba4e7e1'),
                        $u('photo-1545454675-3531b543be5d'),
                    ],
                ],
            ],
            'cameras' => [
                [
                    'name' => 'Canon EOS R50 Mirrorless Kit',
                    'brand' => 'Canon',
                    'price' => 7800,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1516035069371-29a1b244cc32'),
                        $u('photo-1502920917128-1aa69837704a'),
                    ],
                ],
                [
                    'name' => 'Sony Alpha a6400 with Lens',
                    'brand' => 'Sony',
                    'price' => 9200,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1502920917128-1aa69837704a'),
                        $u('photo-1516035069371-29a1b244cc32'),
                    ],
                ],
            ],
            'computers' => [
                [
                    'name' => 'Dell OptiPlex Desktop i7 16GB',
                    'brand' => 'Dell',
                    'price' => 5400,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1587831990711-23ca6441447b'),
                        $u('photo-1593640408182-31c70c8268f5'),
                    ],
                ],
                [
                    'name' => 'HP EliteDesk Mini PC Bundle',
                    'brand' => 'HP',
                    'price' => 4800,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1593640408182-31c70c8268f5'),
                        $u('photo-1527443224154-c4a3942d3acf'),
                    ],
                ],
            ],
            'laptops' => [
                [
                    'name' => 'MacBook Air M2 13" 256GB',
                    'brand' => 'Apple',
                    'price' => 14500,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1517336714731-489689fd1ca8'),
                        $u('photo-1496181133206-80ce9b88a853'),
                    ],
                ],
                [
                    'name' => 'Dell XPS 15 OLED Creator Laptop',
                    'brand' => 'Dell',
                    'price' => 16800,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1496181133206-80ce9b88a853'),
                        $u('photo-1541807084-5c52b6b3adef'),
                    ],
                ],
            ],
            'gaming-consoles' => [
                [
                    'name' => 'PlayStation 5 Disc Console',
                    'brand' => 'Sony',
                    'price' => 6200,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1606144042614-b2417e99c4e3'),
                        $u('photo-1621259182978-fbf93132d53d'),
                    ],
                ],
                [
                    'name' => 'Xbox Series X 1TB Bundle',
                    'brand' => 'Microsoft',
                    'price' => 5900,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1621259182978-fbf93132d53d'),
                        $u('photo-1606144042614-b2417e99c4e3'),
                    ],
                ],
            ],
            'smartphones' => [
                [
                    'name' => 'iPhone 15 Pro 256GB Natural Titanium',
                    'brand' => 'Apple',
                    'price' => 14500,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1695048133142-1a20484d2569'),
                        $u('photo-1511707171634-5f897ff02aa9'),
                    ],
                ],
                [
                    'name' => 'Samsung Galaxy S24 Ultra 512GB',
                    'brand' => 'Samsung',
                    'price' => 13200,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1610945415295-d9bbf067e59c'),
                        $u('photo-1598327105666-5b05001aa4bf'),
                    ],
                ],
            ],
            'solar-panels' => [
                [
                    'name' => 'Jinko 550W Mono Solar Panel (x4)',
                    'brand' => 'Jinko',
                    'price' => 4800,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1509391366360-2e959784a276'),
                        $u('photo-1508514177221-188b1cf16e9d'),
                    ],
                ],
                [
                    'name' => 'Canadian Solar 450W Panel Pack',
                    'brand' => 'Canadian Solar',
                    'price' => 3900,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1508514177221-188b1cf16e9d'),
                        $u('photo-1497440001374-f26997328c1b'),
                    ],
                ],
            ],
            'inverters' => [
                [
                    'name' => 'Growatt 5kW Hybrid Inverter',
                    'brand' => 'Growatt',
                    'price' => 8500,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1473341304170-971dccb5ac1e'),
                        $u('photo-1621905251189-08b45d6a269e'),
                    ],
                ],
                [
                    'name' => 'Victron MultiPlus 3kVA Inverter',
                    'brand' => 'Victron',
                    'price' => 11200,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1558449028-b53a0e118c3d'),
                        $u('photo-1509391366360-2e959784a276'),
                    ],
                ],
            ],
            'lithium-batteries' => [
                [
                    'name' => 'Pylontech US3000C 3.5kWh Lithium',
                    'brand' => 'Pylontech',
                    'price' => 9800,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1593941707882-a5bba14938c7'),
                        $u('photo-1620712943543-bcc4688e7485'),
                    ],
                ],
                [
                    'name' => 'BYD Battery-Box Premium LVS',
                    'brand' => 'BYD',
                    'price' => 14500,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1609599006353-e629aaabfeae'),
                        $u('photo-1593941707882-a5bba14938c7'),
                    ],
                ],
            ],
            'ups-systems' => [
                [
                    'name' => 'APC Smart-UPS 1500VA',
                    'brand' => 'APC',
                    'price' => 4200,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1621905251189-08b45d6a269e'),
                        $u('photo-1558449028-b53a0e118c3d'),
                    ],
                ],
                [
                    'name' => 'CyberPower 2000VA Line-Interactive UPS',
                    'brand' => 'CyberPower',
                    'price' => 3100,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1473341304170-971dccb5ac1e'),
                        $u('photo-1620712943543-bcc4688e7485'),
                    ],
                ],
            ],
            'electric-wheelchairs' => [
                [
                    'name' => 'Pride Mobility Jazzy Electric Chair',
                    'brand' => 'Pride',
                    'price' => 18500,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1576091160399-112ba8d25d1d'),
                        $u('photo-1584515933487-779824d29309'),
                    ],
                ],
                [
                    'name' => 'Drive Medical Power Wheelchair',
                    'brand' => 'Drive Medical',
                    'price' => 14200,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1584515933487-779824d29309'),
                        $u('photo-1576091160399-112ba8d25d1d'),
                    ],
                ],
            ],
            'hospital-beds' => [
                [
                    'name' => 'Electric Hospital Bed 3-Function',
                    'brand' => 'Invacare',
                    'price' => 8900,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1519494026892-80bbd2d6fd0d'),
                        $u('photo-1631815588090-d4bfec5b1ccb'),
                    ],
                ],
                [
                    'name' => 'Manual Hospital Bed with Side Rails',
                    'brand' => 'Medline',
                    'price' => 4200,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1631815588090-d4bfec5b1ccb'),
                        $u('photo-1519494026892-80bbd2d6fd0d'),
                    ],
                ],
            ],
            'walking-aids' => [
                [
                    'name' => 'Rollator Walker with Seat',
                    'brand' => 'Drive Medical',
                    'price' => 780,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1576091160550-2173dba07efd'),
                        $u('photo-1584515933487-779824d29309'),
                    ],
                ],
                [
                    'name' => 'Adjustable Aluminum Crutches Pair',
                    'brand' => 'Medline',
                    'price' => 220,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1584515933487-779824d29309'),
                        $u('photo-1576091160550-2173dba07efd'),
                    ],
                ],
            ],
            'medical-equipment' => [
                [
                    'name' => 'Philips Patient Monitor Bundle',
                    'brand' => 'Philips',
                    'price' => 12500,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1581595220892-b0739db3b8c5'),
                        $u('photo-1579684385127-1ef15d508118'),
                    ],
                ],
                [
                    'name' => 'Omron Digital BP Monitor Pro',
                    'brand' => 'Omron',
                    'price' => 450,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1579684385127-1ef15d508118'),
                        $u('photo-1581595220892-b0739db3b8c5'),
                    ],
                ],
            ],
            'fishing-equipment' => [
                [
                    'name' => 'Shimano Spinning Rod & Reel Combo',
                    'brand' => 'Shimano',
                    'price' => 890,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1544551763-46a013bb70d5'),
                        $u('photo-1498654200943-275ca7078888'),
                    ],
                ],
                [
                    'name' => 'Tackle Box Pro Kit with Lures',
                    'brand' => 'Rapala',
                    'price' => 420,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1498654200943-275ca7078888'),
                        $u('photo-1544551763-46a013bb70d5'),
                    ],
                ],
            ],
            'diving-equipment' => [
                [
                    'name' => 'Cressi Scuba Mask & Snorkel Set',
                    'brand' => 'Cressi',
                    'price' => 680,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1544551763-77ef2d0cfc6c'),
                        $u('photo-1559827260-dc66d52bef19'),
                    ],
                ],
                [
                    'name' => 'Mares Dive Fins & Boots Kit',
                    'brand' => 'Mares',
                    'price' => 950,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1559827260-dc66d52bef19'),
                        $u('photo-1544551763-77ef2d0cfc6c'),
                    ],
                ],
            ],
            'camping-gear' => [
                [
                    'name' => 'Coleman 4-Person Dome Tent',
                    'brand' => 'Coleman',
                    'price' => 1450,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1478131143081-80f7f84ca84d'),
                        $u('photo-1504280390367-361c6d9f38f4'),
                    ],
                ],
                [
                    'name' => 'Naturehike Sleeping Bag -5°C',
                    'brand' => 'Naturehike',
                    'price' => 520,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1504280390367-361c6d9f38f4'),
                        $u('photo-1478131143081-80f7f84ca84d'),
                    ],
                ],
            ],
            'cycling-accessories' => [
                [
                    'name' => 'Giro Adult Cycling Helmet',
                    'brand' => 'Giro',
                    'price' => 380,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1558618666-fcd25c85cd64'),
                        $u('photo-1485965120184-e220f721d03e'),
                    ],
                ],
                [
                    'name' => 'Topeak Bike Rear Rack & Panniers',
                    'brand' => 'Topeak',
                    'price' => 560,
                    'condition' => 'new',
                    'images' => [
                        $u('photo-1571068316344-75bc76f77890'),
                        $u('photo-1511994298241-608e28f14f59'),
                    ],
                ],
            ],
        ];
    }
}
