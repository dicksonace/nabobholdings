import { Head, Link, router, usePage } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { formatPrice, productImageUrl } from '@/types/marketplace';
import { SharedData } from '@/types';

interface CheckoutRow {
    id: number;
    checkout_number: string;
    total: number;
    discount_amount: number;
    created_at: string | null;
    bank_slip_path: string | null;
    bank_slip_verified_at: string | null;
    buyer: { name?: string; email?: string; mobile?: string | null };
    orders_count: number;
}

interface Props {
    checkouts: {
        data: CheckoutRow[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    status: 'all' | 'pending' | 'verified';
    pending_count: number;
}

export default function CodBankSlips({ checkouts, status, pending_count }: Props) {
    const { flash } = usePage<SharedData>().props;

    const verify = (checkoutId: number) => {
        router.post(route('admin.checkouts.verify-bank-slip', checkoutId), {}, { preserveScroll: true });
    };

    return (
        <AdminLayout title="Buyer payment slips" active="cod-bank-slips">
            <Head title="Buyer payment slips" />
            <p className="mb-4 text-sm text-gray-600">
                Bank deposit slips uploaded by buyers at checkout. Review each slip and mark it verified once payment is confirmed.
            </p>

            {(flash.success || flash.error) && (
                <div
                    className={`mb-4 rounded-xl px-4 py-3 text-sm ${
                        flash.error
                            ? 'border border-red-200 bg-red-50 text-red-800'
                            : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    }`}
                >
                    {flash.error ?? flash.success}
                </div>
            )}

            <div className="mb-4 flex flex-wrap gap-2">
                {(['pending', 'verified', 'all'] as const).map((key) => (
                    <Link
                        key={key}
                        href={route('admin.orders.cod-bank-slips', { status: key })}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                            status === key ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 shadow-sm'
                        }`}
                    >
                        {key === 'pending' ? `Pending (${pending_count})` : key === 'verified' ? 'Verified' : 'All'}
                    </Link>
                ))}
            </div>

            <div className="space-y-4">
                {checkouts.data.length === 0 && (
                    <p className="rounded-xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
                        No bank slips in this list.
                    </p>
                )}
                {checkouts.data.map((checkout) => (
                    <article key={checkout.id} className="rounded-xl bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="font-semibold text-gray-900">{checkout.checkout_number}</p>
                                <p className="text-sm text-gray-600">
                                    {checkout.buyer.name} · {checkout.buyer.email}
                                    {checkout.buyer.mobile ? ` · ${checkout.buyer.mobile}` : ''}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {checkout.orders_count} order(s) · Total {formatPrice(checkout.total)}
                                    {checkout.discount_amount > 0 && (
                                        <> · Discount {formatPrice(checkout.discount_amount)}</>
                                    )}
                                </p>
                                {checkout.bank_slip_verified_at ? (
                                    <p className="mt-2 text-xs font-medium text-emerald-700">
                                        Verified {new Date(checkout.bank_slip_verified_at).toLocaleString()}
                                    </p>
                                ) : (
                                    <p className="mt-2 text-xs font-medium text-amber-700">Awaiting admin verification</p>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {checkout.bank_slip_path && (
                                    <a
                                        href={productImageUrl(checkout.bank_slip_path)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block max-w-[180px] overflow-hidden rounded-lg ring-1 ring-gray-200"
                                    >
                                        <img
                                            src={productImageUrl(checkout.bank_slip_path)}
                                            alt="Bank slip"
                                            className="h-28 w-full object-cover"
                                        />
                                    </a>
                                )}
                                {!checkout.bank_slip_verified_at && (
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => verify(checkout.id)}>
                                        Mark verified
                                    </Button>
                                )}
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </AdminLayout>
    );
}
