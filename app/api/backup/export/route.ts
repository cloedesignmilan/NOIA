import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Manually handle Auth via Header (bypass middleware dependency)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Missing Authorization Header' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized: Invalid Token' }, { status: 401 });

        // 2. Get Org ID
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }

        const orgId = profile.organization_id;

        // 3. Parallel Fetching for Efficiency
        const [org, settings, agents, transactions, assignments] = await Promise.all([
            supabase.from('organizations').select('*').eq('id', orgId).single(),
            supabase.from('agency_settings').select('*').eq('organization_id', orgId).single(),
            supabase.from('agents').select('*').eq('organization_id', orgId),
            supabase.from('transactions').select('*').eq('organization_id', orgId),
            supabase.from('assignments').select('*').eq('organization_id', orgId)
        ]);

        // 3b. Update last_backup_at (Resilient)
        try {
            await supabase
                .from('agency_settings')
                .update({ last_backup_at: new Date().toISOString() })
                .eq('organization_id', orgId);
        } catch (updateError) {
            console.warn("Could not update last_backup_at (migration likely missing):", updateError);
            // Proceed anyway
        }

        // 4. Construct Backup Object
        const backupData = {
            metadata: {
                exported_at: new Date().toISOString(),
                exported_by: user.email,
                version: "1.0"
            },
            organization: org.data,
            settings: settings.data,
            agents: agents.data || [],
            transactions: transactions.data || [],
            assignments: assignments.data || []
        };

        // 5. Return JSON File
        return new NextResponse(JSON.stringify(backupData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="noia_backup_${new Date().toISOString().split('T')[0]}.json"`
            }
        });

    } catch (error: any) {
        console.error("Backup Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
