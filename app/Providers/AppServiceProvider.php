<?php

namespace App\Providers;

use App\Models\ProductImage;
use App\Observers\ProductImageObserver;
use App\Services\PlatformSettings;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Throwable;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ProductImage::observe(ProductImageObserver::class);

        // Single source of truth: the admin-editable brand name drives config('app.name'),
        // which feeds the page <title>, mail "from" name, and every backend brand reference.
        // Guarded so console/migration/no-DB boots never fail.
        try {
            config(['app.name' => PlatformSettings::brandName()]);
        } catch (Throwable) {
            // Settings table not available yet (e.g. first migration) — keep the env default.
        }

        // In production the site is always served over HTTPS (behind an SSL proxy),
        // so force every generated URL — shared store links, seller invite links,
        // and emailed links — to use https instead of falling back to http.
        if ($this->app->environment('production')) {
            URL::forceScheme('https');

            $appUrl = (string) config('app.url');
            if (str_starts_with($appUrl, 'https://')) {
                URL::forceRootUrl($appUrl);
            }
        }
    }
}
