import { useState } from 'react';

import { formatPrice } from '@/types/marketplace';

export const CHART_PALETTE = [
    '#f97316', // orange
    '#6366f1', // indigo
    '#10b981', // emerald
    '#f59e0b', // amber
    '#f43f5e', // rose
    '#0ea5e9', // sky
    '#8b5cf6', // violet
    '#14b8a6', // teal
    '#64748b', // slate
];

interface SeriesPoint {
    date: string;
    revenue: number;
    orders: number;
    signups: number;
}

function shortDate(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * 30-day revenue (area) + orders (line) trend with an interactive hover tooltip.
 * Pure SVG for the shapes, HTML overlay for the interactive dot/tooltip.
 */
export function TrendChart({ data }: { data: SeriesPoint[] }) {
    const [active, setActive] = useState<number | null>(null);
    const n = data.length;
    const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
    const maxOrders = Math.max(...data.map((d) => d.orders), 1);

    const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * 100);
    const yRev = (v: number) => 100 - (v / maxRevenue) * 100;
    const yOrders = (v: number) => 100 - (v / maxOrders) * 100;

    const revLine = data.map((d, i) => `${x(i)},${yRev(d.revenue)}`).join(' ');
    const revArea = `0,100 ${revLine} 100,100`;
    const ordLine = data.map((d, i) => `${x(i)},${yOrders(d.orders)}`).join(' ');

    const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
    const totalOrders = data.reduce((s, d) => s + d.orders, 0);
    const point = active != null ? data[active] : null;

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="font-semibold text-gray-900">Performance — last 30 days</h3>
                    <p className="text-sm text-gray-500">Daily paid revenue and order volume</p>
                </div>
                <div className="flex gap-5 text-right">
                    <div>
                        <p className="flex items-center justify-end gap-1 text-xs text-gray-500">
                            <span className="inline-block h-2 w-2 rounded-full" style={{ background: CHART_PALETTE[0] }} />
                            Revenue
                        </p>
                        <p className="text-lg font-bold text-gray-900">{formatPrice(totalRevenue)}</p>
                    </div>
                    <div>
                        <p className="flex items-center justify-end gap-1 text-xs text-gray-500">
                            <span className="inline-block h-2 w-2 rounded-full" style={{ background: CHART_PALETTE[1] }} />
                            Orders
                        </p>
                        <p className="text-lg font-bold text-gray-900">{totalOrders}</p>
                    </div>
                </div>
            </div>

            <div className="relative mt-6 h-56 w-full" onMouseLeave={() => setActive(null)}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                    <defs>
                        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_PALETTE[0]} stopOpacity="0.28" />
                            <stop offset="100%" stopColor={CHART_PALETTE[0]} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {[0, 25, 50, 75, 100].map((g) => (
                        <line key={g} x1="0" y1={g} x2="100" y2={g} stroke="#f1f5f9" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                    ))}
                    <polygon points={revArea} fill="url(#revFill)" />
                    <polyline
                        points={revLine}
                        fill="none"
                        stroke={CHART_PALETTE[0]}
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                    <polyline
                        points={ordLine}
                        fill="none"
                        stroke={CHART_PALETTE[1]}
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>

                {/* Hover columns */}
                <div className="absolute inset-0 flex">
                    {data.map((d, i) => (
                        <div
                            key={d.date}
                            className="h-full flex-1"
                            onMouseEnter={() => setActive(i)}
                        />
                    ))}
                </div>

                {point && active != null && (
                    <>
                        <div
                            className="pointer-events-none absolute top-0 bottom-0 w-px bg-gray-200"
                            style={{ left: `${x(active)}%` }}
                        />
                        <div
                            className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                            style={{ left: `${x(active)}%`, top: `${yRev(point.revenue)}%`, background: CHART_PALETTE[0] }}
                        />
                        <div
                            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
                            style={{ left: `${Math.min(Math.max(x(active), 12), 88)}%`, top: 0 }}
                        >
                            <p className="font-semibold">{shortDate(point.date)}</p>
                            <p className="text-orange-300">{formatPrice(point.revenue)}</p>
                            <p className="text-indigo-300">{point.orders} orders</p>
                        </div>
                    </>
                )}
            </div>

            <div className="mt-2 flex justify-between text-[11px] text-gray-400">
                <span>{data[0] ? shortDate(data[0].date) : ''}</span>
                <span>{data[n - 1] ? shortDate(data[n - 1].date) : ''}</span>
            </div>
        </div>
    );
}

interface BreakdownItem {
    key: string;
    label: string;
    count: number;
}

/** SVG donut with a legend. */
export function DonutChart({ title, data }: { title: string; data: BreakdownItem[] }) {
    const total = data.reduce((s, d) => s + d.count, 0);
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <div className="mt-4 flex items-center gap-5">
                <div className="relative h-32 w-32 shrink-0">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
                        {total > 0 &&
                            data.map((d, i) => {
                                if (d.count === 0) return null;
                                const fraction = d.count / total;
                                const dash = fraction * circumference;
                                const seg = (
                                    <circle
                                        key={d.key}
                                        cx="50"
                                        cy="50"
                                        r={radius}
                                        fill="none"
                                        stroke={CHART_PALETTE[i % CHART_PALETTE.length]}
                                        strokeWidth="12"
                                        strokeDasharray={`${dash} ${circumference - dash}`}
                                        strokeDashoffset={-offset}
                                    />
                                );
                                offset += dash;
                                return seg;
                            })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">{total}</span>
                        <span className="text-[11px] text-gray-400">total</span>
                    </div>
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                    {data.map((d, i) => (
                        <div key={d.key} className="flex items-center justify-between gap-2 text-sm">
                            <span className="flex min-w-0 items-center gap-2 text-gray-600">
                                <span
                                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }}
                                />
                                <span className="truncate">{d.label}</span>
                            </span>
                            <span className="shrink-0 font-medium text-gray-900">
                                {d.count}
                                <span className="ml-1 text-xs text-gray-400">
                                    {total > 0 ? Math.round((d.count / total) * 100) : 0}%
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface RankItem {
    id: number;
    name: string;
    value: number;
    sub?: string;
}

/** Horizontal ranked bars (top products / categories / sellers). */
export function RankBars({
    title,
    subtitle,
    items,
    accent = CHART_PALETTE[0],
    formatValue = (v: number) => String(v),
    emptyText = 'No data yet.',
}: {
    title: string;
    subtitle?: string;
    items: RankItem[];
    accent?: string;
    formatValue?: (v: number) => string;
    emptyText?: string;
}) {
    const max = Math.max(...items.map((i) => i.value), 1);

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            {items.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">{emptyText}</p>
            ) : (
                <div className="mt-4 space-y-3">
                    {items.map((item) => (
                        <div key={item.id}>
                            <div className="flex items-center justify-between gap-2 text-sm">
                                <span className="min-w-0 truncate text-gray-700">{item.name}</span>
                                <span className="shrink-0 font-medium text-gray-900">{formatValue(item.value)}</span>
                            </div>
                            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full"
                                    style={{ width: `${Math.max(3, (item.value / max) * 100)}%`, background: accent }}
                                />
                            </div>
                            {item.sub && <p className="mt-0.5 text-xs text-gray-400">{item.sub}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
