<?php

namespace App\Notifications;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ContactMessageReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public ContactMessage $message) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $subjectLabel = str_replace('_', ' ', $this->message->subject);

        $mail = (new MailMessage)
            ->subject('New contact message: '.$subjectLabel)
            ->greeting('Hello,')
            ->line('A new message was submitted on the contact form.')
            ->line('From: '.$this->message->name.' ('.$this->message->email.')');

        if ($this->message->phone) {
            $mail->line('Phone: '.$this->message->phone);
        }

        return $mail
            ->line('Subject: '.$subjectLabel)
            ->line($this->message->message)
            ->action('Open inbox', route('admin.contact-messages.index'));
    }
}
