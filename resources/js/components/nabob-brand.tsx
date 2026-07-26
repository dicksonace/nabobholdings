import { Link, usePage } from '@inertiajs/react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';
import { SharedData } from '@/types';

interface NabobBrandProps extends HTMLAttributes<HTMLDivElement> {
    showText?: boolean;
    asLink?: boolean;
    href?: string;
    size?: 'sm' | 'md' | 'lg';
    inverted?: boolean;
}

const imgHeight = {
    sm: 'h-8 max-w-[7rem]',
    md: 'h-10 max-w-[9rem]',
    lg: 'h-14 max-w-[11rem]',
};

const textSize = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
};

/**
 * Site wordmark / logo. Everything is driven by the single admin brand setting
 * (name + optional uploaded logo), shared on every page as `brand`.
 */
export default function NabobBrand({
    className,
    showText = false,
    asLink = true,
    href,
    size = 'md',
    inverted = false,
    ...props
}: NabobBrandProps) {
    const { brand } = usePage<SharedData>().props;
    const name = brand?.name ?? 'Nabob Holdings';
    const logo = brand?.logo ?? null;

    const parts = name.trim().split(/\s+/);
    const first = parts[0] ?? name;
    const rest = parts.slice(1).join(' ');

    const content = logo ? (
        <img
            src={logo}
            alt={name}
            className={cn('w-auto shrink-0 object-contain object-left', showText ? imgHeight.lg : imgHeight[size])}
        />
    ) : (
        <span
            className={cn(
                'font-bold whitespace-nowrap tracking-tight',
                inverted ? 'text-white' : 'text-[#0f2744]',
                showText ? textSize.lg : textSize[size],
            )}
        >
            {first}
            {rest && <span className={inverted ? 'text-[#fbbf24]' : 'text-[#d97706]'}>&nbsp;{rest}</span>}
        </span>
    );

    const wrapperClass = cn('flex items-center', className);

    if (asLink) {
        return (
            <Link href={href ?? route('home')} className={wrapperClass}>
                {content}
            </Link>
        );
    }

    return (
        <div className={wrapperClass} {...props}>
            {content}
        </div>
    );
}
