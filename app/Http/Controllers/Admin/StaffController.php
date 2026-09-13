<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->whereNull('deleted_at'),
            ],
            'mobile' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('users', 'mobile')->whereNull('deleted_at'),
            ],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $email = strtolower(trim($validated['email']));
        $mobile = filled($validated['mobile'] ?? null) ? trim((string) $validated['mobile']) : null;

        // Soft-deleted users still occupy the unique email index — restore instead of failing.
        $existing = User::withTrashed()->where('email', $email)->first();
        if ($existing?->trashed()) {
            $existing->restore();
            $existing->fill([
                'name' => $validated['name'],
                'mobile' => $mobile,
                'password' => $validated['password'],
                'role' => UserRole::Staff,
                'email_verified_at' => $existing->email_verified_at ?? now(),
            ]);
            $existing->save();

            return back()->with('success', 'Staff account restored and updated. They can sign in at /admin/login.');
        }

        User::create([
            'name' => $validated['name'],
            'email' => $email,
            'mobile' => $mobile,
            // Plain password — User model casts password as hashed.
            'password' => $validated['password'],
            'role' => UserRole::Staff,
            'email_verified_at' => now(),
        ]);

        return back()->with('success', 'Staff account created. They can sign in at /admin/login.');
    }

    public function update(Request $request, User $staff): RedirectResponse
    {
        abort_unless($staff->isStaff(), 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($staff->id)->whereNull('deleted_at'),
            ],
            'mobile' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('users', 'mobile')->ignore($staff->id)->whereNull('deleted_at'),
            ],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        $staff->name = $validated['name'];
        $staff->email = strtolower(trim($validated['email']));
        $staff->mobile = filled($validated['mobile'] ?? null) ? trim((string) $validated['mobile']) : null;

        if (! empty($validated['password'])) {
            $staff->password = $validated['password'];
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
