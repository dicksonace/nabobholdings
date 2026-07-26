import { FormEvent, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { LoaderCircle, Trash2, UserPlus } from 'lucide-react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';

interface StaffUser {
    id: number;
    name: string;
    email: string;
    mobile: string | null;
    created_at: string;
}

interface PaginatedStaff {
    data: StaffUser[];
    links: { url: string | null; label: string; active: boolean }[];
}

export default function StaffIndex({ staff }: { staff: PaginatedStaff }) {
    const form = useForm({
        name: '',
        email: '',
        mobile: '',
        password: '',
        password_confirmation: '',
    });

    const [editingId, setEditingId] = useState<number | null>(null);
    const editForm = useForm({
        name: '',
        email: '',
        mobile: '',
        password: '',
        password_confirmation: '',
    });

    const submitCreate = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('admin.staff.store'), {
            onSuccess: () => form.reset(),
        });
    };

    const startEdit = (user: StaffUser) => {
        setEditingId(user.id);
        editForm.setData({
            name: user.name,
            email: user.email,
            mobile: user.mobile ?? '',
            password: '',
            password_confirmation: '',
        });
    };

    const submitEdit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        editForm.put(route('admin.staff.update', editingId), {
            onSuccess: () => setEditingId(null),
        });
    };

    return (
        <AdminLayout title="Staff accounts" active="staff">
            <Head title="Staff accounts" />

            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Staff accounts</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Staff can handle orders, chats, disputes, and buyers. They cannot change brand settings or money tools.
                </p>
            </div>

            <form onSubmit={submitCreate} className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-orange-500" />
                    <h2 className="font-semibold text-gray-900">Add staff</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                        <InputError message={form.errors.name} />
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                        <InputError message={form.errors.email} />
                    </div>
                    <div>
                        <Label htmlFor="mobile">Mobile (optional)</Label>
                        <Input id="mobile" value={form.data.mobile} onChange={(e) => form.setData('mobile', e.target.value)} />
                        <InputError message={form.errors.mobile} />
                    </div>
                    <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={form.data.password}
                            onChange={(e) => form.setData('password', e.target.value)}
                        />
                        <InputError message={form.errors.password} />
                    </div>
                    <div>
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            value={form.data.password_confirmation}
                            onChange={(e) => form.setData('password_confirmation', e.target.value)}
                        />
                    </div>
                </div>
                <Button type="submit" className="mt-4" disabled={form.processing}>
                    {form.processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Create staff login
                </Button>
            </form>

            <div className="space-y-3">
                {staff.data.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                        No staff accounts yet.
                    </p>
                ) : (
                    staff.data.map((user) => (
                        <div key={user.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                            {editingId === user.id ? (
                                <form onSubmit={submitEdit} className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <Label>Name</Label>
                                        <Input value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} />
                                        <InputError message={editForm.errors.name} />
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={editForm.data.email}
                                            onChange={(e) => editForm.setData('email', e.target.value)}
                                        />
                                        <InputError message={editForm.errors.email} />
                                    </div>
                                    <div>
                                        <Label>Mobile</Label>
                                        <Input value={editForm.data.mobile} onChange={(e) => editForm.setData('mobile', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>New password (optional)</Label>
                                        <Input
                                            type="password"
                                            value={editForm.data.password}
                                            onChange={(e) => editForm.setData('password', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Confirm password</Label>
                                        <Input
                                            type="password"
                                            value={editForm.data.password_confirmation}
                                            onChange={(e) => editForm.setData('password_confirmation', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-end gap-2 sm:col-span-2">
                                        <Button type="submit" disabled={editForm.processing}>
                                            Save
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-gray-900">{user.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {user.email}
                                            {user.mobile ? ` · ${user.mobile}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => startEdit(user)}>
                                            Edit
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600"
                                            onClick={() => {
                                                if (confirm(`Remove staff account for ${user.name}?`)) {
                                                    router.delete(route('admin.staff.destroy', user.id));
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </AdminLayout>
    );
}
