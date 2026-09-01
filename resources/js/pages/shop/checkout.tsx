import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronRight, LoaderCircle, MapPin, Pencil } from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

import DocumentUploadField from '@/components/forms/document-upload-field';
import PaymentMethodIcon from '@/components/shop/payment-method-icon';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ShopLayout from '@/layouts/shop-layout';
import {
    checkoutCartKey,
    clearCheckoutDraft,
    loadCheckoutDraft,
    saveCheckoutDraft,
} from '@/lib/checkout-draft';
import { CartItem, formatPrice, productImageUrl, Wallet } from '@/types/marketplace';
import { BuyerAddress } from '@/types/buyer-address';
import { SharedData } from '@/types';

type CheckoutPaymentOption = 'cod' | 'bank_transfer';

interface BankAccount {
    type: string;
    label?: string;
    account_name: string;
    account_number: string;
    bank_name?: string | null;
}

interface SellerGroup {
    seller_id: number;
    seller_name: string;
    store_slug?: string | null;
    items: CartItem[];
    subtotal: number;
    shipping_cost: number;
    shipping_label: string;
    shipping_note?: string | null;
    package_total: number;
}

interface CouponPreview {
    subtotal: number;
    shipping_total: number;
    discount_total: number;
    grand_total: number;
    per_seller: Record<string, { subtotal: number; discount: number; shipping: number; total: number; error?: string }>;
}

interface CheckoutProps {
    sellerGroups: SellerGroup[];
    subtotal: number;
    shippingTotal: number;
    grandTotal: number;
    wallet: Wallet;
    addresses: BuyerAddress[];
    selectedAddressId: number | null;
    bankAccounts: BankAccount[];
}

export default function Checkout({
    sellerGroups,
    subtotal,
    shippingTotal,
    grandTotal,
    addresses,
    selectedAddressId,
    bankAccounts,
}: CheckoutProps) {
    const { csrfToken } = usePage<SharedData>().props;
    const cartKey = useMemo(() => checkoutCartKey(sellerGroups), [sellerGroups]);

    const initialForm = useMemo(() => {
        const draft = loadCheckoutDraft(cartKey);
        const addressIds = new Set(addresses.map((a) => a.id));
        const restoredAddressId =
            draft?.address_id != null && addressIds.has(draft.address_id)
                ? draft.address_id
                : selectedAddressId;

        const sellerCoupons: Record<string, string> = {};
        if (draft?.seller_coupons) {
            sellerGroups.forEach((group) => {
                const key = String(group.seller_id);
                const code = draft.seller_coupons[key];
                if (typeof code === 'string' && code.trim() !== '') {
                    sellerCoupons[key] = code;
                }
            });
        }

        const restoredPayment: CheckoutPaymentOption =
            draft?.payment_method === 'bank_transfer' ? 'bank_transfer' : 'cod';

        return {
            address_id: restoredAddressId,
            payment_option: restoredPayment,
            seller_coupons: sellerCoupons,
        };
    }, [addresses, cartKey, selectedAddressId, sellerGroups]);

    const [pickingAddress, setPickingAddress] = useState(false);
    const [activeAddressId, setActiveAddressId] = useState<number | null>(initialForm.address_id);
    const [bankSlip, setBankSlip] = useState<File | null>(null);
    const [bankSlipError, setBankSlipError] = useState<string | null>(null);
    const [paymentOption, setPaymentOption] = useState<CheckoutPaymentOption>(initialForm.payment_option);
    const [submitting, setSubmitting] = useState(false);
    const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    const [sellerCoupons, setSellerCoupons] = useState<Record<string, string>>(initialForm.seller_coupons);

    const selected =
        addresses.find((a) => a.id === (activeAddressId ?? initialForm.address_id))
        ?? addresses.find((a) => a.is_default)
        ?? addresses[0]
        ?? null;

    useEffect(() => {
        saveCheckoutDraft({
            cartKey,
            address_id: selected?.id ?? null,
            payment_method: paymentOption,
            seller_payments: {},
            seller_coupons: sellerCoupons,
        });
    }, [cartKey, paymentOption, selected?.id, sellerCoupons]);

    const selectPaymentOption = (option: CheckoutPaymentOption) => {
        setPaymentOption(option);
        setBankSlipError(null);
        if (option === 'cod') {
            setBankSlip(null);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const hasCodes = Object.values(sellerCoupons).some((code) => code.trim() !== '');
            if (!hasCodes) {
                setCouponPreview(null);
                return;
            }

            setPreviewLoading(true);
            fetch(route('checkout.preview'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken ?? '',
                },
                body: JSON.stringify({ seller_coupons: sellerCoupons }),
            })
                .then(async (res) => {
                    if (!res.ok) {
                        throw new Error('Preview failed');
                    }
                    return res.json() as Promise<CouponPreview>;
                })
                .then((data) => setCouponPreview(data))
                .catch(() => setCouponPreview(null))
                .finally(() => setPreviewLoading(false));
        }, 350);

        return () => window.clearTimeout(timer);
    }, [csrfToken, sellerCoupons]);

    const displaySubtotal = couponPreview?.subtotal ?? subtotal;
    const displayShipping = couponPreview?.shipping_total ?? shippingTotal;
    const displayDiscount = couponPreview?.discount_total ?? 0;
    const displayTotal = couponPreview?.grand_total ?? grandTotal;

    const chooseAddress = (id: number) => {
        setActiveAddressId(id);
        setPickingAddress(false);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!selected) {
            router.visit(route('addresses.create', { return: 'checkout' }));
            return;
        }

        if (paymentOption === 'bank_transfer' && !bankSlip) {
            setBankSlipError('Upload your bank deposit slip to continue.');
            return;
        }

        setSubmitting(true);
        setBankSlipError(null);

        const formData = new FormData();
        formData.append('address_id', String(selected.id));
        formData.append('payment_method', paymentOption);
        Object.entries(sellerCoupons).forEach(([sellerId, code]) => {
            if (code.trim()) {
                formData.append(`seller_coupons[${sellerId}]`, code.trim().toUpperCase());
            }
        });
        if (paymentOption === 'bank_transfer' && bankSlip) {
            formData.append('bank_slip', bankSlip);
        }

        router.post(route('checkout.store'), formData, {
            forceFormData: true,
            onSuccess: () => clearCheckoutDraft(),
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <ShopLayout>
            <Head title="Checkout" />
            <div className="mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-8">
                <Link href={route('cart.index')} className="text-sm text-orange-500 hover:underline">
                    &larr; Back to cart
                </Link>
                <h1 className="mt-3 text-2xl font-bold text-gray-900">Checkout</h1>
                <p className="mt-1 text-sm text-gray-500">
                    One purchase — {sellerGroups.length} package{sellerGroups.length === 1 ? '' : 's'} (one per store). Each store ships separately.
                </p>

                <form onSubmit={submit} className="mt-6 grid gap-8 lg:grid-cols-2">
                    <div className="space-y-6">
                        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                                    <MapPin className="h-4 w-4 text-orange-500" />
                                    Ship to
                                </h2>
                                {addresses.length > 0 && (
                                    <button
                                        type="button"
                                        className="text-sm font-medium text-orange-600 hover:underline"
                                        onClick={() => setPickingAddress((v) => !v)}
                                    >
                                        {pickingAddress ? 'Done' : 'Change address'}
                                    </button>
                                )}
                            </div>

                            {!selected ? (
                                <div className="mt-4 text-center">
                                    <p className="text-sm text-gray-500">Add a delivery address to continue.</p>
                                    <Button asChild className="mt-4 bg-orange-500 hover:bg-orange-600">
                                        <Link href={route('addresses.create', { return: 'checkout' })}>Add address</Link>
                                    </Button>
                                </div>
                            ) : pickingAddress ? (
                                <ul className="mt-4 space-y-2">
                                    {addresses.map((address) => (
                                        <li key={address.id}>
                                            <button
                                                type="button"
                                                onClick={() => chooseAddress(address.id)}
                                                className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                                                    selected.id === address.id
                                                        ? 'border-orange-400 bg-orange-50'
                                                        : 'border-gray-100 hover:border-orange-200'
                                                }`}
                                            >
                                                <p className="font-medium text-gray-900">
                                                    {address.full_name}
                                                    {address.is_default ? ' · Default' : ''}
                                                </p>
                                                <p className="mt-0.5 text-gray-600">{address.address_line}</p>
                                                <p className="text-gray-500">
                                                    {address.city}, {address.region} · {address.phone}
                                                </p>
                                            </button>
                                        </li>
                                    ))}
                                    <li>
                                        <Link
                                            href={route('addresses.create', { return: 'checkout' })}
                                            className="block rounded-lg border border-dashed border-orange-200 p-3 text-center text-sm font-medium text-orange-600 hover:bg-orange-50"
                                        >
                                            + Add new address
                                        </Link>
                                    </li>
                                </ul>
                            ) : (
                                <div className="mt-4 space-y-1 text-sm text-gray-700">
                                    <p><span className="text-gray-500">Name:</span> {selected.full_name}</p>
                                    <p><span className="text-gray-500">Zone:</span> {selected.region}</p>
                                    <p><span className="text-gray-500">Town:</span> {selected.city}</p>
                                    <p><span className="text-gray-500">Address:</span> {selected.address_line}</p>
                                    {selected.additional_details && (
                                        <p><span className="text-gray-500">Details:</span> {selected.additional_details}</p>
                                    )}
                                    <p><span className="text-gray-500">Mobile:</span> {selected.phone}</p>
                                    <Button asChild size="sm" variant="outline" className="mt-3">
                                        <Link href={route('addresses.edit', { address: selected.id, return: 'checkout' })}>
                                            <Pencil className="mr-1 h-3.5 w-3.5" />
                                            Edit address
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <h2 className="font-semibold text-gray-900">Payment</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Choose how you will pay for this order.
                            </p>

                            <div className="mt-4 space-y-3">
                                <label
                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                                        paymentOption === 'cod'
                                            ? 'border-orange-400 bg-orange-50/60 ring-1 ring-orange-200'
                                            : 'border-gray-100 hover:border-orange-200'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment_option"
                                        value="cod"
                                        checked={paymentOption === 'cod'}
                                        onChange={() => selectPaymentOption('cod')}
                                        className="mt-1"
                                    />
                                    <PaymentMethodIcon method="cash" />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-gray-900">Cash on Delivery</p>
                                        <p className="mt-0.5 text-xs text-gray-600">
                                            Pay the seller when your order is delivered. No bank slip needed.
                                        </p>
                                        {paymentOption === 'cod' && sellerGroups.some((g) => g.store_slug) && (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {sellerGroups.filter((g) => g.store_slug).map((g) => (
                                                    <Link
                                                        key={g.seller_id}
                                                        href={route('store.show', g.store_slug!)}
                                                        className="inline-flex items-center gap-0.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-orange-600 ring-1 ring-orange-100 hover:bg-orange-50"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Visit {g.seller_name}
                                                        <ChevronRight className="h-3 w-3" />
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </label>

                                <label
                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                                        paymentOption === 'bank_transfer'
                                            ? 'border-sky-400 bg-sky-50/60 ring-1 ring-sky-200'
                                            : 'border-gray-100 hover:border-sky-200'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment_option"
                                        value="bank_transfer"
                                        checked={paymentOption === 'bank_transfer'}
                                        onChange={() => selectPaymentOption('bank_transfer')}
                                        className="mt-1"
                                    />
                                    <PaymentMethodIcon method="bank" />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-gray-900">Bank Transfer</p>
                                        <p className="mt-0.5 text-xs text-gray-600">
                                            Pay into our bank account and upload your deposit slip below.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {paymentOption === 'bank_transfer' && bankAccounts.length > 0 && (
                                <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/50 p-4 text-sm">
                                    <p className="font-medium text-gray-900">Pay into one of these accounts</p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Transfer the order total, then upload your receipt below.
                                    </p>
                                    <ul className="mt-3 space-y-2">
                                        {bankAccounts.map((account, index) => (
                                            <li key={`${account.account_number}-${index}`} className="rounded-lg bg-white p-3 ring-1 ring-gray-100">
                                                <p className="font-medium text-gray-900">{account.bank_name ?? account.label ?? 'Bank account'}</p>
                                                <p className="text-gray-700">{account.account_name}</p>
                                                <p className="font-mono text-sm text-gray-900">{account.account_number}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="mt-4">
                                <DocumentUploadField
                                    id="bank_slip"
                                    label="Bank deposit slip"
                                    hint={
                                        paymentOption === 'bank_transfer'
                                            ? 'Upload a photo or PDF of your bank transfer receipt. Admin will verify it before processing.'
                                            : 'Select Bank Transfer above to enable slip upload.'
                                    }
                                    required={paymentOption === 'bank_transfer'}
                                    disabled={paymentOption !== 'bank_transfer'}
                                    value={bankSlip}
                                    onChange={(file) => {
                                        setBankSlip(file);
                                        setBankSlipError(null);
                                    }}
                                />
                                <InputError message={bankSlipError ?? undefined} className="mt-2" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {sellerGroups.map((group, index) => {
                            const sellerKey = String(group.seller_id);
                            const preview = couponPreview?.per_seller?.[sellerKey] ?? couponPreview?.per_seller?.[group.seller_id];

                            return (
                                <div key={group.seller_id} className="rounded-xl bg-white p-6 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                                Package · {index + 1} of {sellerGroups.length}
                                            </p>
                                            <h2 className="font-semibold text-gray-900">{group.seller_name}</h2>
                                            <p className="mt-0.5 text-xs text-teal-700">
                                                {paymentOption === 'bank_transfer'
                                                    ? 'Bank transfer · slip pending verification'
                                                    : 'Cash on delivery · pay on arrival'}
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium text-orange-500">
                                            {formatPrice(preview?.total ?? group.package_total)}
                                        </span>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                        {group.items.map((item) => (
                                            <div key={item.id} className="flex gap-3 text-sm">
                                                <img src={productImageUrl(item.product.images?.[0]?.path)} alt="" className="h-10 w-10 rounded object-contain" />
                                                <div className="flex-1">
                                                    <p className="line-clamp-1 font-medium">{item.product.name}</p>
                                                    <p className="text-gray-500">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 space-y-1 border-t pt-3 text-sm">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Items</span>
                                            <span>{formatPrice(preview?.subtotal ?? group.subtotal)}</span>
                                        </div>
                                        {(preview?.discount ?? 0) > 0 && (
                                            <div className="flex justify-between text-emerald-700">
                                                <span>Coupon discount</span>
                                                <span>-{formatPrice(preview?.discount ?? 0)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-gray-600">
                                            <span>{group.shipping_label}</span>
                                            <span>{formatPrice(preview?.shipping ?? group.shipping_cost)}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t pt-4">
                                        <Label className="text-sm">Coupon code (optional)</Label>
                                        <Input
                                            className="mt-1 font-mono uppercase"
                                            placeholder="SAVE10"
                                            value={sellerCoupons[sellerKey] ?? ''}
                                            onChange={(e) =>
                                                setSellerCoupons({
                                                    ...sellerCoupons,
                                                    [sellerKey]: e.target.value.toUpperCase(),
                                                })
                                            }
                                        />
                                        {preview?.error && (
                                            <p className="mt-1 text-xs text-red-600">{preview.error}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Items ({sellerGroups.length} package{sellerGroups.length === 1 ? '' : 's'})</span>
                                    <span>{formatPrice(displaySubtotal)}</span>
                                </div>
                                {displayDiscount > 0 && (
                                    <div className="flex justify-between text-emerald-700">
                                        <span>Coupon discount</span>
                                        <span>-{formatPrice(displayDiscount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery</span>
                                    <span>{formatPrice(displayShipping)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-orange-500">
                                        {previewLoading ? '…' : formatPrice(displayTotal)}
                                    </span>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={submitting || !selected}
                                className="mt-6 w-full bg-orange-500 py-6 hover:bg-orange-600 disabled:opacity-60"
                            >
                                {submitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Place Order
                            </Button>
                            {!selected && (
                                <p className="mt-2 text-center text-xs text-amber-700">
                                    Add a delivery address above to enable Place Order.
                                </p>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </ShopLayout>
    );
}
