import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // 1. Verify Authentication manually (no cookie helpers available)
        // We expect the client to send the Bearer token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');

        // Use a temp client to verify the token
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        // 2. Strict Access Control
        if (user.email !== 'superadmin@noia.cloud') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Fetch Global Data using Service Role
        const { data: orgs, error } = await supabaseAdmin
            .from('organizations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 3.5 Fetch Settings (Address, etc) AND Owner Email from Profiles
        const orgIds = orgs.map((o: any) => o.id);

        // Parallel Fetch: Settings & Owners
        const [settingsRes, ownersRes] = await Promise.all([
            supabaseAdmin.from('agency_settings').select('*').in('organization_id', orgIds),
            supabaseAdmin.from('profiles').select('organization_id, email').eq('role', 'owner').in('organization_id', orgIds)
        ]);

        const settingsMap = new Map();
        if (settingsRes.data) {
            settingsRes.data.forEach((s: any) => settingsMap.set(s.organization_id, s));
        }

        const ownersMap = new Map();
        if (ownersRes.data) {
            ownersRes.data.forEach((o: any) => ownersMap.set(o.organization_id, o.email));
        }

        // 4. Fetch Activity Stats (Transactions)
        // Optimization: Select only needed fields to keep payload light
        const { data: transactions, error: txError } = await supabaseAdmin
            .from('transactions')
            .select('organization_id, created_at');

        if (txError) console.error("Error fetching transactions:", txError);

        // 5. Aggregate Stats
        const orgStats = (orgs || []).map((org: any) => {
            const orgTxs = (transactions || []).filter((t: any) => t.organization_id === org.id);
            const lastTx = orgTxs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            const setting = settingsMap.get(org.id);
            const ownerEmail = ownersMap.get(org.id);

            // Calculate Spend
            let spend = 0;
            if (org.subscription_tier === 'pro') spend = 29;
            if (org.subscription_tier === 'enterprise') spend = 99;

            return {
                ...org,
                transaction_count: orgTxs.length,
                last_active: lastTx ? lastTx.created_at : null,
                address: setting?.address || null,
                email: ownerEmail || null, // Explicitly set email from profile
                agency_name_display: setting?.agency_name || org.name,
                spend_amount: spend
            };
        });

        return NextResponse.json({ orgs: orgStats });

    } catch (error: any) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
