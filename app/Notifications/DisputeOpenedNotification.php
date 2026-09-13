<?php

namespace App\Notifications;

use App\Models\Dispute;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DisputeOpenedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Dispute $dispute) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Dispute opened')
            ->greeting('Hello '.$notifiable->name.',')
            ->line("A dispute has been opened for order {$this->dispute->order->order_number}.")
            ->line("Reason: {$this->dispute->reason}")
            ->action('View Details', route('orders.show', $this->dispute->order_id));
    }

}
