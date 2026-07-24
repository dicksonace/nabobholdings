<?php

namespace Database\Seeders;

use App\Enums\ProductStatus;
use App\Enums\SellerStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\SellerProfile;
use App\Models\User;
use App\Models\Wallet;
use App\Services\CategorySpecService;
use App\Services\StoreCustomizationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Creates one approved showcase seller and 10 products, each with several
 * gallery sub-images and a realistic view count so the storefront and the
 * product detail page have rich demo data to display.
 */
class SellerShowcaseSeeder extends Seeder
{
    private const SELLER_EMAIL = 'showcase.seller@nabobholdings.com';

    /**
     * @var array<int, array{name: string, category: string, brand: string, price: float}>
     */
    private array $products = [
        ['name' => 'Sony WH-1000XM5 Wireless Headphones', 'category' => 'electronics', 'brand' => 'Sony', 'price' => 3200],
        ['name' => 'Apple iPhone 15 Pro Max 256GB', 'category' => 'phones-tablets', 'brand' => 'Apple', 'price' => 18500],
        ['name' => 'Dell XPS 13 Plus Laptop', 'category' => 'computers', 'brand' => 'Dell', 'price' => 15900],
        ['name' => 'Samsung 55" 4K QLED Smart TV', 'category' => 'appliances', 'brand' => 'Samsung', 'price' => 9800],
        ['name' => 'JBL Flip 6 Portable Speaker', 'category' => 'electronics', 'brand' => 'JBL', 'price' => 1450],
        ['name' => 'Nike Air Zoom Pegasus 40 Sneakers', 'category' => 'sports', 'brand' => 'Nike', 'price' => 1200],
        ['name' => "Men's Premium Ankara Print Shirt", 'category' => 'fashion', 'brand' => 'AfroWear', 'price' => 280],
        ['name' => 'Philips Air Fryer XXL 7.3L', 'category' => 'appliances', 'brand' => 'Philips', 'price' => 2100],
        ['name' => 'Anker 737 Power Bank 24000mAh', 'category' => 'electronics', 'brand' => 'Anker', 'price' => 890],
        ['name' => 'Logitech MX Master 3S Mouse', 'category' => 'electronics', 'brand' => 'Logitech', 'price' => 720],
    ];

    public function run(): void
    {
        $seller = $this->ensureSeller();

        foreach ($this->products as $definition) {
            $this->createProduct($seller, $definition);
        }

        $this->command?->info('Showcase seller ready with '.$seller->products()->count().' products.');
    }

    private function ensureSeller(): User
    {
        $seller = User::firstOrCreate(
            ['email' => self::SELLER_EMAIL],
            [
                'name' => 'Nabob Showcase Store',
                'first_name' => 'Nabob',
                'last_name' => 'Showcase',
                'mobile' => '0246000010',
                'whatsapp' => '0246000010',
                'password' => Hash::make('password'),
                'role' => UserRole::Seller,
                'region' => 'Greater Accra',
                'city' => 'Accra',
            ],
        );

        if ($seller->role !== UserRole::Seller) {
            $seller->update(['role' => UserRole::Seller]);
        }

        $admin = User::where('role', UserRole::Admin)->first();

        $profile = SellerProfile::firstOrCreate(
            ['user_id' => $seller->id],
            [
                'store_name' => 'Nabob Showcase Store',
                'business_name' => 'Nabob Showcase Store',
                'is_business_registered' => true,
                'store_description' => 'Handpicked electronics, fashion and home essentials with fast, reliable delivery.',
                'status' => SellerStatus::Approved,
                'approved_at' => now(),
                'approved_by' => $admin?->id,
                'rating' => 4.8,
                'total_sales' => 0,
                'accept_marketplace_payments' => true,
            ],
        );

        if ($profile->status !== SellerStatus::Approved) {
            $profile->update(['status' => SellerStatus::Approved, 'approved_at' => now()]);
        }

        $customizationService = app(StoreCustomizationService::class);
        $customization = $customizationService->forProfile($profile->fresh());
        if (! $customization->isSetupComplete()) {
            $customizationService->completeSetup($customization);
        }

        Wallet::firstOrCreate(['user_id' => $seller->id]);

        return $seller;
    }

    /**
     * @param  array{name: string, category: string, brand: string, price: float}  $definition
     */
    private function createProduct(User $seller, array $definition): void
    {
        $category = $this->resolveCategory($definition['category']);

        $product = Product::firstOrCreate(
            ['seller_id' => $seller->id, 'slug' => Str::slug($definition['name'])],
            [
                'category_id' => $category->id,
                'name' => $definition['name'],
                'description' => $this->description($definition['name']),
                'specifications' => CategorySpecService::generateSpecs($category->slug),
                'brand' => $definition['brand'],
                'price' => $definition['price'],
                'discount_price' => random_int(0, 100) <= 40
                    ? round($definition['price'] * (random_int(80, 93) / 100), 2)
                    : null,
                'quantity' => random_int(8, 60),
                'condition' => 'new',
                'status' => ProductStatus::Approved,
                'is_preorder' => false,
                'free_shipping' => random_int(0, 100) <= 55,
                'in_ghana' => true,
                'ships_nationwide' => true,
                'rating' => round(random_int(40, 50) / 10, 1),
                'review_count' => random_int(5, 140),
                'views' => random_int(120, 5200),
                'cart_adds' => random_int(5, 300),
                'wishlist_adds' => random_int(3, 180),
                'purchase_count' => random_int(0, 90),
            ],
        );

        if ($product->images()->count() === 0) {
            $imageCount = random_int(3, 5);
            for ($i = 0; $i < $imageCount; $i++) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'path' => "https://picsum.photos/seed/{$product->slug}-{$i}/800/800",
                    'is_primary' => $i === 0,
                    'sort_order' => $i,
                ]);
            }
        }
    }

    private function resolveCategory(string $slug): Category
    {
        return Category::firstOrCreate(
            ['slug' => $slug],
            [
                'name' => Str::title(str_replace('-', ' ', $slug)),
                'is_active' => true,
            ],
        );
    }

    private function description(string $name): string
    {
        return "The {$name} is a top pick on Nabob Holdings — genuine, quality-checked, "
            .'and backed by our verified seller guarantee. Enjoy fast delivery, secure '
            .'payment, and responsive after-sales support on every order.';
    }
}
