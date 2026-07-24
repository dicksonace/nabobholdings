<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\PlatformSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BrandSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/brand/settings', [
            'brand' => PlatformSettings::brand(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'logo' => ['nullable', 'image', 'max:5120'],
            'remove_logo' => ['boolean'],
        ]);

        PlatformSettings::set(PlatformSettings::BRAND_NAME_KEY, trim($validated['name']));

        $currentLogo = PlatformSettings::brandLogoPath();

        if ($request->boolean('remove_logo')) {
            if ($currentLogo) {
                Storage::disk('public')->delete($currentLogo);
            }
            PlatformSettings::set(PlatformSettings::BRAND_LOGO_KEY, '');
        } elseif ($request->hasFile('logo')) {
            if ($currentLogo) {
                Storage::disk('public')->delete($currentLogo);
            }
            $path = $request->file('logo')->store('brand', 'public');
            PlatformSettings::set(PlatformSettings::BRAND_LOGO_KEY, $path);
        }

        return back()->with('success', 'Brand settings saved.');
    }
}
