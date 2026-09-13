<?php

namespace App\Notifications;

use App\Models\Dispute;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DisputeResolvedNotification extends Notification implements ShouldQueue
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
            ->subject('Dispute resolved')
            ->greeting('Hello '.$notifiable->name.',')
            ->line("Your dispute for order {$this->dispute->order->order_number} has been resolved.")
            ->line('Outcome: '.str_replace('_', ' ', $this->dispute->status->value))
            ->when($this->dispute->resolution_notes, fn ($m) => $m->line($this->dispute->resolution_notes));
    }

}
