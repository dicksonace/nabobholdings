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
            'currency' => PlatformSettings::currency(),
            'contact' => PlatformSettings::contact(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'logo' => ['nullable', 'image', 'max:5120'],
            'remove_logo' => ['boolean'],
            'currency_code' => ['required', 'string', 'max:10'],
            'currency_symbol' => ['required', 'string', 'max:8'],
            'contact_address' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:40'],
            'contact_email' => ['nullable', 'email', 'max:120'],
        ]);

        PlatformSettings::set(PlatformSettings::BRAND_NAME_KEY, trim($validated['name']));
        PlatformSettings::set(PlatformSettings::CURRENCY_CODE_KEY, strtoupper(trim($validated['currency_code'])));
        PlatformSettings::set(PlatformSettings::CURRENCY_SYMBOL_KEY, trim($validated['currency_symbol']));
        PlatformSettings::set(PlatformSettings::CONTACT_ADDRESS_KEY, trim($validated['contact_address'] ?? ''));
        PlatformSettings::set(PlatformSettings::CONTACT_PHONE_KEY, trim($validated['contact_phone'] ?? ''));
        PlatformSettings::set(PlatformSettings::CONTACT_EMAIL_KEY, trim($validated['contact_email'] ?? ''));

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
