<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConversationListTest extends TestCase
{
    use RefreshDatabase;

    public function test_messages_index_skips_conversations_with_soft_deleted_participants(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $buyer = User::factory()->create(['role' => UserRole::Buyer]);
        $goneBuyer = User::factory()->create(['role' => UserRole::Buyer]);

        Conversation::create([
            'buyer_id' => $goneBuyer->id,
            'seller_id' => $owner->id,
            'last_message_at' => now()->subMinute(),
        ]);

        Conversation::create([
            'buyer_id' => $buyer->id,
            'seller_id' => $owner->id,
            'last_message_at' => now(),
        ]);

        $goneBuyer->delete();

        $this->actingAs($owner)
            ->getJson(route('chat.index'))
            ->assertOk()
            ->assertJsonCount(1, 'conversations')
            ->assertJsonPath('conversations.0.other.id', $buyer->id);
    }

    public function test_admin_customer_chats_page_loads(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $this->actingAs($admin)
            ->get(route('admin.chats.index'))
            ->assertOk();
    }
}
