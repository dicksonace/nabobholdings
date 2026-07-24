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
}

export default function BrandSettings({ brand }: Props) {
    const { flash } = usePage<SharedData>().props;
    const [preview, setPreview] = useState<string | null>(null);

    const form = useForm<{ name: string; logo: File | null; remove_logo: boolean }>({
        name: brand.name,
        logo: null,
        remove_logo: false,
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
        <AdminLayout title="Brand & Logo" active="brand">
            <Head title="Brand & Logo" />

            <div className="mb-4">
                <h1 className="text-lg font-bold text-gray-900">Brand &amp; Logo</h1>
                <p className="mt-1 text-sm text-gray-500">
                    This is the single place that controls the brand name and logo across the whole site — the header,
                    footer, page titles, invoices and emails all follow what you set here.
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

                <Button type="submit" disabled={form.processing} className="bg-blue-600 hover:bg-blue-700">
                    {form.processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Save brand settings
                </Button>
            </form>
        </AdminLayout>
    );
}
