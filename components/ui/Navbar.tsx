"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, TrendingDown, Settings, LogOut, Users, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/theme-toggle';

export function Navbar() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const links = [
        { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { href: '/entrate', label: 'Entrate', icon: TrendingUp },
        { href: '/spese', label: 'Spese', icon: TrendingDown },
        { href: '/agenti', label: 'Agenti', icon: Users },
        // { href: '/marketing', label: 'Marketing AI', icon: Megaphone },
        { href: '/settings', label: 'Impostazioni', icon: Settings },
    ];

    if (pathname === '/') return null;

    return (
        <nav className="sticky top-0 z-50 w-full glass border-b border-border/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <div className="flex items-center gap-8">
                        <Link href={user ? "/dashboard" : "/"} className="flex-shrink-0 flex items-center gap-2 group">
                            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                                <span className="text-primary-foreground font-bold text-sm">NO</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-foreground">NO.IA</span>
                        </Link>

                        {/* Desktop Nav */}
                        {user && (
                            <div className="hidden md:flex md:space-x-1">
                                {links.map((link) => {
                                    const Icon = link.icon;
                                    const isActive = pathname === link.href;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={cn(
                                                "inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                                                isActive
                                                    ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            <Icon className="w-4 h-4 mr-2" />
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2">
                        <ThemeToggle />

                        <div className="h-6 w-px bg-border/50 mx-1" />

                        {user ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 shadow-md ring-2 ring-background flex items-center justify-center text-xs font-bold text-white">
                                        {user.email?.substring(0, 2).toUpperCase()}
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        await supabase.auth.signOut();
                                        window.location.href = '/login';
                                    }}
                                    className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                    title="Esci"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            // Guest
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="hidden px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors sm:block"
                                >
                                    Accedi
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity"
                                >
                                    Inizia
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
