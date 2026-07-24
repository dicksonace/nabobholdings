import { Head, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, Upload } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';
import { SharedData } from '@/types';

interface Props {
    brand: {
        name: string;
        logo: string | null;
    };
    currency: {
        code: string;
        symbol: string;
    };
}

const CURRENCY_PRESETS = [
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'GBP', symbol: '£', label: 'British Pound' },
    { code: 'GHS', symbol: 'GH₵', label: 'Ghana Cedi' },
    { code: 'NGN', symbol: '₦', label: 'Nigerian Naira' },
    { code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling' },
    { code: 'ZAR', symbol: 'R', label: 'South African Rand' },
    { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar' },
    { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
];

export default function BrandSettings({ brand, currency }: Props) {
    const { flash } = usePage<SharedData>().props;
    const [preview, setPreview] = useState<string | null>(null);

    const form = useForm<{
        name: string;
        logo: File | null;
        remove_logo: boolean;
        currency_code: string;
        currency_symbol: string;
    }>({
        name: brand.name,
        logo: null,
        remove_logo: false,
        currency_code: currency.code,
        currency_symbol: currency.symbol,
    });

    const nameParts = form.data.name.trim().split(/\s+/);
    const first = nameParts[0] ?? form.data.name;
    const rest = nameParts.slice(1).join(' ');

    const currentLogo = form.data.remove_logo ? null : (preview ?? brand.logo);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('admin.brand.settings.update'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                form.setData('logo', null);
                form.setData('remove_logo', false);
                setPreview(null);
            },
        });
    };

    return (
        <AdminLayout title="Brand & Currency" active="brand">
            <Head title="Brand & Currency" />

            <div className="mb-4">
                <h1 className="text-lg font-bold text-gray-900">Brand &amp; Currency</h1>
                <p className="mt-1 text-sm text-gray-500">
                    This is the single place that controls the brand name, logo and currency across the whole site — the
                    header, footer, page titles, prices, invoices and emails all follow what you set here.
                </p>
            </div>

            {flash.success && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {flash.success}
                </div>
            )}

            <form onSubmit={submit} className="max-w-2xl space-y-6">
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <Label htmlFor="brand-name">Brand name</Label>
                    <Input
                        id="brand-name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        className="mt-1"
                        required
                        maxLength={100}
                    />
                    <InputError message={form.errors.name} />
                    <p className="mt-2 text-xs text-gray-500">
                        The first word is shown in the default color and the rest is highlighted in orange when no logo
                        image is uploaded.
                    </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <Label>Logo</Label>
                    <p className="mt-1 text-xs text-gray-500">
                        Optional. Upload a PNG/SVG image (max 5MB) to replace the text logo. Leave empty to use the text
                        wordmark below.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-6">
                        <div className="flex h-20 min-w-[10rem] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4">
                            {currentLogo ? (
                                <img src={currentLogo} alt={form.data.name} className="h-12 w-auto object-contain" />
                            ) : (
                                <span className="text-2xl font-bold tracking-tight text-gray-900">
                                    {first}
                                    {rest && <span className="text-orange-500">&nbsp;{rest}</span>}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                <Upload className="h-4 w-4" />
                                Choose image
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        form.setData('logo', file);
                                        form.setData('remove_logo', false);
                                        setPreview(file ? URL.createObjectURL(file) : null);
                                    }}
                                />
                            </label>

                            {(brand.logo || preview) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        form.setData('logo', null);
                                        form.setData('remove_logo', true);
                                        setPreview(null);
                                    }}
                                    className="text-left text-sm text-red-600 hover:text-red-700"
                                >
                                    Remove logo (use text wordmark)
                                </button>
                            )}
                        </div>
                    </div>
                    <InputError message={form.errors.logo} />
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <Label>Currency</Label>
                    <p className="mt-1 text-xs text-gray-500">
                        Sets the currency symbol and code shown across the whole app — product prices, carts, invoices,
                        wallets and emails. This changes how amounts are <em>displayed</em>; it does not convert existing
                        prices or change the currency Paystack charges in.
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <div className="sm:col-span-1">
                            <Label htmlFor="currency-preset" className="text-xs text-gray-500">
                                Quick pick
                            </Label>
                            <select
                                id="currency-preset"
                                className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
                                value={
                                    CURRENCY_PRESETS.find(
                                        (c) => c.code === form.data.currency_code && c.symbol === form.data.currency_symbol,
                                    )?.code ?? 'custom'
                                }
                                onChange={(e) => {
                                    const preset = CURRENCY_PRESETS.find((c) => c.code === e.target.value);
                                    if (preset) {
                                        form.setData('currency_code', preset.code);
                                        form.setData('currency_symbol', preset.symbol);
                                    }
                                }}
                            >
                                {CURRENCY_PRESETS.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.code} ({c.symbol}) — {c.label}
                                    </option>
                                ))}
                                <option value="custom">Custom…</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="currency-code" className="text-xs text-gray-500">
                                Code
                            </Label>
                            <Input
                                id="currency-code"
                                value={form.data.currency_code}
                                onChange={(e) => form.setData('currency_code', e.target.value.toUpperCase())}
                                className="mt-1 uppercase"
                                maxLength={10}
                                placeholder="USD"
                                required
                            />
                            <InputError message={form.errors.currency_code} />
                        </div>

                        <div>
                            <Label htmlFor="currency-symbol" className="text-xs text-gray-500">
                                Symbol
                            </Label>
                            <Input
                                id="currency-symbol"
                                value={form.data.currency_symbol}
                                onChange={(e) => form.setData('currency_symbol', e.target.value)}
                                className="mt-1"
                                maxLength={8}
                                placeholder="$"
                                required
                            />
                            <InputError message={form.errors.currency_symbol} />
                        </div>
                    </div>

                    <p className="mt-3 text-sm text-gray-500">
                        Preview:{' '}
                        <span className="font-semibold text-gray-900">
                            {form.data.currency_symbol}
                            1,250.00
                        </span>{' '}
                        <span className="text-gray-400">({form.data.currency_code})</span>
                    </p>
                </div>

                <Button type="submit" disabled={form.processing} className="bg-blue-600 hover:bg-blue-700">
                    {form.processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Save brand settings
                </Button>
            </form>
        </AdminLayout>
    );
}
