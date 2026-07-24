import { Head } from '@inertiajs/react';
import {
    ArrowRight,
    Banknote,
    BookOpen,
    CheckCircle2,
    PackageCheck,
    ShieldCheck,
    ShoppingBag,
    Store,
    Truck,
    Wallet,
} from 'lucide-react';
import { ComponentType, useState } from 'react';

import AdminLayout from '@/layouts/admin-layout';

type RoleKey = 'admin' | 'seller' | 'buyer';

interface Step {
    title: string;
    body: string;
}

interface RoleGuide {
    key: RoleKey;
    label: string;
    tagline: string;
    icon: ComponentType<{ className?: string }>;
    accent: string; // tailwind text color
    chip: string; // tailwind bg/border for active tab
    steps: Step[];
}

const ROLES: RoleGuide[] = [
    {
        key: 'admin',
        label: 'Admins',
        tagline: 'Run and moderate the whole marketplace',
        icon: ShieldCheck,
        accent: 'text-violet-600',
        chip: 'border-violet-300 bg-violet-50 text-violet-700',
        steps: [
            {
                title: 'Approve sellers',
                body: 'New sellers apply and appear under Marketplace → Pending Approval. Open an application, review the store and business details, then Approve or Reject. Only approved sellers can list products.',
            },
            {
                title: 'Moderate products',
                body: 'Every new listing starts as Pending under Products. Review it and Approve to make it live on the storefront, or Reject with a reason. You can also see live, rejected and out-of-stock items.',
            },
            {
                title: 'Oversee orders',
                body: 'Under Orders you can watch every order, spot ones unprocessed for 24h+, follow orders awaiting direct payment, confirm delivery, and handle seller cancellations.',
            },
            {
                title: 'Manage finance & payouts',
                body: 'Under Finance you release pending funds to sellers after delivery, approve and mark withdrawal payouts (MoMo), approve manual wallet top-ups, and set the receiving accounts.',
            },
            {
                title: 'Handle support',
                body: 'Refund requests, buyer–seller chats, seller reports and contact messages all live under Support. You can also broadcast announcements to sellers or buyers.',
            },
            {
                title: 'Configure the platform',
                body: 'In Settings → Brand & Currency you control the brand name, logo and the currency shown across the whole app. The Dashboard gives you live KPIs and performance charts.',
            },
        ],
    },
    {
        key: 'seller',
        label: 'Sellers',
        tagline: 'List products, fulfil orders, get paid',
        icon: Store,
        accent: 'text-emerald-600',
        chip: 'border-emerald-300 bg-emerald-50 text-emerald-700',
        steps: [
            {
                title: 'Register & set up the store',
                body: 'Sellers sign up through a registration invite, complete their store profile (name, description, appearance) and submit for review. An admin then approves the account.',
            },
            {
                title: 'Add products',
                body: 'Once approved, add products with photos, price, delivery fee and stock. Each product is submitted for admin approval before it goes live on the marketplace.',
            },
            {
                title: 'Receive & process orders',
                body: 'When a buyer orders, the seller gets an email/SMS alert. Move the order through the stages: confirm → pack → ship → delivered, adding tracking where relevant.',
            },
            {
                title: 'Get paid',
                body: 'For Nabob-secured payments, funds are held and settle into the seller wallet after the buyer confirms delivery. For pay-to-seller or cash on delivery, the seller confirms once money is received.',
            },
            {
                title: 'Grow sales',
                body: 'Create coupons and promotions, customise the storefront appearance, and track views and performance from the seller dashboard.',
            },
            {
                title: 'Withdraw earnings',
                body: 'Sellers withdraw their available wallet balance to Mobile Money. Admin reviews and pays out each request; every movement is recorded in wallet transactions.',
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
                body: 'Add items to the cart or save them to a wishlist, then check out with delivery details. Buyers can order from multiple sellers.',
            },
            {
                title: 'Pay your way',
                body: 'Pay online via card or Mobile Money (secured by Nabob), pay the seller directly, or choose cash on delivery where available.',
            },
            {
                title: 'Track & confirm delivery',
                body: 'Follow each order’s status. When the item arrives, confirm delivery — this releases the held funds to the seller and completes the order.',
            },
            {
                title: 'Reviews & support',
                body: 'Leave a rating and review after delivery, chat with sellers, and raise a refund request if something goes wrong. Approved refunds are credited to the buyer wallet.',
            },
        ],
    },
];

const FLOW: { icon: ComponentType<{ className?: string }>; label: string }[] = [
    { icon: ShoppingBag, label: 'Buyer orders & pays' },
    { icon: ShieldCheck, label: 'Nabob secures funds' },
    { icon: PackageCheck, label: 'Seller packs & ships' },
    { icon: Truck, label: 'Buyer confirms delivery' },
    { icon: Wallet, label: 'Funds released to seller' },
    { icon: Banknote, label: 'Seller withdraws (MoMo)' },
];

export default function AdminGuide() {
    const [role, setRole] = useState<RoleKey>('admin');
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
                        Nabob Holdings is a multi-vendor marketplace. Sellers list products, buyers order and pay,
                        and admins keep everything running smoothly. Here’s the full picture for each role.
                    </p>
                </div>
            </div>

            {/* Money & order flow */}
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

            {/* Role tabs */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
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

            {/* Steps for the selected role */}
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
                Payment options vary per product and seller: Nabob-secured (funds held then released), pay-to-seller
                (direct), or cash on delivery. Sellers arrange their own delivery.
            </p>
        </AdminLayout>
    );
}
