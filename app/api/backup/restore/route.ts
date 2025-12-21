import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // Manually handle Auth via Header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Missing Authorization Header' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized: Invalid Token' }, { status: 401 });

        // 2. Get Org ID securely
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
        }
        const orgId = profile.organization_id;

        // 3. Parse and Validate Backup File
        const backupData = await req.json();

        // Basic Validation
        if (!backupData.metadata || !backupData.organization || !backupData.settings) {
            return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 });
        }

        // Verify Org Match (Protection against importing data into wrong org)
        if (backupData.organization.id !== orgId) {
            // OPTIONAL: Allow if user confirms "Force Overwrite"? 
            // For now, let's be strict. BUT, backups might be used to migrate to NEW org?
            // If migrate to new org, ID would mismatch. 
            // Let's check if the user is Admin (role).
            // Proceed assuming we are overwriting CURRENT Org with data from Backup.
            // We should overwrite IDs? NO. We should probably keep existing OrgID but update fields.
            // COMPLEXITY: Foreign Keys.
            // "Wipe & Replace" strategy usually implies: Delete all rows in child tables for OrgID, then Insert new rows.
            // If IDs in backup differ from current OrgID, we must transform them?
            // Easiest "Restore" is usually same-org restore (Time Machine).

            if (backupData.organization.id !== orgId) {
                return NextResponse.json({ error: 'Backup belongs to a different Organization ID. Restore not allowed.' }, { status: 403 });
            }
        }

        // 4. Perform Wipe & Replace (Transaction-like)
        // Since Supabase REST doesn't support big transactions easily, we do sequential ops.
        // DANGER: If it fails mid-way, data is partial.
        // We use Admin client to bypass RLS for deletes.

        console.log(`[RESTORE] Starting restore for Org: ${orgId}`);

        // A. DELETE Existing Data (Order matters for FK)
        // 1. Transactions
        await supabaseAdmin.from('transactions').delete().eq('organization_id', orgId);
        // 2. Assignments
        await supabaseAdmin.from('assignments').delete().eq('organization_id', orgId);
        // 3. Agents (Be careful about user links? Agents table is metadata. Profiles are Auth.)
        // If we delete agents, we break links to 'profiles' maybe?
        // Let's assume 'agents' table is safe to refresh.
        await supabaseAdmin.from('agents').delete().eq('organization_id', orgId);

        // B. INSERT New Data
        // 1. Agents
        if (backupData.agents?.length > 0) {
            const { error } = await supabaseAdmin.from('agents').insert(backupData.agents);
            if (error) throw new Error(`Agents Restore Error: ${error.message}`);
        }
        // 2. Assignments
        if (backupData.assignments?.length > 0) {
            const { error } = await supabaseAdmin.from('assignments').insert(backupData.assignments);
            if (error) throw new Error(`Assignments Restore Error: ${error.message}`);
        }
        // 3. Transactions
        if (backupData.transactions?.length > 0) {
            const { error } = await supabaseAdmin.from('transactions').insert(backupData.transactions);
            if (error) throw new Error(`Transactions Restore Error: ${error.message}`);
        }

        // C. Update Settings & Org Info
        // Don't delete Org, just update.
        await supabaseAdmin.from('agency_settings').upsert({
            ...backupData.settings,
            organization_id: orgId // Ensure ID consistency
        });

        await supabaseAdmin.from('organizations').update(backupData.organization).eq('id', orgId);

        return NextResponse.json({ success: true, message: 'Restore completed successfully' });

    } catch (error: any) {
        console.error("Restore Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
