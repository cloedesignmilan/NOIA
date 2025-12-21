"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function SuperAdminGuard() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Core Check Function
        const checkUser = (user: any) => {
            if (user?.email?.toLowerCase() === 'superadmin@noia.cloud') {
                // If user is superadmin AND NOT in admin area
                if (!pathname.startsWith('/admin')) {
                    console.warn("[SuperAdminGuard] 🚨 SUPERADMIN DETECTED OUTSIDE ADMIN AREA -> REDIRECTING");

                    // 1. Try Next.js Router
                    router.replace('/admin');

                    // 2. Hard Fallback (if router fails or is slow)
                    // We set a small timeout to let router try first, but force it if needed
                    setTimeout(() => {
                        if (!window.location.pathname.startsWith('/admin')) {
                            console.warn("[SuperAdminGuard] ⚠️ Force Redirecting via window.location");
                            window.location.href = '/admin';
                        }
                    }, 500);
                }
            }
        };

        // 1. Initial Check (Fast path)
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) checkUser(user);
        });

        // 2. Listener (Reliable path for hydration/login events)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("[SuperAdminGuard] Auth Event:", event);
            if (session?.user) {
                checkUser(session.user);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [pathname, router]);

    return null;
}
