<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Services\ProductDiscoveryService;
use App\Support\InfiniteScroll;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(private ProductDiscoveryService $discovery) {}

    public function index(Request $request): Response|RedirectResponse|JsonResponse
    {
        if ($seed = $this->discovery->needsRandomSeedRedirect($request)) {
            return redirect()->route('home', array_merge($request->query(), ['seed' => $seed]));
        }

        $query = Product::with(['images', 'seller.sellerProfile', 'category'])
            ->visibleInShop();

        $search = trim((string) ($request->get('search') ?: $request->get('q', '')));

        if ($search !== '') {
            $this->discovery->applySearch($query, $search);
        }

        if ($category = $request->get('category')) {
            $categoryId = (int) $category;
            $childIds = Category::where('parent_id', $categoryId)->pluck('id')->all();
            $query->whereIn('category_id', array_values(array_unique([$categoryId, ...$childIds])));
        }

        if ($brand = $request->get('brand')) {
            $query->whereRaw('LOWER(brand) = ?', [mb_strtolower((string) $brand)]);
        }

        if ($request->filled('price_min')) {
            $query->whereRaw('COALESCE(discount_price, price) >= ?', [(float) $request->price_min]);
        }

        if ($request->filled('price_max')) {
            $query->whereRaw('COALESCE(discount_price, price) <= ?', [(float) $request->price_max]);
        }

        if ($rating = $request->get('rating')) {
            $query->where('rating', '>=', (float) $rating);
        }

        if ($request->boolean('in_ghana')) {
            $query->where('in_ghana', true);
        }

        if ($request->boolean('free_ship')) {
            $query->where('free_shipping', true);
        }

        if ($request->boolean('on_sale')) {
            $query->whereNotNull('discount_price')->whereColumn('discount_price', '<', 'price');
        }

        // Legacy quick-filter support
        match ($request->get('filter')) {
            'in_ghana' => $query->where('in_ghana', true),
            'free_ship' => $query->where('free_shipping', true),
            'on_sale' => $query->whereNotNull('discount_price')->whereColumn('discount_price', '<', 'price'),
            default => null,
        };

        $sort = $request->get('sort', $search !== '' ? 'relevance' : 'recommended');
        $rankingSeed = $this->discovery->resolveRandomSeed($request);
        $this->discovery->applySort($query, $sort, $rankingSeed, $request->user());

        $products = $query->paginate(20)->withQueryString();

        if (InfiniteScroll::wants($request)) {
            return InfiniteScroll::json($products);
        }

        $priceStats = Product::visibleInShop()
            ->selectRaw('MIN(COALESCE(discount_price, price)) as min_price, MAX(COALESCE(discount_price, price)) as max_price')
            ->first();

        $allCategories = Category::where('is_active', true)
            ->with(['children' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')->orderBy('name')])
            ->withCount(['products' => fn ($q) => $q->visibleInShop()])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $childProductCounts = Product::visibleInShop()
            ->selectRaw('category_id, COUNT(*) as aggregate')
            ->groupBy('category_id')
            ->pluck('aggregate', 'category_id');

        $categories = $allCategories
            ->map(function (Category $category) use ($childProductCounts) {
                $direct = (int) ($childProductCounts[$category->id] ?? $category->products_count ?? 0);
                $nested = $category->children->sum(fn (Category $child) => (int) ($childProductCounts[$child->id] ?? 0));
                $category->setAttribute('products_count', $direct + $nested);

                return $category;
            })
            ->filter(fn (Category $c) => $c->products_count > 0 || $c->children->isNotEmpty())
            ->values();

        // Prefer top-level groups for shop filters/shortcuts; include leaf categories that have stock.
        $filterCategories = $categories
            ->filter(fn (Category $c) => $c->parent_id === null)
            ->values();

        if ($filterCategories->isEmpty()) {
            $filterCategories = $categories;
        }

        $brands = Product::visibleInShop()
            ->whereNotNull('brand')
            ->where('brand', '!=', '')
            ->selectRaw('brand, COUNT(*) as count')
            ->groupBy('brand')
            ->orderBy('brand')
            ->get();

        $hasActiveFilters = $search !== ''
            || $request->filled('category')
            || $request->filled('brand')
            || $request->filled('price_min')
            || $request->filled('price_max')
            || $request->filled('rating')
            || $request->boolean('in_ghana')
            || $request->boolean('free_ship')
            || $request->boolean('on_sale');

        $categoryShelves = collect();
        if (! $hasActiveFilters) {
            $categoryShelves = $filterCategories->take(4)->map(function (Category $category) {
                $ids = [$category->id, ...$category->children->pluck('id')->all()];

                $shelfProducts = Product::with(['images', 'seller.sellerProfile', 'category'])
                    ->visibleInShop()
                    ->whereIn('category_id', $ids)
                    ->orderByDesc('purchase_count')
                    ->orderByDesc('views')
                    ->limit(8)
                    ->get();

                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'products_count' => $category->products_count,
                    'products' => $shelfProducts,
                ];
            })->filter(fn (array $shelf) => count($shelf['products']) > 0)->values();
        }

        return Inertia::render('shop/home', [
            'products' => $products,
            'categories' => $filterCategories->map(fn (Category $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'products_count' => $c->products_count,
                'icon' => $c->icon,
            ])->values(),
            'brands' => $brands,
            'categoryShelves' => $categoryShelves,
            'priceRange' => [
                'min' => (float) ($priceStats->min_price ?? 0),
                'max' => (float) ($priceStats->max_price ?? 10000),
            ],
            'filters' => [
                'search' => $request->get('search') ?: $request->get('q', ''),
                'category' => $request->get('category', ''),
                'brand' => $request->get('brand', ''),
                'price_min' => $request->get('price_min', ''),
                'price_max' => $request->get('price_max', ''),
                'rating' => $request->get('rating', ''),
                'in_ghana' => $request->boolean('in_ghana'),
                'free_ship' => $request->boolean('free_ship'),
                'on_sale' => $request->boolean('on_sale'),
                'sort' => $sort,
                'seed' => $rankingSeed ?? $request->get('seed', ''),
            ],
            'counts' => [
                'in_ghana' => Product::visibleInShop()->where('in_ghana', true)->count(),
                'free_ship' => Product::visibleInShop()->where('free_shipping', true)->count(),
                'total' => Product::visibleInShop()->count(),
            ],
            'hasSaleProducts' => Product::visibleInShop()->whereNotNull('discount_price')->whereColumn('discount_price', '<', 'price')->exists(),
            'heroSlides' => [
                ['title' => 'Shop Nabob Holdings', 'subtitle' => 'Quality products from our store — delivered to your doorstep.', 'accent' => 'from-[#0f2744] to-[#1e3a5f]'],
                ['title' => 'Shop the Best Deals', 'subtitle' => 'Electronics, fashion, and more — carefully selected for you.', 'accent' => 'from-[#152a45] to-[#d97706]'],
                ['title' => 'Buy with Confidence', 'subtitle' => 'Secure payments, order tracking, and support on every purchase.', 'accent' => 'from-[#0f2744] via-[#243b53] to-[#b45309]'],
            ],
        ]);
    }

    public function matchesForRecentViews(Request $request): JsonResponse
    {
        $rawIds = $request->query('ids', []);

        if (is_string($rawIds)) {
            $rawIds = array_filter(explode(',', $rawIds));
        } elseif (! is_array($rawIds)) {
            $rawIds = [];
        }

        $ids = array_slice(array_values(array_unique(array_map('intval', $rawIds))), 0, 20);

        $products = $this->discovery->matchesForRecentViews($ids, $request->user(), 12);

        $categoryIds = $products
            ->pluck('category_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $sellerCounts = $this->discovery->sellerCountsByCategory($categoryIds);

        $payload = $products->map(function (Product $product) use ($sellerCounts) {
            $categoryId = $product->category_id ? (int) $product->category_id : null;

            return [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'price' => (float) $product->price,
                'discount_price' => $product->discount_price !== null ? (float) $product->discount_price : null,
                'images' => $product->images,
                'category_id' => $categoryId,
                'sellers_in_category' => $categoryId ? ($sellerCounts[$categoryId] ?? 1) : 1,
            ];
        })->values();

        return response()->json(['products' => $payload]);
    }
}
