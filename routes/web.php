<?php

use App\Http\Controllers\Admin\BuyerAnnouncementController as AdminBuyerAnnouncementController;
use App\Http\Controllers\Admin\BuyerController as AdminBuyerController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\ChatOversightController as AdminChatOversightController;
use App\Http\Controllers\Admin\ContactMessageController as AdminContactMessageController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\DisputeController as AdminDisputeController;
use App\Http\Controllers\Admin\GuideController as AdminGuideController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\BrandSettingsController as AdminBrandSettingsController;
use App\Http\Controllers\Admin\ManualFundingSettingsController as AdminManualFundingSettingsController;
use App\Http\Controllers\Admin\ManualTopUpController as AdminManualTopUpController;
use App\Http\Controllers\Admin\WalletFundingController as AdminWalletFundingController;
use App\Http\Controllers\Admin\WithdrawalController as AdminWithdrawalController;
use App\Http\Controllers\WalletManualTopUpController;
use App\Http\Controllers\Chat\ConversationController as ChatConversationController;
use App\Http\Controllers\Chat\MessageController as ChatMessageController;
use App\Http\Controllers\Chat\NotificationController as ChatNotificationController;
use App\Http\Controllers\PaystackWebhookController;
use App\Http\Controllers\Seller\CouponController as SellerCouponController;
use App\Http\Controllers\Seller\DashboardController as SellerDashboardController;
use App\Http\Controllers\Seller\DisputeController as SellerDisputeController;
use App\Http\Controllers\Seller\OrderController as SellerOrderController;
use App\Http\Controllers\Seller\PaymentMethodController as SellerPaymentMethodController;
use App\Http\Controllers\Seller\ProductController as SellerProductController;
use App\Http\Controllers\Seller\ReviewController as SellerReviewController;
use App\Http\Controllers\Seller\StoreCustomizationController as SellerStoreCustomizationController;
use App\Http\Controllers\Seller\WalletController as SellerWalletController;
use App\Http\Controllers\Shop\AccountController;
use App\Http\Controllers\Shop\AddressController;
use App\Http\Controllers\Shop\CartController;
use App\Http\Controllers\Shop\CheckoutController;
use App\Http\Controllers\Shop\CheckoutSessionController;
use App\Http\Controllers\Shop\ContactController;
use App\Http\Controllers\Shop\DisputeController;
use App\Http\Controllers\Shop\FaqController;
use App\Http\Controllers\Shop\HomeController;
use App\Http\Controllers\Shop\ImageSearchController;
use App\Http\Controllers\Shop\InvoiceController;
use App\Http\Controllers\Shop\OrderController;
use App\Http\Controllers\Shop\ProductController;
use App\Http\Controllers\Shop\ReviewController;
use App\Http\Controllers\Shop\SearchController;
use App\Http\Controllers\Shop\SellerReportController;
use App\Http\Controllers\Shop\StoreController;
use App\Http\Controllers\Shop\WalletController as BuyerWalletController;
use App\Http\Controllers\Shop\WishlistController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/matches-for-recent-views', [HomeController::class, 'matchesForRecentViews'])->name('home.matches-for-recent-views');
Route::get('/search', [SearchController::class, 'index'])->name('search');
Route::get('/search/suggest', [SearchController::class, 'suggest'])->name('search.suggest');
Route::get('/search/image', [ImageSearchController::class, 'create'])->name('search.image');
Route::post('/search/image', [ImageSearchController::class, 'store'])->name('search.image.store');
Route::get('/products/{slug}', [ProductController::class, 'show'])->name('products.show');
Route::get('/store/{slug}', [StoreController::class, 'show'])->name('store.show');
Route::get('/contact', [ContactController::class, 'show'])->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');
Route::get('/faq', [FaqController::class, 'show'])->name('faq');

Route::post('/webhooks/paystack', [PaystackWebhookController::class, 'handle']);

Route::middleware(['auth'])->group(function () {
    Route::post('/sellers/report', [SellerReportController::class, 'store'])->name('sellers.report');

    Route::get('/cart', [CartController::class, 'index'])->middleware('buyer.shop')->name('cart.index');
    Route::post('/cart', [CartController::class, 'store'])->middleware('buyer.shop')->name('cart.store');
    Route::patch('/cart/{cartItem}', [CartController::class, 'update'])->middleware('buyer.shop')->name('cart.update');
    Route::delete('/cart/{cartItem}', [CartController::class, 'destroy'])->middleware('buyer.shop')->name('cart.destroy');

    Route::get('/checkout', [CheckoutController::class, 'index'])->middleware('buyer.shop')->name('checkout.index');
    Route::post('/checkout', [CheckoutController::class, 'store'])->middleware('buyer.shop')->name('checkout.store');
    Route::get('/checkout/direct-pay', [CheckoutController::class, 'directPay'])->middleware('buyer.shop')->name('checkout.direct-pay');
    Route::post('/checkout/direct-pay/{sellerId}', [CheckoutController::class, 'submitDirectPay'])->middleware('buyer.shop')->name('checkout.direct-pay.submit');
    Route::get('/checkout/payment/{checkout}', [CheckoutController::class, 'payment'])->middleware('buyer.shop')->name('checkout.payment');
    Route::get('/checkout/callback', [CheckoutController::class, 'callback'])->middleware('buyer.shop')->name('checkout.callback');
    Route::post('/checkout/payment/{checkout}/initialize', [CheckoutController::class, 'initializePayment'])->middleware('buyer.shop')->name('checkout.initialize');
    Route::get('/checkouts/{checkout}', [CheckoutSessionController::class, 'show'])->name('checkouts.show');
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::get('/invoices/{invoice}/print', [InvoiceController::class, 'print'])->name('invoices.print');
    Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf'])->name('invoices.pdf');
    Route::post('/orders/{order}/direct-payment', [CheckoutController::class, 'submitDirectReference'])->middleware('buyer.shop')->name('orders.direct-payment');

    Route::get('/my-orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/my-orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::post('/my-orders/{order}/items/{orderItem}/confirm-delivery', [OrderController::class, 'confirmDelivery'])->name('orders.confirm-delivery');
    Route::post('/my-orders/{order}/reviews', [ReviewController::class, 'store'])->name('orders.reviews.store');
    Route::post('/my-orders/{order}/disputes', [DisputeController::class, 'store'])->name('orders.disputes.store');
    Route::post('/disputes/{dispute}/cancel', [DisputeController::class, 'cancel'])->name('disputes.cancel');
    Route::post('/products/{product:slug}/reviews', [ReviewController::class, 'storeForProduct'])->name('products.reviews.store');

    Route::get('/wishlist', [WishlistController::class, 'index'])->name('wishlist.index');
    Route::post('/wishlist/toggle', [WishlistController::class, 'toggle'])->name('wishlist.toggle');
    Route::delete('/wishlist/{wishlist}', [WishlistController::class, 'destroy'])->name('wishlist.destroy');

    Route::get('/account', [AccountController::class, 'index'])->middleware('buyer.shop')->name('account.index');

    Route::get('/addresses', [AddressController::class, 'index'])->middleware('buyer.shop')->name('addresses.index');
    Route::get('/addresses/create', [AddressController::class, 'create'])->middleware('buyer.shop')->name('addresses.create');
    Route::post('/addresses', [AddressController::class, 'store'])->middleware('buyer.shop')->name('addresses.store');
    Route::get('/addresses/{address}/edit', [AddressController::class, 'edit'])->middleware('buyer.shop')->name('addresses.edit');
    Route::put('/addresses/{address}', [AddressController::class, 'update'])->middleware('buyer.shop')->name('addresses.update');
    Route::delete('/addresses/{address}', [AddressController::class, 'destroy'])->middleware('buyer.shop')->name('addresses.destroy');
    Route::post('/addresses/{address}/default', [AddressController::class, 'setDefault'])->middleware('buyer.shop')->name('addresses.default');

    Route::get('/wallet', [BuyerWalletController::class, 'index'])->name('wallet.index');
    Route::post('/wallet/add-funds', [BuyerWalletController::class, 'addFunds'])->name('wallet.add-funds');
    Route::get('/wallet/callback', [BuyerWalletController::class, 'callback'])->name('wallet.callback');
    Route::post('/wallet/withdraw', [BuyerWalletController::class, 'withdraw'])->name('wallet.withdraw');
    Route::get('/wallet/manual-top-up', [WalletManualTopUpController::class, 'show'])->name('wallet.manual-top-up');
    Route::post('/wallet/manual-top-up', [WalletManualTopUpController::class, 'store'])->name('wallet.manual-top-up.store');

    Route::get('/messages', [ChatConversationController::class, 'index'])->name('chat.index');
    Route::post('/messages', [ChatConversationController::class, 'store'])->name('chat.store');
    Route::get('/messages/{conversation}', [ChatConversationController::class, 'show'])->name('chat.show');
    Route::get('/messages/{conversation}/poll', [ChatConversationController::class, 'poll'])->name('chat.poll');
    Route::post('/messages/{conversation}/send', [ChatMessageController::class, 'store'])->name('chat.messages.store');
    Route::post('/messages/{conversation}/image', [ChatMessageController::class, 'uploadImage'])->name('chat.messages.image');
    Route::patch('/messages/{conversation}/messages/{message}', [ChatMessageController::class, 'update'])->name('chat.messages.update');
    Route::delete('/messages/{conversation}/messages/{message}', [ChatMessageController::class, 'destroy'])->name('chat.messages.destroy');
    Route::post('/messages/{conversation}/signal', [ChatMessageController::class, 'signal'])->name('chat.signal');

    Route::get('/notifications', [ChatNotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/read-all', [ChatNotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::post('/notifications/{notification}/read', [ChatNotificationController::class, 'markRead'])->name('notifications.read');
    Route::get('/notifications/counts', [ChatNotificationController::class, 'counts'])->name('notifications.counts');
});

Route::prefix('manage')->name('manage.')->middleware(['auth', 'role:admin,seller'])->group(function () {
    Route::get('/pending', [SellerDashboardController::class, 'pending'])->name('pending');

    Route::middleware(['seller.approved'])->group(function () {
        Route::get('/store-setup', [SellerStoreCustomizationController::class, 'setup'])->name('store-setup');
        Route::get('/store-appearance', [SellerStoreCustomizationController::class, 'appearance'])->name('store-appearance.index');
        Route::post('/store-appearance/draft', [SellerStoreCustomizationController::class, 'updateDraft'])->name('store-appearance.draft');
        Route::post('/store-appearance/publish', [SellerStoreCustomizationController::class, 'publish'])->name('store-appearance.publish');
        Route::post('/store-appearance/reset', [SellerStoreCustomizationController::class, 'reset'])->name('store-appearance.reset');
        Route::post('/store-appearance/complete-setup', [SellerStoreCustomizationController::class, 'completeSetup'])->name('store-appearance.complete-setup');

        Route::middleware(['seller.store-setup'])->group(function () {
            Route::get('/dashboard', [SellerDashboardController::class, 'index'])->name('dashboard');

            Route::get('/products', [SellerProductController::class, 'index'])->name('products.index');
            Route::get('/products/create', [SellerProductController::class, 'create'])->name('products.create');
            Route::post('/products', [SellerProductController::class, 'store'])->name('products.store');
            Route::post('/products/bulk', [SellerProductController::class, 'bulk'])->name('products.bulk');
            Route::get('/products/{product}/edit', [SellerProductController::class, 'edit'])->name('products.edit');
            Route::put('/products/{product}', [SellerProductController::class, 'update'])->name('products.update');
            Route::delete('/products/{product}', [SellerProductController::class, 'destroy'])->name('products.destroy');
            Route::post('/products/{product}/restore', [SellerProductController::class, 'restore'])->name('products.restore');
            Route::post('/products/{product}/duplicate', [SellerProductController::class, 'duplicate'])->name('products.duplicate');
            Route::patch('/products/{product}/visibility', [SellerProductController::class, 'toggleVisibility'])->name('products.visibility');
            Route::get('/products/{product}/analytics', [SellerProductController::class, 'analytics'])->name('products.analytics');
            Route::get('/products/{product}/reviews', [SellerProductController::class, 'reviews'])->name('products.reviews');

            Route::get('/promotions', [SellerCouponController::class, 'index'])->name('promotions.index');
            Route::post('/promotions', [SellerCouponController::class, 'store'])->name('promotions.store');
            Route::patch('/promotions/{coupon}', [SellerCouponController::class, 'update'])->name('promotions.update');
            Route::delete('/promotions/{coupon}', [SellerCouponController::class, 'destroy'])->name('promotions.destroy');

            Route::get('/reviews', [SellerReviewController::class, 'index'])->name('reviews.index');
            Route::post('/reviews/{review}/reply', [SellerReviewController::class, 'reply'])->name('reviews.reply');

            Route::get('/orders', [SellerOrderController::class, 'index'])->name('orders.index');
            Route::get('/orders/stage/{stage}', [SellerOrderController::class, 'stage'])->name('orders.stage');
            Route::get('/orders/{orderItem}', [SellerOrderController::class, 'show'])->name('orders.show');
            Route::get('/orders/{orderItem}/print', [SellerOrderController::class, 'print'])->name('orders.print');
            Route::get('/orders/{orderItem}/pdf', [SellerOrderController::class, 'pdf'])->name('orders.pdf');
            Route::patch('/orders/{orderItem}', [SellerOrderController::class, 'update'])->name('orders.update');
            Route::post('/orders/{orderItem}/reject', [SellerOrderController::class, 'reject'])->name('orders.reject');

            Route::get('/refunds', [SellerDisputeController::class, 'index'])->name('refunds.index');

            Route::get('/wallet', [SellerWalletController::class, 'index'])->name('wallet');
            Route::get('/wallet/transactions', [SellerWalletController::class, 'transactions'])->name('wallet.transactions');
            Route::get('/wallet/transactions/{transaction}', [SellerWalletController::class, 'showTransaction'])->name('wallet.transactions.show');
            Route::get('/wallet/withdrawals', [SellerWalletController::class, 'withdrawals'])->name('wallet.withdrawals');
            Route::get('/wallet/withdrawals/{withdrawal}', [SellerWalletController::class, 'showWithdrawal'])->name('wallet.withdrawals.show');
            Route::post('/wallet/withdraw', [SellerWalletController::class, 'withdraw'])->name('wallet.withdraw');
            Route::post('/wallet/add-funds', [SellerWalletController::class, 'addFunds'])->name('wallet.add-funds');
            Route::get('/wallet/callback', [SellerWalletController::class, 'callback'])->name('wallet.callback');
            Route::post('/wallet/payout-methods', [SellerWalletController::class, 'storePayoutMethod'])->name('wallet.payout-methods.store');
            Route::delete('/wallet/payout-methods/{payoutMethod}', [SellerWalletController::class, 'destroyPayoutMethod'])->name('wallet.payout-methods.destroy');
            Route::get('/wallet/manual-top-up', [WalletManualTopUpController::class, 'show'])->name('wallet.manual-top-up');
            Route::post('/wallet/manual-top-up', [WalletManualTopUpController::class, 'store'])->name('wallet.manual-top-up.store');

            Route::get('/payment-methods', [SellerPaymentMethodController::class, 'index'])->name('payment-methods.index');
            Route::post('/payment-methods/settings', [SellerPaymentMethodController::class, 'updateSettings'])->name('payment-methods.settings');
            Route::post('/payment-methods', [SellerPaymentMethodController::class, 'store'])->name('payment-methods.store');
            Route::delete('/payment-methods/{method}', [SellerPaymentMethodController::class, 'destroy'])->name('payment-methods.destroy');
            Route::post('/orders/{order}/confirm-direct-payment', [SellerPaymentMethodController::class, 'confirmDirectPayment'])->name('orders.confirm-direct-payment');
            Route::post('/orders/{order}/reject-direct-payment', [SellerPaymentMethodController::class, 'rejectDirectPayment'])->name('orders.reject-direct-payment');
        });
    });
});

Route::prefix('admin')->name('admin.')->middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

    Route::get('/guide', AdminGuideController::class)->name('guide');

    Route::get('/brand', [AdminBrandSettingsController::class, 'edit'])->name('brand.settings');
    Route::post('/brand', [AdminBrandSettingsController::class, 'update'])->name('brand.settings.update');

    Route::get('/categories', [AdminCategoryController::class, 'index'])->name('categories.index');
    Route::post('/categories', [AdminCategoryController::class, 'store'])->name('categories.store');
    Route::put('/categories/{category}', [AdminCategoryController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy'])->name('categories.destroy');

    Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/unprocessed', [AdminOrderController::class, 'unprocessed'])->name('orders.unprocessed');
    Route::post('/orders/items/{orderItem}/cancel-unprocessed', [AdminOrderController::class, 'cancelUnprocessed'])->name('orders.unprocessed.cancel');
    Route::get('/orders/awaiting-direct', [AdminOrderController::class, 'awaitingDirectPayment'])->name('orders.awaiting-direct');
    Route::get('/orders/confirm-delivery', [AdminOrderController::class, 'awaitingConfirmation'])->name('orders.confirm-delivery');
    Route::post('/orders/items/{orderItem}/confirm-delivery', [AdminOrderController::class, 'confirmDelivery'])->name('orders.confirm-delivery.store');
    Route::get('/orders/cancellations', [AdminOrderController::class, 'cancellations'])->name('orders.cancellations');
    Route::get('/orders/{order}', [AdminOrderController::class, 'show'])->name('orders.show');

    Route::get('/withdrawals', [AdminWithdrawalController::class, 'index'])->name('withdrawals.index');
    Route::post('/withdrawals/{withdrawal}/start', [AdminWithdrawalController::class, 'start'])->name('withdrawals.start');
    Route::post('/withdrawals/{withdrawal}/approve', [AdminWithdrawalController::class, 'approve'])->name('withdrawals.approve');
    Route::post('/withdrawals/{withdrawal}/reject', [AdminWithdrawalController::class, 'reject'])->name('withdrawals.reject');

    Route::get('/wallet-funding', [AdminWalletFundingController::class, 'index'])->name('wallet-funding.index');
    Route::post('/wallet-funding', [AdminWalletFundingController::class, 'store'])->name('wallet-funding.store');

    Route::get('/manual-funding/settings', [AdminManualFundingSettingsController::class, 'edit'])->name('manual-funding.settings');
    Route::post('/manual-funding/settings', [AdminManualFundingSettingsController::class, 'update'])->name('manual-funding.settings.update');
    Route::get('/manual-top-ups', [AdminManualTopUpController::class, 'index'])->name('manual-top-ups.index');
    Route::post('/manual-top-ups/{topUp}/approve', [AdminManualTopUpController::class, 'approve'])->name('manual-top-ups.approve');
    Route::post('/manual-top-ups/{topUp}/reject', [AdminManualTopUpController::class, 'reject'])->name('manual-top-ups.reject');

    Route::get('/disputes', [AdminDisputeController::class, 'index'])->name('disputes.index');
    Route::post('/disputes/{dispute}/review', [AdminDisputeController::class, 'review'])->name('disputes.review');
    Route::post('/disputes/{dispute}/resolve', [AdminDisputeController::class, 'resolve'])->name('disputes.resolve');

    Route::get('/contact-messages', [AdminContactMessageController::class, 'index'])->name('contact-messages.index');
    Route::patch('/contact-messages/{contactMessage}/read', [AdminContactMessageController::class, 'markRead'])->name('contact-messages.read');

    Route::get('/buyer-announcements', [AdminBuyerAnnouncementController::class, 'index'])->name('buyer-announcements.index');
    Route::get('/buyer-announcements/create', [AdminBuyerAnnouncementController::class, 'create'])->name('buyer-announcements.create');
    Route::post('/buyer-announcements', [AdminBuyerAnnouncementController::class, 'store'])->name('buyer-announcements.store');

    Route::get('/buyers', [AdminBuyerController::class, 'index'])->name('buyers.index');
    Route::get('/buyers/{buyer}', [AdminBuyerController::class, 'show'])->name('buyers.show');

    Route::get('/chats', [AdminChatOversightController::class, 'index'])->name('chats.index');
    Route::get('/chats/{conversation}', [AdminChatOversightController::class, 'show'])->name('chats.show');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

// Legacy /seller/* panel URLs → /manage/* (after auth so seller/login stays intact)
Route::any('/seller/{path}', function (string $path) {
    $target = '/manage/'.$path;
    $qs = request()->getQueryString();

    return redirect($qs ? "{$target}?{$qs}" : $target, 301);
})->where('path', '.*')->name('seller.legacy-redirect');

Route::redirect('/seller', '/manage/dashboard', 301);
