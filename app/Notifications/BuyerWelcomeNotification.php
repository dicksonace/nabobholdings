<?php

namespace App\Notifications;

use App\Services\PlatformSettings;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BuyerWelcomeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $brand = PlatformSettings::brandName();

        return (new MailMessage)
            ->subject("Welcome to {$brand}")
            ->greeting('Hello '.$notifiable->name.'!')
            ->line("Thanks for joining {$brand}. Your buyer account is ready.")
            ->line('Browse products, place orders, and track delivery from your account.')
            ->action('Start shopping', route('home'));
    }
}
