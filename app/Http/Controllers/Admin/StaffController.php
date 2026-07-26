<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(): Response
    {
        $staff = User::query()
            ->where('role', UserRole::Staff)
            ->latest()
            ->paginate(20);

        return Inertia::render('admin/staff/index', [
            'staff' => $staff,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'mobile' => ['nullable', 'string', 'max:20', 'unique:users,mobile'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'mobile' => $validated['mobile'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => UserRole::Staff,
        ]);

        return back()->with('success', 'Staff account created. They can sign in at /admin/login.');
    }

    public function update(Request $request, User $staff): RedirectResponse
    {
        abort_unless($staff->isStaff(), 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($staff->id)],
            'mobile' => ['nullable', 'string', 'max:20', Rule::unique('users', 'mobile')->ignore($staff->id)],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        $staff->name = $validated['name'];
        $staff->email = strtolower($validated['email']);
        $staff->mobile = $validated['mobile'] ?? null;

        if (! empty($validated['password'])) {
            $staff->password = Hash::make($validated['password']);
        }

        $staff->save();

        return back()->with('success', 'Staff account updated.');
    }

    public function destroy(User $staff): RedirectResponse
    {
        abort_unless($staff->isStaff(), 404);

        $staff->delete();

        return back()->with('success', 'Staff account removed.');
    }
}
