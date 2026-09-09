import { Link, useForm, usePage } from '@inertiajs/react';
import { MessageSquare, PenLine, Star } from 'lucide-react';
import { FormEventHandler } from 'react';

import RatingDisplay from '@/components/shop/rating-display';
import { Button } from '@/components/ui/button';
import { Paginated, ProductReview } from '@/types/marketplace';
import { SharedData } from '@/types';

interface ReviewableOrder {
    order_id: number;
    order_item_id: number;
}

interface ProductReviewsProps {
    productSlug: string;
    productRating: number;
    productReviewCount: number;
    reviews: Paginated<ProductReview>;
    reviewable?: ReviewableOrder | null;
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
    const iconClass = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';

    return (
        <span className="inline-flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    className={`${iconClass} ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                />
            ))}
        </span>
    );
}

function formatReviewDate(value?: string): string {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ProductReviews({
    productSlug,
    productRating,
    productReviewCount,
    reviews,
    reviewable,
}: ProductReviewsProps) {
    const { auth } = usePage<SharedData>().props;

    const { data, setData, post, processing, reset, errors } = useForm({
        order_item_id: reviewable?.order_item_id ?? 0,
        rating: 5,
        comment: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('products.reviews.store', productSlug), {
            onSuccess: () => reset('comment'),
            preserveScroll: true,
        });
    };

    const totalReviews = Math.max(productReviewCount, reviews.total);

    return (
        <section id="customer-reviews" className="mt-12 scroll-mt-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-orange-500" />
                    <h2 className="text-xl font-bold text-gray-900">Customer Reviews & Ratings</h2>
                </div>
                <RatingDisplay rating={productRating} reviewCount={totalReviews} size="md" />
            </div>

            <p className="mt-2 text-sm text-gray-500">
                Only verified buyers can leave a star rating and comment after delivery. Ratings update from real reviews only.
            </p>

            {auth.user && reviewable && (
                <form onSubmit={submit} className="mt-6 rounded-xl border-2 border-orange-200 bg-orange-50/60 p-5">
                    <div className="flex items-center gap-2">
                        <PenLine className="h-4 w-4 text-orange-500" />
                        <p className="text-sm font-semibold text-gray-900">Write your review</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">You purchased this item — tap stars to rate, then add your comment.</p>
                    <div className="mt-3 flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} type="button" onClick={() => setData('rating', n)} aria-label={`Rate ${n} stars`}>
                                <Star className={`h-7 w-7 ${n <= data.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                            </button>
                        ))}
                        <span className="ml-2 self-center text-sm font-medium text-amber-600">{data.rating}/5</span>
                    </div>
                    <textarea
                        placeholder="Share your experience — quality, delivery, would you recommend it?"
                        value={data.comment}
                        onChange={(e) => setData('comment', e.target.value)}
                        className="mt-3 min-h-[88px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-300"
                        required
                        maxLength={1000}
                    />
                    {(errors.rating || errors.comment || errors.order_item_id) && (
                        <p className="mt-2 text-sm text-red-600">
                            {errors.rating || errors.comment || errors.order_item_id}
                        </p>
                    )}
                    <Button type="submit" size="sm" disabled={processing} className="mt-3 bg-orange-500 hover:bg-orange-600">
                        {processing ? 'Posting…' : 'Post Review'}
                    </Button>
                </form>
            )}

            {auth.user && !reviewable && (
                <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                    <p className="font-medium text-gray-800">How to leave a review</p>
                    <ol className="mt-2 list-inside list-decimal space-y-1 text-gray-500">
                        <li>Buy this product and complete checkout</li>
                        <li>Wait until the order is marked as <strong>Delivered</strong></li>
                        <li>Come back here — a star rating and comment box will appear</li>
                    </ol>
                    <Link href={route('orders.index')} className="mt-3 inline-block text-orange-500 hover:underline">
                        View your orders →
                    </Link>
                </div>
            )}

            {!auth.user && (
                <p className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    <Link href={route('login')} className="text-orange-500 hover:underline">Sign in</Link> to leave a review after purchase.
                </p>
            )}

            <div className="mt-6 divide-y">
                {reviews.data.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-500">No reviews yet. Be the first verified buyer to share your experience!</p>
                ) : (
                    reviews.data.map((review) => (
                        <article key={review.id} className="py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-medium text-gray-900">{review.user?.name ?? 'Customer'}</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <StarRating rating={review.rating} />
                                        <span className="text-xs text-gray-400">{formatReviewDate(review.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                            {review.comment && (
                                <p className="mt-2 text-sm leading-relaxed text-gray-600">{review.comment}</p>
                            )}
                            {review.seller_reply && (
                                <div className="mt-3 rounded-lg border border-orange-100 bg-orange-50/70 px-3 py-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Seller reply</p>
                                    <p className="mt-1 text-sm text-gray-700">{review.seller_reply}</p>
                                    {review.seller_replied_at && (
                                        <p className="mt-1 text-xs text-gray-400">{formatReviewDate(review.seller_replied_at)}</p>
                                    )}
                                </div>
                            )}
                        </article>
                    ))
                )}
            </div>

            {reviews.last_page > 1 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {reviews.links.map((link, i) =>
                        link.url ? (
                            <Link
                                key={i}
                                href={link.url}
                                preserveScroll
                                className={`rounded-md px-3 py-1.5 text-sm ${
                                    link.active ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : null,
                    )}
                </div>
            )}
        </section>
    );
}
