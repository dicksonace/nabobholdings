<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $base = rtrim(config('app.url'), '/');

        $urls = [
            ['loc' => $base.'/', 'changefreq' => 'daily', 'priority' => '1.0'],
            ['loc' => $base.'/contact', 'changefreq' => 'monthly', 'priority' => '0.5'],
            ['loc' => $base.'/faq', 'changefreq' => 'monthly', 'priority' => '0.5'],
        ];

        Category::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'updated_at'])
            ->each(function (Category $category) use (&$urls, $base) {
                $urls[] = [
                    'loc' => $base.'/?category='.$category->id,
                    'lastmod' => optional($category->updated_at)?->toAtomString(),
                    'changefreq' => 'daily',
                    'priority' => '0.7',
                ];
            });

        Product::visibleInShop()
            ->orderByDesc('updated_at')
            ->limit(2000)
            ->get(['slug', 'updated_at'])
            ->each(function (Product $product) use (&$urls, $base) {
                $urls[] = [
                    'loc' => $base.'/products/'.$product->slug,
                    'lastmod' => optional($product->updated_at)?->toAtomString(),
                    'changefreq' => 'weekly',
                    'priority' => '0.8',
                ];
            });

        $xml = view('sitemap', ['urls' => $urls])->render();

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
        ]);
    }
}
