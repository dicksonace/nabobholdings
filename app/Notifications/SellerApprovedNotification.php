<?php

namespace App\Notifications;

use App\Models\SellerProfile;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SellerApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public SellerProfile $profile) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Seller application approved!')
            ->greeting('Congratulations '.$notifiable->name.'!')
            ->line('Your Nabob Holdings seller account has been approved.')
            ->line('You can now list products and start selling.')
            ->action('Go to Dashboard', route('manage.dashboard'));
    }

}
