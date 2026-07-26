type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
        dataLayer?: unknown[];
        plausible?: (event: string, options?: { props?: AnalyticsPayload }) => void;
    }
}

function ensureGa(): void {
    if (!gaId || typeof document === 'undefined' || window.gtag) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', gaId, { send_page_view: false });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);
}

function ensurePlausible(): void {
    if (!plausibleDomain || typeof document === 'undefined' || window.plausible) return;

    const script = document.createElement('script');
    script.defer = true;
    script.dataset.domain = plausibleDomain;
    script.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(script);
}

export function initAnalytics(): void {
    ensureGa();
    ensurePlausible();
}

export function trackPageView(url: string, title?: string): void {
    if (gaId && window.gtag) {
        window.gtag('event', 'page_view', {
            page_path: url,
            page_title: title,
        });
    }
}

export function trackEvent(name: string, props?: AnalyticsPayload): void {
    if (gaId && window.gtag) {
        window.gtag('event', name, props);
    }
    if (plausibleDomain && window.plausible) {
        window.plausible(name, props ? { props } : undefined);
    }
}
