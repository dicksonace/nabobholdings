import { usePage } from '@inertiajs/react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';
import { SharedData } from '@/types';

export default function AppLogoIcon({ className }: HTMLAttributes<HTMLImageElement>) {
    const { brand } = usePage<SharedData>().props;
    const name = brand?.name ?? 'Nabob Holdings';

    if (brand?.logo) {
        return (
            <img
                src={brand.logo}
                alt={name}
                className={cn('h-9 w-auto shrink-0 object-contain object-left', className)}
            />
        );
    }

    const parts = name.trim().split(/\s+/);
    const first = parts[0] ?? name;
    const rest = parts.slice(1).join(' ');

    return (
        <span className={cn('flex items-center font-bold whitespace-nowrap text-gray-900', className)}>
            {first}
            {rest && <span className="text-orange-500">&nbsp;{rest}</span>}
        </span>
    );
}
