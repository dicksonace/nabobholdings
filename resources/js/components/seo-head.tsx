import { Head, usePage } from '@inertiajs/react';

import { SharedData } from '@/types';
import { productImageUrl } from '@/types/marketplace';

type SeoHeadProps = {
    title: string;
    description?: string | null;
    keywords?: string | null;
    image?: string | null;
    url?: string | null;
    type?: 'website' | 'product';
    noIndex?: boolean;
};

function absoluteUrl(pathOrUrl: string | null | undefined, origin: string): string | undefined {
    if (!pathOrUrl) return undefined;
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${origin}${path}`;
}

export default function SeoHead({
    title,
    description,
    keywords,
    image,
    url,
    type = 'website',
    noIndex = false,
}: SeoHeadProps) {
    const page = usePage<SharedData>();
    const brandName = page.props.brand?.name ?? 'Nabob Holdings';
    const fallbackDescription =
        page.props.brand?.tagline ??
        'Shop quality products from Nabob Holdings — secure payments, order tracking, and delivery across Ghana.';

    const desc = (description?.trim() || fallbackDescription).slice(0, 300);
    const origin =
        page.props.appUrl
        || (typeof window !== 'undefined' ? window.location.origin : '');
    const canonical = absoluteUrl(url ?? page.url.split('?')[0], origin) ?? page.url;
    const imagePath = image ? productImageUrl(image) : page.props.brand?.logo;
    const ogImage = absoluteUrl(imagePath || '/images/logo.png', origin);

    return (
        <Head title={title}>
            <meta head-key="description" name="description" content={desc} />
            {keywords && <meta head-key="keywords" name="keywords" content={keywords} />}
            {noIndex && <meta head-key="robots" name="robots" content="noindex,nofollow" />}
            <link head-key="canonical" rel="canonical" href={canonical} />

            <meta head-key="og:type" property="og:type" content={type} />
            <meta head-key="og:site_name" property="og:site_name" content={brandName} />
            <meta head-key="og:title" property="og:title" content={`${title} - ${brandName}`} />
            <meta head-key="og:description" property="og:description" content={desc} />
            <meta head-key="og:url" property="og:url" content={canonical} />
            {ogImage && <meta head-key="og:image" property="og:image" content={ogImage} />}

            <meta head-key="twitter:card" name="twitter:card" content="summary_large_image" />
            <meta head-key="twitter:title" name="twitter:title" content={`${title} - ${brandName}`} />
            <meta head-key="twitter:description" name="twitter:description" content={desc} />
            {ogImage && <meta head-key="twitter:image" name="twitter:image" content={ogImage} />}
        </Head>
    );
}
