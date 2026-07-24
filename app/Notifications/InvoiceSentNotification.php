<?php

namespace App\Notifications;

use App\Channels\SmsChannel;
use App\Models\Invoice;
use App\Services\PlatformSettings;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvoiceSentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Invoice $invoice) {}

    public function via(object $notifiable): array
    {
        return ['mail', SmsChannel::class];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $invoice = $this->invoice->load('checkout');
        $checkout = $invoice->checkout;

        $message = (new MailMessage)
            ->subject("Invoice {$invoice->invoice_number} — {$checkout->checkout_number}")
            ->greeting('Hello '.$notifiable->name.'!')
            ->line('Thank you for your purchase on Nabob Holdings.');

        foreach ($invoice->line_items as $line) {
            $message->line(sprintf(
                '%s × %d — %s',
                $line['product_name'],
                $line['quantity'],
                PlatformSettings::formatMoney($line['total']),
            ));
        }

        return $message
            ->line('Subtotal: '.PlatformSettings::formatMoney((float) $invoice->subtotal))
            ->line('Total: '.PlatformSettings::formatMoney((float) $invoice->total))
            ->line('Payment status: '.ucfirst($invoice->payment_status ?? 'pending'))
            ->line('Invoice date: '.$invoice->issued_at->format('d M Y'))
            ->action('View on Nabob Holdings', route('checkouts.show', $checkout));
    }

    public function toSms(object $notifiable): string
    {
        return "Nabob Holdings: Invoice {$this->invoice->invoice_number} for ".PlatformSettings::formatMoney((float) $this->invoice->total).'. Payment: '.($this->invoice->payment_status ?? 'pending').'.';
    }
}
