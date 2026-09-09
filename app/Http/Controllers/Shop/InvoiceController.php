<?php

namespace App\Http\Controllers\Shop;

use App\Enums\InvoiceType;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\User;
use App\Services\BuyerInvoicePrintService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class InvoiceController extends Controller
{
    public function __construct(private BuyerInvoicePrintService $printService) {}

    public function show(Request $request, Invoice $invoice): InertiaResponse|RedirectResponse|Response
    {
        $this->authorizeInvoiceAccess($request->user(), $invoice);

        // Mobile browsers often break window.print() — open the PDF printer instead.
        if ($request->boolean('print') || $request->query('print') === '1') {
            return $this->printService->stream($invoice);
        }

        $sellerContacts = $this->printService->resolveSellerContacts($invoice);
        $invoice->setAttribute('line_items', $this->printService->lineItemsWithImages($invoice));
        $invoice->loadMissing(['checkout', 'order']);

        return Inertia::render('shop/invoice-show', [
            'invoice' => $invoice,
            'sellerContacts' => $sellerContacts,
            'sellerContact' => $sellerContacts[0] ?? null,
        ]);
    }

    public function print(Request $request, Invoice $invoice): Response
    {
        $this->authorizeInvoiceAccess($request->user(), $invoice);

        return $this->printService->stream($invoice);
    }

    public function pdf(Request $request, Invoice $invoice): Response
    {
        $this->authorizeInvoiceAccess($request->user(), $invoice);

        return $this->printService->pdf($invoice);
    }

    private function authorizeInvoiceAccess(User $user, Invoice $invoice): void
    {
        if ($user->isBackOffice()) {
            return;
        }

        abort_unless($invoice->user_id === $user->id, 403);

        // Buyers get customer invoices; sellers get their seller copy.
        if ($user->isSeller() && $invoice->type === InvoiceType::Seller) {
            return;
        }

        abort_unless(in_array($invoice->type, [InvoiceType::Customer, InvoiceType::CustomerMaster], true), 403);
    }
}
