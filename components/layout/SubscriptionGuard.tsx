
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCurrentOrg } from '@/lib/hooks';

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
    const { orgId } = useCurrentOrg();
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        // Public routes that don't need protection
        if (['/', '/login', '/register', '/auth/callback'].includes(pathname)) {
            setLoading(false);
            return;
        }

        // Billing page must always be accessible even if locked
        if (pathname === '/settings/billing') {
            setLoading(false);
            return;
        }

        if (!orgId) {
            setLoading(false);
            return;
        }

        const checkSubscription = async () => {
            const { data, error } = await supabase
                .from('organizations')
                .select('subscription_status, trial_ends_at')
                .eq('id', orgId)
                .single();

            if (data) {
                const now = new Date();
                const trialEnd = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
                const isTrialExpired = trialEnd && now > trialEnd;

                // Lock if: Trial Expired AND Status is still 'trial' (not active)
                // Also lock if status is 'expired' or 'canceled'
                if (
                    (data.subscription_status === 'trial' && isTrialExpired) ||
                    ['expired', 'canceled', 'past_due'].includes(data.subscription_status || '')
                ) {
                    setIsLocked(true);
                    router.push('/settings/billing');
                }
            }
            setLoading(false);
        };

        checkSubscription();
    }, [orgId, pathname, router]);

    // If locked, we effectively render nothing (or a loading state) until redirect happens
    // But since we push to billing, we can just return children if not locked
    // If we are on /settings/billing, we always render children

    return <>{children}</>;
}
