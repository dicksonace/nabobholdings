import { Link, router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    Heart,
    KeyRound,
    LayoutDashboard,
    LogIn,
    LogOut,
    MapPin,
    Menu,
    MessageCircle,
    Package,
    ShoppingCart,
    User,
    Wallet,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import NotificationBell from '@/components/shop/notification-bell';
import SearchBox from '@/components/shop/search-box';
import NabobBrand from '@/components/nabob-brand';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useChatOptional } from '@/contexts/chat-context';
import { cn } from '@/lib/utils';
import { SharedData } from '@/types';

type NavLink = {
    label: string;
    href: string;
    auth?: boolean;
    buyerOnly?: boolean;
    chat?: boolean;
    highlight?: boolean;
};

export default function ShopHeader({ hideSearch = false, overHero = false }: { hideSearch?: boolean; overHero?: boolean }) {
    const page = usePage<SharedData & { cartCount: number; wishlistCount: number; unreadMessages?: number }>();
    const { auth, cartCount, wishlistCount, theme } = page.props;
    const primary = theme?.primary_color || '#0f2744';
    const secondary = theme?.secondary_color || '#d97706';
    const chat = useChatOptional();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const params = new URLSearchParams(page.url.split('?')[1] ?? '');
    const initialSearch = params.get('q') ?? params.get('search') ?? '';
    const component = typeof page.component === 'string' ? page.component : '';
    const showSearchBack = ['shop/store', 'shop/product-show', 'shop/search', 'shop/image-search'].includes(component);
    const floating = scrolled;
    // Full-bleed over hero at top; navy floating pill while scrolling.
    const dark = (overHero && !scrolled) || floating;

    const navLinks: NavLink[] = [
        { label: 'Shop', href: route('home') },
        { label: 'Wallet', href: route('wallet.index'), auth: true, buyerOnly: true },
        { label: 'Wishlist', href: route('wishlist.index'), auth: true, buyerOnly: true },
        { label: 'Addresses', href: route('addresses.index'), auth: true, buyerOnly: true },
        { label: 'My Orders', href: route('orders.index'), auth: true, buyerOnly: true },
        { label: 'Messages', href: route('chat.index'), auth: true, chat: true },
        { label: 'Contact', href: route('contact') },
        { label: 'FAQ', href: route('faq') },
    ];

    const role = auth.user?.role as string | undefined;
    const isSeller = role === 'seller';
    const isAdmin = role === 'admin';
    const isStaffUser = role === 'staff';
    const isOwnerOps = isAdmin || isSeller;
    const isBackOffice = isAdmin || isSeller || isStaffUser;

    const activeNavLinks: NavLink[] = isOwnerOps
        ? [
              { label: 'Owner Panel', href: isAdmin ? route('admin.dashboard') : route('manage.dashboard'), highlight: true },
              { label: 'Products', href: route('manage.products.index') },
              { label: 'Orders', href: route('manage.orders.index') },
              { label: 'Wallet', href: route('manage.wallet') },
              { label: 'Browse shop', href: route('home') },
              { label: 'Contact', href: route('contact') },
              { label: 'FAQ', href: route('faq') },
          ]
        : isStaffUser
          ? [
                { label: 'Owner Panel', href: route('admin.dashboard'), highlight: true },
                { label: 'Browse shop', href: route('home') },
                { label: 'Contact', href: route('contact') },
                { label: 'FAQ', href: route('faq') },
            ]
          : navLinks;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const openMessages = (e?: React.MouseEvent) => {
        e?.preventDefault();
        if (chat) {
            chat.openWidget();
        } else {
            router.visit(route('chat.index'));
        }
    };

    const dashboardLink = () => {
        if (!auth.user) return route('login');
        if (isAdmin || isStaffUser) return route('admin.dashboard');
        if (isSeller) return route('manage.dashboard');
        return route('orders.index');
    };

    const dashboardLabel = () => {
        if (!auth.user) return 'Dashboard';
        if (isAdmin || isSeller || isStaffUser) return 'Owner Panel';
        return 'My Orders';
    };

    const iconBtn = dark
        ? 'relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10 active:scale-95'
        : 'relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[#0f2744] transition hover:bg-[#0f2744]/[0.06] active:scale-95';

    const badge =
        'absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d97706] px-1 text-[10px] font-bold text-white shadow-sm shadow-amber-600/30';

    const renderNavLink = (link: NavLink, onNavigate?: () => void, mobile = false) => {
        if (link.auth && !auth.user) return null;
        if (link.buyerOnly && isBackOffice) return null;

        if (link.chat) {
            return (
                <button
                    key={link.label}
                    type="button"
                    onClick={() => {
                        openMessages();
                        onNavigate?.();
                    }}
                    className={
                        mobile
                            ? 'block w-full rounded-xl px-3 py-3 text-left text-sm font-medium text-[#0f2744] hover:bg-amber-50'
                            : cn(
                                  'text-sm font-medium transition',
                                  dark ? 'text-white/80 hover:text-[#fbbf24]' : 'text-[#0f2744]/80 hover:text-[#d97706]',
                              )
                    }
                >
                    {link.label}
                </button>
            );
        }

        return (
            <Link
                key={link.label}
                href={link.href}
                onClick={onNavigate}
                className={
                    mobile
                        ? cn(
                              'block rounded-xl px-3 py-3 text-sm font-medium',
                              link.highlight ? 'bg-amber-50 font-semibold text-amber-800' : 'text-[#0f2744] hover:bg-amber-50',
                          )
                        : cn(
                              'relative text-sm font-medium transition',
                              link.highlight
                                  ? dark
                                      ? 'font-semibold text-[#fbbf24] hover:text-amber-200'
                                      : 'font-semibold text-amber-700 hover:text-amber-800'
                                  : dark
                                    ? 'text-white/75 hover:text-[#fbbf24]'
                                    : 'text-[#0f2744]/75 hover:text-[#d97706]',
                              'after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-[#d97706] after:transition-all hover:after:w-full',
                          )
                }
            >
                {link.label}
            </Link>
        );
    };

    // Reserve space so the fixed header does not cover page content.
    const spacerClass = hideSearch ? 'h-14 sm:h-16' : 'h-[6.75rem] md:h-16';

    return (
        <>
            <div className={spacerClass} aria-hidden />

            <div
                className={cn(
                    'fixed inset-x-0 top-0 z-50 transition-[padding] duration-300 ease-out',
                    floating ? 'px-3 pt-3 sm:px-5 sm:pt-4' : 'px-0 pt-0',
                )}
            >
                <header
                    className={cn(
                        'relative overflow-hidden transition-all duration-300 ease-out',
                        floating
                            ? 'mx-auto w-full max-w-7xl rounded-2xl border border-white/15 shadow-[0_12px_40px_rgba(15,39,68,0.45)] backdrop-blur-xl'
                            : cn(
                                  'w-full max-w-none rounded-none',
                                  overHero
                                      ? 'border-b border-white/10 backdrop-blur-md'
                                      : 'border-b border-black/10 bg-white/95 backdrop-blur-md',
                              ),
                    )}
                    style={
                        floating || overHero
                            ? { backgroundColor: `${primary}eb` }
                            : undefined
                    }
                >
                    {!floating && (
                        <div
                            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent"
                            style={{
                                backgroundImage: `linear-gradient(to right, transparent, ${secondary}80, transparent)`,
                            }}
                        />
                    )}

                    <div className={cn('relative px-3 sm:px-4', !floating && 'mx-auto max-w-7xl')}>
                        <div className="flex h-14 items-center gap-3 sm:h-16 sm:gap-5">
                            <NabobBrand size="sm" className="shrink-0" inverted={dark} />

                            <nav className="hidden items-center gap-5 lg:flex">
                                {activeNavLinks.map((link) => renderNavLink(link))}
                            </nav>

                    {!hideSearch && (
                        <div className="mx-auto hidden min-w-0 max-w-xl flex-1 md:flex">
                            <SearchBox
                                initialQuery={initialSearch}
                                className="w-full"
                                showBack={showSearchBack}
                                backHref={route('home')}
                                tone={dark ? 'dark' : 'light'}
                            />
                        </div>
                    )}

                    {hideSearch && <div className="hidden flex-1 lg:block" />}

                    <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
                        {auth.user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            'hidden items-center gap-2 rounded-full px-2.5 py-1.5 text-sm font-medium shadow-sm transition md:flex',
                                            dark
                                                ? 'border border-white/20 bg-white/10 text-white hover:bg-white/15'
                                                : 'border border-[#0f2744]/10 bg-white text-[#0f2744] hover:border-amber-300 hover:bg-amber-50/60',
                                        )}
                                    >
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d97706] text-xs font-bold text-white">
                                            {(auth.user.name ?? 'U').charAt(0).toUpperCase()}
                                        </span>
                                        <span className="max-w-[6.5rem] truncate">{auth.user.name}</span>
                                        <ChevronDown className={cn('h-3.5 w-3.5', dark ? 'text-white/60' : 'text-[#0f2744]/50')} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    {isBackOffice && (
                                        <DropdownMenuItem asChild>
                                            <Link href={dashboardLink()} className="flex w-full cursor-pointer items-center font-medium text-amber-700">
                                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                                {dashboardLabel()}
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    {isSeller && (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link href={route('manage.products.index')} className="flex w-full cursor-pointer items-center">
                                                    <Package className="mr-2 h-4 w-4" />
                                                    My Products
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={route('manage.orders.index')} className="flex w-full cursor-pointer items-center">
                                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                                    Seller Orders
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={route('manage.wallet')} className="flex w-full cursor-pointer items-center">
                                                    <Wallet className="mr-2 h-4 w-4" />
                                                    Earnings
                                                </Link>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    {isBackOffice && <DropdownMenuSeparator />}
                                    {!isBackOffice && (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link href={route('orders.index')} className="flex w-full cursor-pointer items-center">
                                                    <Package className="mr-2 h-4 w-4" />
                                                    My Orders
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={route('wallet.index')} className="flex w-full cursor-pointer items-center">
                                                    <Wallet className="mr-2 h-4 w-4" />
                                                    Wallet
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={route('wishlist.index')} className="flex w-full cursor-pointer items-center">
                                                    <Heart className="mr-2 h-4 w-4" />
                                                    Wishlist
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={route('addresses.index')} className="flex w-full cursor-pointer items-center">
                                                    <MapPin className="mr-2 h-4 w-4" />
                                                    Addresses
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    <DropdownMenuItem asChild>
                                        <Link href={route('profile.edit')} className="flex w-full cursor-pointer items-center">
                                            <User className="mr-2 h-4 w-4" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={route('password.edit')} className="flex w-full cursor-pointer items-center">
                                            <KeyRound className="mr-2 h-4 w-4" />
                                            Change password
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="flex w-full cursor-pointer items-center text-red-600"
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Log out
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="hidden items-center gap-2 md:flex">
                                <Link
                                    href={route('login')}
                                    className={cn(
                                        'inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition',
                                        dark
                                            ? 'text-white hover:bg-white/10'
                                            : 'text-[#0f2744] hover:bg-[#0f2744]/[0.06]',
                                    )}
                                >
                                    <LogIn className="h-4 w-4" />
                                    Login
                                </Link>
                                <Link
                                    href={route('register.buyer')}
                                    className="inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold text-white shadow-md transition hover:brightness-95 hover:shadow-lg active:scale-[0.98]"
                                    style={{ backgroundColor: secondary }}
                                >
                                    Register
                                </Link>
                            </div>
                        )}

                        {auth.user && !isBackOffice && (
                            <button type="button" onClick={openMessages} className={cn(iconBtn, 'hidden sm:inline-flex')} title="Messages">
                                <MessageCircle className="h-5 w-5" />
                                {(page.props.unreadMessages ?? 0) > 0 && (
                                    <span className={badge}>{(page.props.unreadMessages ?? 0) > 9 ? '9+' : page.props.unreadMessages}</span>
                                )}
                            </button>
                        )}

                        <NotificationBell />

                        {auth.user && !isBackOffice && (
                            <Link href={route('wishlist.index')} className={cn(iconBtn, 'hidden sm:inline-flex')} title="Wishlist">
                                <Heart className="h-5 w-5" />
                                {wishlistCount > 0 && <span className={badge}>{wishlistCount > 9 ? '9+' : wishlistCount}</span>}
                            </Link>
                        )}

                        <Link
                            href={auth.user ? route('cart.index') : route('login')}
                            className={cn(iconBtn, dark ? 'bg-white/10' : 'bg-[#0f2744]/[0.04]')}
                            title="Cart"
                        >
                            <ShoppingCart className="h-5 w-5" />
                            {cartCount > 0 && <span className={badge}>{cartCount > 9 ? '9+' : cartCount}</span>}
                        </Link>

                        <button
                            type="button"
                            className={cn(iconBtn, 'lg:hidden')}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {!hideSearch && (
                    <div className="pb-3 md:hidden">
                        <SearchBox
                            initialQuery={initialSearch}
                            compact
                            showBack={showSearchBack}
                            backHref={route('home')}
                            tone={dark ? 'dark' : 'light'}
                            onSubmitted={() => setMobileMenuOpen(false)}
                        />
                    </div>
                )}
            </div>

            {mobileMenuOpen && (
                <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-[#0f2744]/8 bg-white px-3 py-4 lg:hidden">
                    {auth.user && (
                        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-[#0f2744]/[0.04] px-3 py-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f2744] text-sm font-bold text-white">
                                {(auth.user.name ?? 'U').charAt(0).toUpperCase()}
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-[#0f2744]">{auth.user.name}</p>
                                <p className="text-xs text-[#0f2744]/60">
                                    {isSeller ? 'Seller account' : isAdmin || isStaffUser ? 'Staff account' : 'Buyer account'}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-0.5">{activeNavLinks.map((link) => renderNavLink(link, () => setMobileMenuOpen(false), true))}</div>

                    {!auth.user && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <Link
                                href={route('login')}
                                className="rounded-full border border-[#0f2744]/15 py-2.5 text-center text-sm font-semibold text-[#0f2744]"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Login
                            </Link>
                            <Link
                                href={route('register.buyer')}
                                className="rounded-full py-2.5 text-center text-sm font-semibold text-white shadow-md"
                                style={{ backgroundColor: secondary }}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Register
                            </Link>
                        </div>
                    )}

                    {auth.user && (
                        <>
                            <div className="my-3 h-px bg-[#0f2744]/8" />
                            <Link
                                href={route('profile.edit')}
                                className="block rounded-xl px-3 py-3 text-sm font-medium text-[#0f2744] hover:bg-amber-50"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Profile
                            </Link>
                            <Link
                                href={route('password.edit')}
                                className="block rounded-xl px-3 py-3 text-sm font-medium text-[#0f2744] hover:bg-amber-50"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Change password
                            </Link>
                            <Button
                                variant="outline"
                                className="mt-3 w-full rounded-full border-[#0f2744]/15"
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    router.post(route('logout'));
                                }}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </Button>
                        </>
                    )}
                </div>
            )}
                </header>
            </div>
        </>
    );
}
