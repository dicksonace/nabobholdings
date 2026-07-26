<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStoreSetupComplete
{
    /** @var list<string> */
    protected array $except = [
        'manage.store-setup',
        'manage.store-appearance.index',
        'manage.store-appearance.draft',
        'manage.store-appearance.publish',
        'manage.store-appearance.reset',
        'manage.store-appearance.complete-setup',
        'logout',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if (in_array($request->route()?->getName(), $this->except, true)) {
            return $next($request);
        }

        $profile = $request->user()?->sellerProfile;
        $customization = $profile?->storeCustomization;

        if (! $customization || ! $customization->isSetupComplete()) {
            return redirect()->route('manage.store-setup');
        }

        return $next($request);
    }
}
