<?php

namespace App\Notifications;

use App\Enums\WithdrawalStatus;
use App\Models\Withdrawal;
use App\Services\PlatformSettings;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WithdrawalStatusNotification extends Notification implements ShouldQueue
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

        return match ($this->withdrawal->status) {
            WithdrawalStatus::Paid => (new MailMessage)
                ->subject("Withdrawal paid ({$amount})")
                ->greeting('Hello '.$notifiable->name.',')
                ->line("Your withdrawal of {$amount} has been paid.")
                ->line('Network: '.strtoupper((string) $this->withdrawal->network))
                ->line('MoMo: '.$this->withdrawal->momo_number),

            WithdrawalStatus::Rejected => (new MailMessage)
                ->subject("Withdrawal rejected ({$amount})")
                ->greeting('Hello '.$notifiable->name.',')
                ->line("Your withdrawal of {$amount} was rejected.")
                ->line('Reason: '.($this->withdrawal->rejection_reason ?: $this->withdrawal->failure_reason ?: 'Not specified'))
                ->line('The amount has been returned to your available wallet balance.'),

            WithdrawalStatus::Processing => (new MailMessage)
                ->subject("Withdrawal processing ({$amount})")
                ->greeting('Hello '.$notifiable->name.',')
                ->line("Your withdrawal of {$amount} is now being processed."),

            default => (new MailMessage)
                ->subject("Withdrawal update ({$amount})")
                ->greeting('Hello '.$notifiable->name.',')
                ->line("Your withdrawal of {$amount} was updated to: ".$this->withdrawal->status->value),
        };
    }
}
