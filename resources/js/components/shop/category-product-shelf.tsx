import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

import ProductCard from '@/components/shop/product-card';
import { Product } from '@/types/marketplace';

export type CategoryShelf = {
    id: number;
    name: string;
    slug: string;
    products_count: number;
    products: Product[];
};

type CategoryProductShelfProps = {
    shelf: CategoryShelf;
    onAddToCart?: (productId: number) => void;
};

export default function CategoryProductShelf({ shelf, onAddToCart }: CategoryProductShelfProps) {
    if (!shelf.products.length) return null;

    return (
        <section className="mb-8">
            <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-[#0f2744] sm:text-xl">{shelf.name}</h2>
                    <p className="text-xs text-gray-500 sm:text-sm">
                        {shelf.products_count} product{shelf.products_count === 1 ? '' : 's'} in this category
                    </p>
                </div>
                <Link
                    href={route('home', { category: shelf.id })}
                    className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-[#d97706] hover:text-[#b45309]"
                >
                    See all
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </div>
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 scrollbar-thin sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 md:grid-cols-4 lg:grid-cols-4">
                {shelf.products.map((product) => (
                    <div key={product.id} className="w-[9.5rem] shrink-0 sm:w-auto">
                        <ProductCard product={product} onAddToCart={onAddToCart} />
                    </div>
                ))}
            </div>
        </section>
    );
}
