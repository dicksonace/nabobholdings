import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';
import { ChatProvider } from './contexts/chat-context';
import { ToastProvider } from './contexts/toast-context';
import FloatingChatWidget from './components/chat/floating-chat-widget';
import ChatSoundListener from './components/chat/chat-sound-listener';
import FlashToastListener from './components/shop/flash-toast-listener';
import { setCsrfToken } from './lib/csrf';
import { setCurrencySymbol } from '@/types/marketplace';
import { initAnalytics, trackPageView } from './lib/analytics';
import type { SiteTheme } from './types';

declare global {
    const route: typeof routeFn;
}

let appName = import.meta.env.VITE_APP_NAME || 'Nabob Holdings';

function applySiteTheme(theme?: SiteTheme) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', theme?.primary_color || '#0f2744');
    root.style.setProperty('--brand-secondary', theme?.secondary_color || '#d97706');
    root.style.setProperty('--brand-background', theme?.background_color || '#ffffff');
    root.style.setProperty('--brand-text', theme?.text_color || '#111827');
}
createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')).then((module) => {
            const Page = module.default as ComponentType;
            return function PageWithChat(props: Record<string, unknown>) {
                return (
                    <>
                        <FlashToastListener />
                        <ChatSoundListener />
                        <Page {...props} />
                        <FloatingChatWidget />
                    </>
                );
            };
        }),
    setup({ el, App, props }) {
        const root = createRoot(el);
        const initialProps = props.initialPage.props as {
            csrfToken?: string;
            brand?: { name?: string };
            currency?: { symbol?: string };
            theme?: SiteTheme;
        };
        const initialToken = initialProps.csrfToken;
        if (initialToken) {
            setCsrfToken(initialToken);
        }
        if (initialProps.brand?.name) {
            appName = initialProps.brand.name;
        }
        if (initialProps.currency?.symbol) {
            setCurrencySymbol(initialProps.currency.symbol);
        }
        applySiteTheme(initialProps.theme);

        initAnalytics();
        trackPageView(props.initialPage.url, typeof document !== 'undefined' ? document.title : undefined);

        root.render(
            <ChatProvider>
                <ToastProvider>
                    <App {...props} />
                </ToastProvider>
            </ChatProvider>,
        );
    },
    progress: {
        color: 'var(--brand-secondary, #d97706)',
    },
});

router.on('success', (event) => {
    const props = event.detail.page.props as {
        csrfToken?: string;
        brand?: { name?: string };
        currency?: { symbol?: string };
        theme?: SiteTheme;
    };
    if (props.csrfToken) {
        setCsrfToken(props.csrfToken);
    }
    if (props.brand?.name) {
        appName = props.brand.name;
    }
    if (props.currency?.symbol) {
        setCurrencySymbol(props.currency.symbol);
    }
    applySiteTheme(props.theme);
    trackPageView(event.detail.page.url, typeof document !== 'undefined' ? document.title : undefined);
});

// This will set light / dark mode on load...
initializeTheme();
