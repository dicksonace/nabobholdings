import { Head } from '@inertiajs/react';
import {
    ArrowRight,
    Banknote,
    BookOpen,
    CheckCircle2,
    PackageCheck,
    ShieldCheck,
    ShoppingBag,
    Truck,
    Wallet,
} from 'lucide-react';
import { ComponentType, useState } from 'react';

import AdminLayout from '@/layouts/admin-layout';

type RoleKey = 'owner' | 'buyer';

interface Step {
    title: string;
    body: string;
}

interface RoleGuide {
    key: RoleKey;
    label: string;
    tagline: string;
    icon: ComponentType<{ className?: string }>;
    accent: string;
    chip: string;
    steps: Step[];
}

const ROLES: RoleGuide[] = [
    {
        key: 'owner',
        label: 'Store owner',
        tagline: 'One login to run the whole store',
        icon: ShieldCheck,
        accent: 'text-violet-600',
        chip: 'border-violet-300 bg-violet-50 text-violet-700',
        steps: [
            {
                title: 'Sign in to the Owner Panel',
                body: 'Use /admin/login. You land on the dashboard with sales, orders and product KPIs. The same account owns the store — there is no separate seller login.',
            },
            {
                title: 'Add & manage products',
                body: 'Under Products, add listings with photos, price, delivery fee and stock. New products go live immediately (no approval queue). Hide drafts or mark items out of stock when needed.',
            },
            {
                title: 'Fulfil orders',
                body: 'Under Orders, work the sales pipeline: new → processing → packing → out for delivery → completed. Confirm cash-on-delivery calls and mark payments received for direct pay.',
            },
            {
                title: 'Finance & wallet',
                body: 'Use Store Wallet for balances, withdrawals and payment methods. Approve buyer withdrawals and manual top-ups from Finance when needed. Set receive accounts under Settings.',
            },
            {
                title: 'Customers & support',
                body: 'View buyers, reply to reviews, handle refund requests, chat with customers, and read contact-form messages. Broadcast announcements to buyers when you need to.',
            },
            {
                title: 'Brand the storefront',
                body: 'Customize store appearance, and under Settings set brand name, logo, currency and the public address/phone shown in the footer and contact page.',
            },
        ],
    },
    {
        key: 'buyer',
        label: 'Buyers',
        tagline: 'Discover products and shop safely',
        icon: ShoppingBag,
        accent: 'text-orange-600',
        chip: 'border-orange-300 bg-orange-50 text-orange-700',
        steps: [
            {
                title: 'Discover products',
                body: 'Browse by category or search, then filter by price, rating and delivery. Product pages show a photo gallery, description, stock, ratings and view counts.',
            },
            {
                title: 'Add to cart & checkout',
                body: 'Add items to the cart or wishlist, then check out with delivery details.',
            },
            {
                title: 'Pay your way',
                body: 'Pay online via card or Mobile Money (secured by Nabob), pay the store directly, or choose cash on delivery where available.',
            },
            {
                title: 'Track & confirm delivery',
                body: 'Follow each order’s status. When the item arrives, confirm delivery — this releases held funds and completes the order.',
            },
            {
                title: 'Reviews & support',
                body: 'Leave a rating after delivery, chat with the store, and raise a refund request if something goes wrong. Approved refunds credit the buyer wallet.',
            },
        ],
    },
];

const FLOW: { icon: ComponentType<{ className?: string }>; label: string }[] = [
    { icon: ShoppingBag, label: 'Buyer orders & pays' },
    { icon: ShieldCheck, label: 'Nabob secures funds' },
    { icon: PackageCheck, label: 'Store packs & ships' },
    { icon: Truck, label: 'Buyer confirms delivery' },
    { icon: Wallet, label: 'Funds settle in store wallet' },
    { icon: Banknote, label: 'Owner withdraws (MoMo)' },
];

export default function AdminGuide() {
    const [role, setRole] = useState<RoleKey>('owner');
    const active = ROLES.find((r) => r.key === role) ?? ROLES[0];

    return (
        <AdminLayout title="How it works" active="guide">
            <Head title="How it works" />

            <div className="mb-6 flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <BookOpen className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-gray-900">How this app works</h1>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Nabob Holdings runs as a single-store shop. One Owner Panel manages products, orders and finance;
                        buyers shop on the storefront.
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900">The money &amp; order flow</h3>
                <p className="text-sm text-gray-500">How a secured order moves from checkout to payout.</p>
                <div className="mt-4 flex flex-wrap items-stretch gap-2">
                    {FLOW.map((step, i) => (
                        <div key={step.label} className="flex items-center gap-2">
                            <div className="flex min-w-[8.5rem] flex-1 flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-4 text-center">
                                <step.icon className="h-5 w-5 text-orange-500" />
                                <span className="text-xs font-medium text-gray-700">{step.label}</span>
                            </div>
                            {i < FLOW.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {ROLES.map((r) => {
                    const isActive = r.key === role;
                    return (
                        <button
                            key={r.key}
                            type="button"
                            onClick={() => setRole(r.key)}
                            className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                                isActive ? r.chip + ' shadow-sm' : 'border-gray-100 bg-white text-gray-700 hover:border-gray-200'
                            }`}
                        >
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ${r.accent}`}>
                                <r.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold">For {r.label}</p>
                                <p className="text-xs opacity-80">{r.tagline}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                    <active.icon className={`h-5 w-5 ${active.accent}`} />
                    <h3 className="font-semibold text-gray-900">For {active.label}</h3>
                </div>

                <ol className="mt-5 space-y-5">
                    {active.steps.map((step, i) => (
                        <li key={step.title} className="flex gap-4">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                                {i + 1}
                            </div>
                            <div>
                                <p className="flex items-center gap-2 font-semibold text-gray-900">
                                    <CheckCircle2 className={`h-4 w-4 ${active.accent}`} />
                                    {step.title}
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.body}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>

            <p className="mt-4 text-xs text-gray-400">
                Payment options: Nabob-secured (funds held then released), pay-to-store (direct), or cash on delivery.
                Delivery is arranged by the store.
            </p>
        </AdminLayout>
    );
}
