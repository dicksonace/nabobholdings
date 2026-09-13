<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Buyer wallet UI has been retired. Routes stay named so old links redirect cleanly.
 * Refunds still credit the wallet ledger in OrderService for ops integrity.
 */
class WalletController extends Controller
{
    public function index(Request $request): RedirectResponse
    {
        return $this->gone();
    }

    public function addFunds(Request $request): RedirectResponse
    {
        return $this->gone();
    }

    public function callback(Request $request): RedirectResponse
    {
        return $this->gone();
    }

    public function withdraw(Request $request): RedirectResponse
    {
        return $this->gone();
    }

    private function gone(): RedirectResponse
    {
        return redirect()
            ->route('home')
            ->with('error', 'Buyer wallet is no longer available. Use cash on delivery or bank transfer at checkout.');
    }
}
