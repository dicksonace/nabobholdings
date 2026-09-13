<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffAccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_staff_account(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $response = $this->actingAs($admin)->post(route('admin.staff.store'), [
            'name' => 'Desk Staff',
            'email' => 'desk.staff@example.com',
            'mobile' => '',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $staff = User::where('email', 'desk.staff@example.com')->first();
        $this->assertNotNull($staff);
        $this->assertTrue($staff->isStaff());
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('password123', $staff->password));
    }

    public function test_staff_cannot_create_staff_accounts(): void
    {
        $staff = User::factory()->create(['role' => UserRole::Staff]);

        $this->actingAs($staff)->post(route('admin.staff.store'), [
            'name' => 'Another',
            'email' => 'another@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertForbidden();
    }

    public function test_admin_can_recreate_staff_after_soft_delete(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $existing = User::factory()->create([
            'role' => UserRole::Staff,
            'email' => 'reuse@example.com',
        ]);
        $existing->delete();

        $this->actingAs($admin)->post(route('admin.staff.store'), [
            'name' => 'Reuse Staff',
            'email' => 'reuse@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'email' => 'reuse@example.com',
            'role' => 'staff',
            'deleted_at' => null,
        ]);
    }
}
