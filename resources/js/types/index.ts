import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface Brand {
    name: string;
    logo: string | null;
    tagline?: string;
}

export interface SiteTheme {
    primary_color: string;
    secondary_color: string;
    background_color: string;
    text_color: string;
}

export interface Currency {
    code: string;
    symbol: string;
}

export interface ContactInfo {
    address: string;
    phone: string;
    email: string;
}

export interface SharedData {
    name: string;
    brand: Brand;
    theme?: SiteTheme;
    appUrl?: string;
    currency: Currency;
    contact: ContactInfo;
    csrfToken?: string;
    quote: { message: string; author: string };
    auth: Auth;
    canShop?: boolean;
    cartCount: number;
    wishlistProductIds: number[];
    wishlistCount: number;
    unreadMessages?: number;
    unreadNotifications?: number;
    panelNavCounts?: Record<string, number>;
    flash: { success?: string; error?: string; info?: string; sellerInviteUrl?: string };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    mobile?: string;
    role?: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    seller_profile?: import('./marketplace').SellerProfile;
    [key: string]: unknown;
}
