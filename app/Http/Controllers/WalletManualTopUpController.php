<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Enums\WalletTopUpStatus;
use App\Models\WalletTopUpRequest;
use App\Services\PlatformSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class WalletManualTopUpController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && $user->role === UserRole::Seller, 403);

        $settings = PlatformSettings::manualFundingAccounts();
        $settings['accounts'] = array_values(array_filter(
            $settings['accounts'],
            fn (array $account) => ($account['type'] ?? '') === 'bank',
        ));

        if (! $settings['enabled'] || count($settings['accounts']) === 0) {
            return redirect()->route('manage.wallet')
                ->with('error', 'Manual top-up is not available right now. Contact support.');
        }

        $requests = WalletTopUpRequest::where('user_id', $user->id)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (WalletTopUpRequest $item) => [
                'id' => $item->id,
                'amount' => (float) $item->amount,
                'payment_reference' => $item->payment_reference,
                'status' => $item->status->value,
                'admin_notes' => $item->admin_notes,
                'proof_url' => $item->proof_path ? Storage::disk('public')->url($item->proof_path) : null,
                'created_at' => $item->created_at?->toIso8601String(),
                'reviewed_at' => $item->reviewed_at?->toIso8601String(),
            ]);

        return Inertia::render('seller/wallet/manual-top-up', [
            'settings' => $settings,
            'requests' => $requests,
            'walletRoute' => route('manage.wallet'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && $user->role === UserRole::Seller, 403);

        $settings = PlatformSettings::manualFundingAccounts();
        $bankAccounts = array_values(array_filter(
            $settings['accounts'],
            fn (array $account) => ($account['type'] ?? '') === 'bank',
        ));

        if (! $settings['enabled'] || count($bankAccounts) === 0) {
            return redirect()->route('manage.wallet')
                ->with('error', 'Manual top-up is not available right now.');
        }

        $pending = WalletTopUpRequest::where('user_id', $user->id)
            ->where('status', WalletTopUpStatus::Pending)
            ->exists();

        if ($pending) {
            return back()->with('error', 'You already have a pending manual top-up. Wait for admin review before submitting another.');
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:10', 'max:500000'],
            'payment_reference' => ['nullable', 'string', 'max:100'],
            'network' => ['nullable', 'string', 'max:50'],
            'user_note' => ['nullable', 'string', 'max:500'],
            'proof' => ['required', 'image', 'max:5120'],
        ]);

        $proofPath = $request->file('proof')->store('wallet-top-up-proofs', 'public');

        WalletTopUpRequest::create([
            'user_id' => $user->id,
            'amount' => $validated['amount'],
            'payment_reference' => trim((string) ($validated['payment_reference'] ?? '')),
            'sender_name' => null,
            'sender_number' => null,
            'network' => $validated['network'] ?? 'bank',
            'proof_path' => $proofPath,
            'user_note' => $validated['user_note'] ?? null,
            'status' => WalletTopUpStatus::Pending,
        ]);

        return redirect()->route('manage.wallet.manual-top-up')
            ->with('success', 'Payment proof submitted. We will credit your balance after admin verification.');
    }
}
