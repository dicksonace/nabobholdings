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

declare global {
    const route: typeof routeFn;
}

let appName = import.meta.env.VITE_APP_NAME || 'Nabob Holdings';

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
        color: '#d97706',
    },
});

router.on('success', (event) => {
    const props = event.detail.page.props as {
        csrfToken?: string;
        brand?: { name?: string };
        currency?: { symbol?: string };
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
    trackPageView(event.detail.page.url, typeof document !== 'undefined' ? document.title : undefined);
});

// This will set light / dark mode on load...
initializeTheme();
