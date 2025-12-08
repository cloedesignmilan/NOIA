
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCurrentOrg } from '@/lib/hooks';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export function TrialProgressBar() {
    const { orgId } = useCurrentOrg();
    const [daysLeft, setDaysLeft] = useState<number | null>(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) return;

        const checkTrial = async () => {
            const { data } = await supabase
                .from('organizations')
                .select('trial_ends_at, subscription_status')
                .eq('id', orgId)
                .single();

            if (data) {
                setSubscriptionStatus(data.subscription_status);
                if (data.subscription_status === 'trial' && data.trial_ends_at) {
                    const end = new Date(data.trial_ends_at);
                    const now = new Date();
                    const diffTime = end.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    setDaysLeft(diffDays > 0 ? diffDays : 0);
                } else {
                    setDaysLeft(null);
                }
            }
            setLoading(false);
        };

        checkTrial();
    }, [orgId]);

    if (loading || subscriptionStatus !== 'trial' || daysLeft === null) return null;

    // Calculate percentage (assuming 14 days max)
    const percentage = (daysLeft / 14) * 100;

    // Color logic
    let colorClass = "bg-emerald-500";
    if (daysLeft <= 5) colorClass = "bg-yellow-500";
    if (daysLeft <= 2) colorClass = "bg-rose-600"; // Urgency!

    return (
        <div className="w-full px-4 mb-6">
            <Link href="/settings/billing">
                <div className="bg-muted/40 border border-border/60 rounded-xl p-3 hover:bg-muted/60 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-md ${daysLeft <= 2 ? 'bg-rose-100 text-rose-600' : 'bg-primary/10 text-primary'}`}>
                                <Zap className="w-3.5 h-3.5 fill-current" />
                            </div>
                            <span className="text-xs font-bold text-foreground">Versione Start</span>
                        </div>
                        <span className={`text-xs font-bold ${daysLeft <= 2 ? 'text-rose-600' : 'text-muted-foreground'}`}>
                            {daysLeft} {daysLeft === 1 ? 'giorno' : 'giorni'}
                        </span>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
                        {/* Progress Indicator */}
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
            </Link>
        </div>
    );
}
