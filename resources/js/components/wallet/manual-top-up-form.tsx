import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

import InputError from '@/components/input-error';
import DocumentUploadField from '@/components/forms/document-upload-field';
import DirectPaymentDetails from '@/components/shop/direct-payment-details';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatPrice, getCurrencySymbol } from '@/types/marketplace';
import { SharedData } from '@/types';

export type FundingAccount = {
    type: 'momo' | 'bank';
    label: string;
    account_name: string;
    account_number: string;
    network?: string | null;
    bank_name?: string | null;
};

export type TopUpHistoryItem = {
    id: number;
    amount: number;
    payment_reference: string;
    status: string;
    admin_notes: string | null;
    proof_url: string | null;
    created_at: string | null;
    reviewed_at: string | null;
};

interface Props {
    settings: {
        enabled: boolean;
        instructions: string;
        accounts: FundingAccount[];
    };
    requests: TopUpHistoryItem[];
    walletRoute: string;
    submitRoute: string;
    /** Seller layout has no flash banner — show inline. Shop layout already shows flash at top. */
    showFlash?: boolean;
}

function formatDate(value?: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function bankAccountKey(account: FundingAccount, index: number): string {
    return `${account.account_number}-${account.bank_name ?? account.label}-${index}`;
}

function bankDisplayName(account: FundingAccount): string {
    return account.bank_name || account.label || 'Bank transfer';
}

export default function ManualTopUpForm({ settings, requests, walletRoute, submitRoute, showFlash = false }: Props) {
    const { flash } = usePage<SharedData>().props;
    const [infoOpen, setInfoOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const bankAccounts = useMemo(
        () => settings.accounts.filter((account) => account.type === 'bank'),
        [settings.accounts],
    );

    const selectedAccount = selectedIndex !== null ? bankAccounts[selectedIndex] ?? null : null;

    const form = useForm({
        amount: '',
        payment_reference: '',
        network: '',
        user_note: '',
        proof: null as File | null,
    });

    const selectAccount = (index: number) => {
        const account = bankAccounts[index];
        if (!account) return;
        setSelectedIndex(index);
        form.setData('network', bankDisplayName(account) || 'bank');
        form.clearErrors('network');
        setInfoOpen(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!selectedAccount) {
            form.setError('network', 'Choose a bank account first.');
            return;
        }
        form
            .transform((data) => ({
                ...data,
                network: data.network || bankDisplayName(selectedAccount) || 'bank',
            }))
            .post(submitRoute, { forceFormData: true });
    };

    const statusColor: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-800',
        approved: 'bg-emerald-100 text-emerald-800',
        rejected: 'bg-red-100 text-red-800',
    };

    if (bankAccounts.length === 0) {
        return (
            <div className="mx-auto max-w-3xl space-y-6">
                <Link href={walletRoute} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-4 w-4" />
                    Back to wallet
                </Link>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manual bank transfer</h1>
                    <p className="mt-1 text-sm text-gray-500">Transfer to a Nabob Holdings bank account, then submit proof.</p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Manual top-up isn&apos;t configured yet. No bank accounts are available — contact support.
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <Link href={walletRoute} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                Back to wallet
            </Link>

            <div>
                <h1 className="text-2xl font-bold text-gray-900">Manual bank transfer</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Choose a bank account, transfer the exact amount, then submit your bank confirmation proof.
                </p>
            </div>

            {showFlash && flash.success && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {flash.success}
                </div>
            )}
            {showFlash && flash.error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</div>
            )}

            {settings.instructions && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    {settings.instructions}
                </div>
            )}

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900">1. Choose bank account</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Tap an account to view and copy the details — then transfer from your bank.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {bankAccounts.map((account, index) => {
                        const selected = selectedIndex === index;

                        return (
                            <button
                                key={bankAccountKey(account, index)}
                                type="button"
                                onClick={() => selectAccount(index)}
                                className={cn(
                                    'flex min-h-[4.75rem] flex-col justify-center rounded-xl border-2 px-3 py-3 text-left transition',
                                    selected
                                        ? 'border-sky-500 bg-sky-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                                )}
                            >
                                <span className={cn('block text-[10px] font-bold uppercase tracking-wide', selected ? 'text-sky-700' : 'text-gray-400')}>
                                    Bank transfer
                                </span>
                                <span className="mt-0.5 block text-sm font-semibold text-gray-900">
                                    {bankDisplayName(account)}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-gray-500">
                                    {account.account_number}
                                    {account.account_name ? ` · ${account.account_name}` : ''}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <InputError message={form.errors.network} className="mt-2" />

                {selectedAccount && (
                    <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                                Transfer to {bankDisplayName(selectedAccount)}
                            </p>
                            <button
                                type="button"
                                onClick={() => setInfoOpen(true)}
                                className="text-sm font-semibold text-sky-700 hover:underline"
                            >
                                View details again
                            </button>
                        </div>
                        <DirectPaymentDetails
                            accountNumber={selectedAccount.account_number}
                            accountName={selectedAccount.account_name}
                            isBank
                            bankName={selectedAccount.bank_name || selectedAccount.label}
                            hint="Send the exact amount, then fill the proof form below."
                        />
                    </div>
                )}
            </div>

            <form onSubmit={submit} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900">2. After you transfer — submit proof</h2>
                <p className="mt-1 text-sm text-gray-500">We credit your wallet once an admin verifies the bank confirmation.</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                        <Label>Amount sent ({getCurrencySymbol()})</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="10"
                            value={form.data.amount}
                            onChange={(e) => form.setData('amount', e.target.value)}
                            required
                            className="mt-1"
                        />
                        <InputError message={form.errors.amount} />
                    </div>
                    <div>
                        <Label>
                            Payment reference / ID <span className="font-normal text-gray-400">(optional)</span>
                        </Label>
                        <Input
                            value={form.data.payment_reference}
                            onChange={(e) => form.setData('payment_reference', e.target.value)}
                            className="mt-1"
                            placeholder="From your bank confirmation"
                        />
                        <InputError message={form.errors.payment_reference} />
                    </div>
                    <div className="sm:col-span-2">
                        <DocumentUploadField
                            id="manual-top-up-proof"
                            label="Screenshot / receipt"
                            hint="Upload a screenshot of your bank transfer confirmation"
                            required
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            maxSizeMb={5}
                            value={form.data.proof}
                            onChange={(file) => form.setData('proof', file)}
                            error={form.errors.proof}
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <Label>Note (optional)</Label>
                        <Input
                            value={form.data.user_note}
                            onChange={(e) => form.setData('user_note', e.target.value)}
                            className="mt-1"
                            placeholder="Anything else we should know"
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={form.processing || !selectedAccount}
                    className="mt-4 w-full bg-green-600 py-6 text-base font-semibold hover:bg-green-700"
                >
                    {form.processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    I&apos;ve paid — submit for verification
                </Button>
                {!selectedAccount && (
                    <p className="mt-2 text-center text-xs text-amber-700">Choose a bank account above first.</p>
                )}
            </form>

            {requests.length > 0 && (
                <div>
                    <h2 className="mb-3 text-sm font-semibold text-gray-900">Your recent requests</h2>
                    <div className="space-y-2">
                        {requests.map((item) => (
                            <div key={item.id} className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-semibold text-gray-900">{formatPrice(item.amount)}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[item.status] ?? 'bg-gray-100'}`}>
                                        {item.status}
                                    </span>
                                </div>
                                <p className="mt-1 text-gray-500">
                                    {item.payment_reference ? `Ref: ${item.payment_reference} · ` : ''}
                                    {formatDate(item.created_at)}
                                </p>
                                {item.admin_notes && <p className="mt-1 text-gray-700">Admin: {item.admin_notes}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedAccount ? bankDisplayName(selectedAccount) : 'Bank details'}
                        </DialogTitle>
                        <DialogDescription>
                            Copy the account number, transfer from your bank, then submit proof on this page.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedAccount ? (
                        <DirectPaymentDetails
                            accountNumber={selectedAccount.account_number}
                            accountName={selectedAccount.account_name}
                            isBank
                            bankName={selectedAccount.bank_name || selectedAccount.label}
                        />
                    ) : (
                        <p className="text-sm text-gray-500">No bank account selected.</p>
                    )}

                    <DialogFooter>
                        <Button type="button" className="w-full bg-green-600 hover:bg-green-700" onClick={() => setInfoOpen(false)}>
                            I&apos;ve copied — continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
