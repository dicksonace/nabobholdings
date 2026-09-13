<?php

namespace App\Notifications;

use App\Models\Checkout;
use App\Models\Order;
use App\Services\PlatformSettings;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderPlacedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Order $order,
        public bool $cashOnDelivery = false,
        public ?Checkout $checkout = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $checkout = $this->checkout ?? $this->order->checkout;
        $number = $checkout?->checkout_number ?? $this->order->order_number;
        $total = $checkout?->total ?? $this->order->total;

        $message = $this->cashOnDelivery
            ? 'Your cash-on-delivery order has been placed.'
            : 'Your order has been placed. Complete payment to confirm.';

        return (new MailMessage)
            ->subject("Order {$number} placed")
            ->greeting('Hello '.$notifiable->name.'!')
            ->line($message)
            ->line('Order total: '.PlatformSettings::formatMoney((float) $total))
            ->action('View Order', $checkout ? route('checkouts.show', $checkout) : route('orders.show', $this->order));
    }

}
