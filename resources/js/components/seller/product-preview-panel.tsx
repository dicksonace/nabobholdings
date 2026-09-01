import { useMemo } from 'react';

import ProductCard from '@/components/shop/product-card';
import { Category, getCurrencySymbol, Product, SellerProfile, productImageUrl, PRODUCT_IMAGE_PLACEHOLDER } from '@/types/marketplace';

export interface ProductPreviewData {
    name: string;
    description: string;
    price: string;
    discount_price: string;
    free_shipping: boolean;
    delivery_fee: string;
    delivery_days: string;
    brand: string;
    condition: string;
    quantity: string;
    category_id: string;
    imagePreviews: string[];
}

interface ProductPreviewPanelProps {
    data: ProductPreviewData;
    categories: Category[];
    profile?: SellerProfile | null;
    previewMode: 'grid' | 'detail';
    onPreviewModeChange: (mode: 'grid' | 'detail') => void;
    /** Hide delivery/shipping badges until the seller reaches the shipping step. */
    showShippingBadges?: boolean;
}

export default function ProductPreviewPanel({
    data,
    categories,
    profile,
    previewMode,
    onPreviewModeChange,
    showShippingBadges = true,
}: ProductPreviewPanelProps) {
    const category = categories.find((c) => String(c.id) === data.category_id);
    const price = parseFloat(data.price) || 0;
    const discount = data.discount_price ? parseFloat(data.discount_price) : null;
    const hasDiscount = discount !== null && !Number.isNaN(discount) && discount > 0 && discount < price;
    const effectivePrice = hasDiscount ? discount! : price;

    const previewProduct = useMemo((): Product => ({
        id: 0,
        seller_id: 0,
        category_id: data.category_id ? Number(data.category_id) : null,
        name: data.name || 'Product name',
        slug: 'preview',
        description: data.description,
        price,
        discount_price: hasDiscount ? discount : null,
        quantity: parseInt(data.quantity, 10) || 0,
        status: 'approved',
        free_shipping: showShippingBadges ? data.free_shipping : false,
        in_ghana: true,
        rating: 0,
        review_count: 0,
        views: 0,
        brand: data.brand,
        images: data.imagePreviews.map((src, i) => ({
            id: i,
            product_id: 0,
            path: src,
            is_primary: i === 0,
            sort_order: i,
        })),
        category,
        seller: profile ? {
            id: 0,
            name: profile.business_name ?? 'Seller',
            seller_profile: profile,
        } : undefined,
    }), [data, categories, category, profile, price, discount, hasDiscount, showShippingBadges]);

    return (
        <div className="sticky top-20 rounded-2xl border border-gray-200 bg-white shadow-sm lg:top-24">
            <div className="border-b border-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-900">Live preview</p>
                <p className="text-xs text-gray-500">How buyers will see your listing</p>
                <div className="mt-3 flex rounded-lg bg-gray-100 p-1">
                    <button
                        type="button"
                        onClick={() => onPreviewModeChange('grid')}
                        className={`flex-1 rounded-md py-1.5 text-xs font-medium ${previewMode === 'grid' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}
                    >
                        Store grid
                    </button>
                    <button
                        type="button"
                        onClick={() => onPreviewModeChange('detail')}
                        className={`flex-1 rounded-md py-1.5 text-xs font-medium ${previewMode === 'detail' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}
                    >
                        Product page
                    </button>
                </div>
            </div>

            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-4">
                {previewMode === 'grid' ? (
                    <div className="mx-auto max-w-[220px]">
                        <ProductCard product={previewProduct} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-orange-50/30 p-6">
                            {data.imagePreviews[0] ? (
                                <img
                                    src={productImageUrl(data.imagePreviews[0])}
                                    alt={data.name || 'Product preview'}
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => {
                                        e.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER;
                                    }}
                                />
                            ) : (
                                <img
                                    src={PRODUCT_IMAGE_PLACEHOLDER}
                                    alt=""
                                    className="max-h-full max-w-full object-contain opacity-80"
                                />
                            )}
                        </div>
                        <div>
                            {category && <p className="text-xs font-semibold uppercase text-blue-500">{category.name}</p>}
                            <h2 className="text-lg font-bold text-gray-900">{data.name || 'Product name'}</h2>
                            <p className="mt-2 text-2xl font-bold text-orange-500">
                                {getCurrencySymbol()} {effectivePrice.toFixed(2)}
                            </p>
                            {hasDiscount && (
                                <p className="text-sm text-gray-400 line-through">{getCurrencySymbol()} {price.toFixed(2)}</p>
                            )}
                        </div>
                        {showShippingBadges && data.free_shipping ? (
                            <p className="text-sm text-emerald-600">✓ Free delivery</p>
                        ) : showShippingBadges && data.delivery_fee ? (
                            <p className="text-sm text-gray-600">Delivery: {getCurrencySymbol()} {parseFloat(data.delivery_fee).toFixed(2)}</p>
                        ) : null}
                        {data.delivery_days && (
                            <p className="text-xs text-gray-500">Est. delivery: {data.delivery_days} days</p>
                        )}
                        {data.description && (
                            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 whitespace-pre-wrap">{data.description}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
