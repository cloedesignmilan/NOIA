"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, ShieldAlert } from "lucide-react";

export function SuperAdminGate({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        let mounted = true;

        const verify = async (user: any) => {
            if (!user) {
                // No user? Assume safe to show login or whatever (middleware handles this usually)
                // But for dashboard, let's treat as safe to render (the other guards will catch unauth)
                if (mounted) {
                    setIsAuthorized(true);
                    setChecking(false);
                }
                return;
            }

            console.log("[Gate] Checking User:", user.email);

            if (user.email?.toLowerCase() === 'superadmin@noia.cloud') {
                if (!pathname.startsWith('/admin')) {
                    console.warn("[Gate] 🚨 SUPERADMIN BLOCKED -> REDIRECTING");
                    // DO NOT AUTHORIZE

                    // Force Redirect
                    router.replace('/admin');

                    // Hard Fallback
                    setTimeout(() => {
                        window.location.href = '/admin';
                    }, 200);
                    return;
                } else {
                    // Is superadmin AND is in admin? Safe.
                    if (mounted) {
                        setIsAuthorized(true);
                        setChecking(false);
                    }
                }
            } else {
                // Not superadmin? Safe.
                if (mounted) {
                    setIsAuthorized(true);
                    setChecking(false);
                }
            }
        };

        // 1. Check current
        supabase.auth.getUser().then(({ data: { user } }) => verify(user));

        // 2. Listen
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
            if (session?.user) verify(session.user);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [pathname, router]);

    if (checking) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background z-[99999] fixed inset-0">
                <ShieldAlert className="w-12 h-12 text-primary animate-pulse mb-4" />
                <h2 className="text-xl font-bold">Verifica permessi in corso...</h2>
            </div>
        );
    }

    if (!isAuthorized) {
        // Should have redirected by now, but just in case
        return null;
    }

    return <>{children}</>;
}
