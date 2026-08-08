<?php

namespace App\Services;

use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class PlatformSettings
{
    public const FUNDING_ACCOUNTS_KEY = 'manual_funding_accounts';

    public const BRAND_NAME_KEY = 'brand_name';

    public const BRAND_LOGO_KEY = 'brand_logo';

    public const CURRENCY_CODE_KEY = 'currency_code';

    public const CURRENCY_SYMBOL_KEY = 'currency_symbol';

    public const DEFAULT_CURRENCY_CODE = 'LKR';

    public const DEFAULT_CURRENCY_SYMBOL = 'Rs';

    public const CONTACT_ADDRESS_KEY = 'contact_address';

    public const CONTACT_PHONE_KEY = 'contact_phone';

    public const CONTACT_EMAIL_KEY = 'contact_email';

    public const DEFAULT_CONTACT_ADDRESS = 'No.204/2/A, Gramasanwardhana Mawatha, Kiula, Hungama, Ambalantota';

    public const DEFAULT_CONTACT_PHONE = '+94 70 321 7775';

    /**
     * The single source of truth for the site brand name.
     * Falls back to config/app.name (seeded from the APP_NAME env var).
     */
    public static function brandName(): string
    {
        $name = static::get(self::BRAND_NAME_KEY);
        $name = is_string($name) ? trim($name) : '';

        return $name !== '' ? $name : (string) config('app.name', 'Nabob Holdings');
    }

    /**
     * Stored disk path of the uploaded brand logo (public disk), or null for the text logo.
     */
    public static function brandLogoPath(): ?string
    {
        $path = static::get(self::BRAND_LOGO_KEY);

        return is_string($path) && trim($path) !== '' ? $path : null;
    }

    public static function brandLogoUrl(): ?string
    {
        $path = static::brandLogoPath();

        return $path ? Storage::disk('public')->url($path) : null;
    }

    /**
     * Brand payload shared with every page (name + optional logo url).
     *
     * @return array{name: string, logo: ?string}
     */
    public static function brand(): array
    {
        return [
            'name' => static::brandName(),
            'logo' => static::brandLogoUrl(),
            'tagline' => 'Your trusted online store — quality products, secure payments, and delivery across Sri Lanka.',
        ];
    }

    /**
     * Published owner-store theme colors for the main shop chrome.
     *
     * @return array{primary_color: string, secondary_color: string, background_color: string, text_color: string}
     */
    public static function siteTheme(): array
    {
        $fallback = [
            'primary_color' => '#0f2744',
            'secondary_color' => '#d97706',
            'background_color' => '#ffffff',
            'text_color' => '#111827',
        ];

        try {
            $admin = \App\Models\User::query()
                ->where('email', 'admin@nabobholdings.com')
                ->orWhere('role', \App\Enums\UserRole::Admin)
                ->first();

            $customization = $admin?->sellerProfile?->storeCustomization;
            if (! $customization) {
                return $fallback;
            }

            $theme = app(StoreCustomizationService::class)->publishedSettings($customization)['theme'] ?? [];

            return [
                'primary_color' => (string) ($theme['primary_color'] ?? $fallback['primary_color']),
                'secondary_color' => (string) ($theme['secondary_color'] ?? $fallback['secondary_color']),
                'background_color' => (string) ($theme['background_color'] ?? $fallback['background_color']),
                'text_color' => (string) ($theme['text_color'] ?? $fallback['text_color']),
            ];
        } catch (\Throwable) {
            return $fallback;
        }
    }

    /**
     * The ISO-style currency code shown across the app (e.g. USD, GHS, NGN).
     */
    public static function currencyCode(): string
    {
        $code = static::get(self::CURRENCY_CODE_KEY);
        $code = is_string($code) ? strtoupper(trim($code)) : '';

        return $code !== '' ? $code : self::DEFAULT_CURRENCY_CODE;
    }

    /**
     * The currency symbol prefixed to every amount (e.g. $, GH₵, ₦).
     */
    public static function currencySymbol(): string
    {
        $symbol = static::get(self::CURRENCY_SYMBOL_KEY);
        $symbol = is_string($symbol) ? trim($symbol) : '';

        return $symbol !== '' ? $symbol : self::DEFAULT_CURRENCY_SYMBOL;
    }

    /**
     * Currency payload shared with every page.
     *
     * @return array{code: string, symbol: string}
     */
    public static function currency(): array
    {
        return [
            'code' => static::currencyCode(),
            'symbol' => static::currencySymbol(),
        ];
    }

    /**
     * Format an amount with the configured currency symbol, e.g. "$1,200.00".
     */
    public static function formatMoney(float|int|string $amount): string
    {
        return static::currencySymbol().number_format((float) $amount, 2);
    }

    /**
     * Public company address shown in the footer and contact page.
     */
    public static function contactAddress(): string
    {
        $value = static::get(self::CONTACT_ADDRESS_KEY);
        $value = is_string($value) ? trim($value) : '';

        return $value !== '' ? $value : self::DEFAULT_CONTACT_ADDRESS;
    }

    /**
     * Public company phone number shown in the footer and contact page.
     */
    public static function contactPhone(): string
    {
        $value = static::get(self::CONTACT_PHONE_KEY);
        $value = is_string($value) ? trim($value) : '';

        return $value !== '' ? $value : self::DEFAULT_CONTACT_PHONE;
    }

    /**
     * Public support email shown in the footer and contact page.
     */
    public static function contactEmail(): string
    {
        $value = static::get(self::CONTACT_EMAIL_KEY);
        $value = is_string($value) ? trim($value) : '';

        if ($value !== '') {
            return $value;
        }

        $fallback = config('mail.from.address');

        return is_string($fallback) && trim($fallback) !== ''
            ? trim($fallback)
            : (string) config('marketplace.contact.email', 'support@nabobholdings.com');
    }

    /**
     * Contact payload shared with every page (address + phone + email).
     *
     * @return array{address: string, phone: string, email: string}
     */
    public static function contact(): array
    {
        return [
            'address' => static::contactAddress(),
            'phone' => static::contactPhone(),
            'email' => static::contactEmail(),
        ];
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return Cache::remember("platform_setting.{$key}", 3600, function () use ($key, $default) {
            $setting = PlatformSetting::where('key', $key)->first();

            return $setting?->value ?? $default;
        });
    }

    public static function set(string $key, mixed $value): void
    {
        PlatformSetting::updateOrCreate(
            ['key' => $key],
            ['value' => is_array($value) || is_object($value) ? json_encode($value) : (string) $value],
        );

        Cache::forget("platform_setting.{$key}");
    }

    public static function commissionRate(): float
    {
        return (float) static::get('commission_rate', 0);
    }

    /**
     * @return array{
     *   enabled: bool,
     *   instructions: string,
     *   accounts: list<array<string, mixed>>
     * }
     */
    public static function manualFundingAccounts(): array
    {
        $raw = static::get(self::FUNDING_ACCOUNTS_KEY);
        $decoded = is_array($raw)
            ? $raw
            : (is_string($raw) ? json_decode($raw, true) : null);

        if (! is_array($decoded)) {
            return [
                'enabled' => false,
                'instructions' => 'Send payment to one of the accounts below, then submit your proof and reference so we can credit your wallet.',
                'accounts' => [],
            ];
        }

        $accounts = array_values(array_map(function ($account) {
            if (! is_array($account)) {
                return null;
            }

            $type = ($account['type'] ?? '') === 'bank' ? 'bank' : 'momo';
            $accountNumber = (string) ($account['account_number'] ?? '');
            $accountName = (string) ($account['account_name'] ?? '');

            // Nabob Holdings receive numbers should always show business + Robert Asare.
            $canonical = static::nabobReceiveAccountName($accountNumber);
            if ($canonical !== null) {
                $accountName = $canonical;
            }

            return [
                'type' => $type,
                'label' => (string) ($account['label'] ?? ''),
                'account_name' => $accountName,
                'account_number' => $accountNumber,
                'network' => $type === 'momo'
                    ? (static::normalizeMomoNetwork($account['network'] ?? null) ?? 'mtn')
                    : null,
                'bank_name' => $type === 'bank' ? ($account['bank_name'] ?? null) : null,
            ];
        }, $decoded['accounts'] ?? []));

        $accounts = array_values(array_filter($accounts));
        $accounts = static::ensureNabobMomoAccounts($accounts);

        return [
            'enabled' => (bool) ($decoded['enabled'] ?? false),
            'instructions' => (string) ($decoded['instructions'] ?? ''),
            'accounts' => $accounts,
        ];
    }

    /**
     * Canonical MoMo account name for Nabob Holdings’s public receive numbers.
     */
    public static function nabobReceiveAccountName(string $accountNumber): ?string
    {
        $digits = preg_replace('/\D+/', '', $accountNumber) ?? '';

        return match ($digits) {
            '0539790093', '513014', '0273706541' => 'Nabob Holdings / Robert Asare',
            default => null,
        };
    }

    /**
     * MTN / Telecel / AirtelTigo receive accounts used for manual deposits.
     *
     * @return list<array<string, mixed>>
     */
    public static function defaultNabobMomoAccounts(): array
    {
        return [
            [
                'type' => 'momo',
                'label' => 'MTN Mobile Money',
                'account_name' => 'Nabob Holdings / Robert Asare',
                'account_number' => '0539790093',
                'network' => 'mtn',
                'bank_name' => null,
            ],
            [
                'type' => 'momo',
                'label' => 'Telecel Cash',
                'account_name' => 'Nabob Holdings / Robert Asare',
                'account_number' => '513014',
                'network' => 'telecel',
                'bank_name' => null,
            ],
            [
                'type' => 'momo',
                'label' => 'AirtelTigo Cash',
                'account_name' => 'Nabob Holdings / Robert Asare',
                'account_number' => '0273706541',
                'network' => 'airteltigo',
                'bank_name' => null,
            ],
        ];
    }

    /**
     * Fill in any missing Nabob Holdings MoMo network so buyers never see “Not configured”.
     *
     * @param  list<array<string, mixed>>  $accounts
     * @return list<array<string, mixed>>
     */
    public static function ensureNabobMomoAccounts(array $accounts): array
    {
        $byNetwork = [];
        foreach ($accounts as $account) {
            if (($account['type'] ?? '') !== 'momo') {
                continue;
            }
            $network = static::normalizeMomoNetwork($account['network'] ?? null);
            if ($network) {
                $byNetwork[$network] = true;
            }
        }

        foreach (static::defaultNabobMomoAccounts() as $default) {
            $network = $default['network'];
            if (! isset($byNetwork[$network])) {
                $accounts[] = $default;
                $byNetwork[$network] = true;
            }
        }

        return array_values($accounts);
    }

    /**
     * @param  array{enabled?: bool, instructions?: string, accounts?: list<array<string, mixed>>}  $data
     */
    public static function saveManualFundingAccounts(array $data): void
    {
        static::set(self::FUNDING_ACCOUNTS_KEY, [
            'enabled' => (bool) ($data['enabled'] ?? false),
            'instructions' => (string) ($data['instructions'] ?? ''),
            'accounts' => array_values($data['accounts'] ?? []),
        ]);
    }

    /**
     * Normalize free-text / legacy network labels to canonical ids: mtn|telecel|airteltigo.
     */
    public static function normalizeMomoNetwork(?string $network): ?string
    {
        if ($network === null || trim($network) === '') {
            return null;
        }

        $raw = mb_strtolower(trim($network));
        $compact = str_replace([' ', '-', '_'], '', $raw);

        if (in_array($compact, ['mtn', 'telecel', 'airteltigo'], true)) {
            return $compact;
        }

        return match (true) {
            str_contains($compact, 'mtn') => 'mtn',
            str_contains($compact, 'telecel'), str_contains($compact, 'vodafone') => 'telecel',
            str_contains($compact, 'airtel'), str_contains($compact, 'tigo') => 'airteltigo',
            default => null,
        };
    }
}
