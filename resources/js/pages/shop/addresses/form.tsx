import { Head, Link, router, useForm } from '@inertiajs/react';
import { LoaderCircle, MapPin } from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ShopLayout from '@/layouts/shop-layout';
import { BuyerAddress } from '@/types/buyer-address';

const DIAL_CODES = [
    { code: '+94', label: '🇱🇰 +94' },
    { code: '+91', label: '🇮🇳 +91' },
    { code: '+971', label: '🇦🇪 +971' },
    { code: '+44', label: '🇬🇧 +44' },
    { code: '+1', label: '🇺🇸 +1' },
    { code: '+61', label: '🇦🇺 +61' },
    { code: '+65', label: '🇸🇬 +65' },
    { code: '+233', label: '🇬🇭 +233' },
] as const;

type AddressDefaults = {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    secondary_phone?: string | null;
    address_line?: string | null;
    additional_details?: string | null;
    region?: string | null;
    city?: string | null;
    digital_address?: string | null;
    is_default?: boolean;
};

interface FormProps {
    address: BuyerAddress | null;
    defaults?: AddressDefaults | null;
    returnTo?: string | null;
}

function splitPhone(raw: string | null | undefined): { dial: string; local: string } {
    const value = (raw ?? '').trim();
    if (!value) {
        return { dial: '+94', local: '' };
    }

    const matched = DIAL_CODES.find((item) => value.startsWith(item.code));
    if (matched) {
        return { dial: matched.code, local: value.slice(matched.code.length).replace(/^[\s\-]+/, '') };
    }

    if (value.startsWith('+')) {
        const parts = value.match(/^(\+\d{1,3})\s*(.*)$/);
        if (parts) {
            return { dial: parts[1], local: parts[2] };
        }
    }

    return { dial: '+94', local: value };
}

function PhoneField({
    id,
    label,
    dial,
    local,
    onDialChange,
    onLocalChange,
    placeholder,
    required,
    error,
    hint,
}: {
    id: string;
    label: string;
    dial: string;
    local: string;
    onDialChange: (dial: string) => void;
    onLocalChange: (local: string) => void;
    placeholder: string;
    required?: boolean;
    error?: string;
    hint?: string;
}) {
    const dialOptions = useMemo(() => {
        if (DIAL_CODES.some((item) => item.code === dial)) {
            return DIAL_CODES;
        }

        return [{ code: dial, label: dial }, ...DIAL_CODES];
    }, [dial]);

    return (
        <div>
            <Label htmlFor={id}>{label}</Label>
            <div className="mt-1 flex overflow-hidden rounded-md border border-input bg-white">
                <select
                    aria-label={`${label} country code`}
                    value={dial}
                    onChange={(e) => onDialChange(e.target.value)}
                    className="border-r bg-gray-50 px-2 text-sm text-gray-700 outline-none"
                >
                    {dialOptions.map((item) => (
                        <option key={item.code} value={item.code}>
                            {item.label}
                        </option>
                    ))}
                </select>
                <Input
                    id={id}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder={placeholder}
                    value={local}
                    onChange={(e) => onLocalChange(e.target.value)}
                    required={required}
                    inputMode="tel"
                />
            </div>
            {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
            <InputError message={error} />
        </div>
    );
}

export default function AddressForm({ address, defaults, returnTo }: FormProps) {
    const seed = address ?? defaults ?? {};
    const primaryPhone = splitPhone(seed.phone);
    const secondaryPhone = splitPhone(seed.secondary_phone);

    const [phoneDial, setPhoneDial] = useState(primaryPhone.dial);
    const [phoneLocal, setPhoneLocal] = useState(primaryPhone.local);
    const [secondaryDial, setSecondaryDial] = useState(secondaryPhone.dial);
    const [secondaryLocal, setSecondaryLocal] = useState(secondaryPhone.local);

    const { data, setData, post, put, processing, errors, transform } = useForm({
        first_name: seed.first_name ?? '',
        last_name: seed.last_name ?? '',
        phone: seed.phone ?? '',
        secondary_phone: seed.secondary_phone ?? '',
        address_line: seed.address_line ?? '',
        additional_details: seed.additional_details ?? '',
        region: seed.region ?? '',
        city: seed.city ?? '',
        digital_address: seed.digital_address ?? '',
        is_default: address?.is_default ?? defaults?.is_default ?? true,
        return: returnTo ?? '',
    });

    const composePhone = (dial: string, local: string) => {
        const cleaned = local.trim();
        if (!cleaned) {
            return '';
        }

        return `${dial} ${cleaned.replace(/^0+/, '')}`.trim();
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        transform((current) => ({
            ...current,
            phone: composePhone(phoneDial, phoneLocal),
            secondary_phone: composePhone(secondaryDial, secondaryLocal) || null,
        }));

        if (address) {
            put(route('addresses.update', address.id));
        } else {
            post(route('addresses.store'));
        }
    };

    return (
        <ShopLayout>
            <Head title={address ? 'Edit address' : 'Add address'} />
            <div className="mx-auto max-w-lg px-3 py-4 sm:px-4 sm:py-8">
                <Link
                    href={returnTo === 'checkout' ? route('checkout.index') : route('addresses.index')}
                    className="text-sm text-orange-500 hover:underline"
                >
                    ← Back
                </Link>
                <div className="mt-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-orange-500" />
                    <h1 className="text-2xl font-bold text-gray-900">{address ? 'Edit address' : 'Add address'}</h1>
                </div>
                <p className="mt-1 text-sm text-gray-500">Saved for your next orders — edit anytime.</p>

                <form onSubmit={submit} className="mt-6 space-y-6">
                    <div className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                        <h2 className="font-semibold text-gray-900">Contact details</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="first_name">First name</Label>
                                <Input
                                    id="first_name"
                                    className="mt-1"
                                    placeholder="Enter your first name"
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.first_name} />
                            </div>
                            <div>
                                <Label htmlFor="last_name">Last name</Label>
                                <Input
                                    id="last_name"
                                    className="mt-1"
                                    placeholder="Enter your last name"
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.last_name} />
                            </div>
                        </div>
                        <PhoneField
                            id="phone"
                            label="Mobile number"
                            dial={phoneDial}
                            local={phoneLocal}
                            onDialChange={setPhoneDial}
                            onLocalChange={setPhoneLocal}
                            placeholder="70 123 4567"
                            required
                            error={errors.phone}
                            hint="Use a number you can reach for delivery."
                        />
                        <PhoneField
                            id="secondary_phone"
                            label="Secondary mobile (optional)"
                            dial={secondaryDial}
                            local={secondaryLocal}
                            onDialChange={setSecondaryDial}
                            onLocalChange={setSecondaryLocal}
                            placeholder="Optional"
                            error={errors.secondary_phone}
                        />
                    </div>

                    <div className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                        <h2 className="font-semibold text-gray-900">Address details</h2>
                        <div>
                            <Label htmlFor="address_line">Full address</Label>
                            <Input
                                id="address_line"
                                className="mt-1"
                                placeholder="e.g. Near the station, House No. 12"
                                value={data.address_line}
                                onChange={(e) => setData('address_line', e.target.value)}
                                required
                            />
                            <InputError message={errors.address_line} />
                        </div>
                        <div>
                            <Label htmlFor="additional_details">Additional details (optional)</Label>
                            <Input
                                id="additional_details"
                                className="mt-1"
                                placeholder="Landmark, floor, gate color…"
                                value={data.additional_details}
                                onChange={(e) => setData('additional_details', e.target.value)}
                            />
                            <InputError message={errors.additional_details} />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="region">Province / District</Label>
                                <Input
                                    id="region"
                                    className="mt-1"
                                    placeholder="e.g. Western Province"
                                    value={data.region}
                                    onChange={(e) => setData('region', e.target.value)}
                                    required
                                />
                                <InputError message={errors.region} />
                            </div>
                            <div>
                                <Label htmlFor="city">City / Town</Label>
                                <Input
                                    id="city"
                                    className="mt-1"
                                    placeholder="e.g. Colombo"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                    required
                                />
                                <InputError message={errors.city} />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="digital_address">Postal code (optional)</Label>
                            <Input
                                id="digital_address"
                                className="mt-1"
                                placeholder="e.g. 00300"
                                value={data.digital_address}
                                onChange={(e) => setData('digital_address', e.target.value)}
                            />
                            <InputError message={errors.digital_address} />
                        </div>
                    </div>

                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                        <div>
                            <p className="font-medium text-gray-900">Default address</p>
                            <p className="text-sm text-gray-500">Set this as your primary delivery address</p>
                        </div>
                        <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            checked={data.is_default}
                            onChange={(e) => setData('is_default', e.target.checked)}
                        />
                    </label>

                    <Button type="submit" disabled={processing} className="w-full bg-orange-500 py-6 hover:bg-orange-600">
                        {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        {address ? 'Save changes' : 'Save address'}
                    </Button>

                    {address && (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => {
                                if (! window.confirm('Delete this address?')) return;
                                router.delete(route('addresses.destroy', address.id), {
                                    onSuccess: () => {
                                        if (returnTo === 'checkout') {
                                            router.visit(route('checkout.index'));
                                        }
                                    },
                                });
                            }}
                        >
                            Delete address
                        </Button>
                    )}
                </form>
            </div>
        </ShopLayout>
    );
}
