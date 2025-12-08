
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Service Role client to bypass RLS when updating org status
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(req: Request) {
    try {
        const { planId, subscriptionId, organizationId } = await req.json();

        if (!organizationId || !planId || !subscriptionId) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // Map planId (e.g., 'pro', 'max') to limits
        let maxAgents = 2;
        if (planId === 'max') maxAgents = 5;
        if (planId === 'elite') maxAgents = 9;

        // Update Organization in DB
        const { error } = await supabaseAdmin
            .from('organizations')
            .update({
                subscription_status: 'active',
                plan_tier: planId,
                paypal_subscription_id: subscriptionId,
                max_agents: maxAgents,
                trial_ends_at: null // Clear trial end, or set to future renewal date if needed (but subscription_status 'active' should override trial check)
            })
            .eq('id', organizationId);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Subscription activation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
