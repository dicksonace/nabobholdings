import { ReactNode } from 'react';
import { usePage } from '@inertiajs/react';

import { AdminNavKey, adminNavGroups, adminNavSection } from '@/lib/admin-nav';
import PanelLayout from '@/layouts/panel-layout';
import { SharedData } from '@/types';

interface AdminLayoutProps {
    children: ReactNode;
    title: string;
    active: AdminNavKey;
}

export default function AdminLayout({ children, title, active }: AdminLayoutProps) {
    const { auth } = usePage<SharedData>().props;
    const role = auth.user?.role ?? 'admin';

    return (
        <PanelLayout
            title={title}
            panelTitle="Owner Panel"
            panelId="admin"
            navGroups={adminNavGroups(active, role)}
            fallbackSection={adminNavSection(active)}
            brandHref={route('admin.dashboard')}
        >
            {children}
        </PanelLayout>
    );
}
