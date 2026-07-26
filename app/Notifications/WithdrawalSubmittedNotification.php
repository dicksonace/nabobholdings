<?php

namespace App\Notifications;

use App\Models\Withdrawal;
use App\Services\PlatformSettings;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WithdrawalSubmittedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Withdrawal $withdrawal) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $amount = PlatformSettings::formatMoney((float) $this->withdrawal->amount);
        $isRequester = method_exists($notifiable, 'getKey')
            && (int) $notifiable->getKey() === (int) $this->withdrawal->user_id;

        if ($isRequester) {
            return (new MailMessage)
                ->subject("Withdrawal request submitted ({$amount})")
                ->greeting('Hello '.$notifiable->name.',')
                ->line("We received your withdrawal request for {$amount}.")
                ->line('Network: '.strtoupper((string) $this->withdrawal->network))
                ->line('MoMo: '.$this->withdrawal->momo_number)
                ->line('We will process it shortly and email you when it is paid or if we need more info.');
        }

        $user = $this->withdrawal->user;

        return (new MailMessage)
            ->subject("New withdrawal request ({$amount})")
            ->greeting('Hello,')
            ->line(($user?->name ?? 'A user').' requested a withdrawal of '.$amount.'.')
            ->line('Network: '.strtoupper((string) $this->withdrawal->network))
            ->line('MoMo: '.$this->withdrawal->momo_number)
            ->action('Review withdrawals', route('admin.withdrawals.index', ['status' => 'pending']));
    }
}
