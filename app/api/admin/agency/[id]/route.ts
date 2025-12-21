import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user || user.email !== 'superadmin@noia.cloud') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        console.log(`[Admin] Deleting Agency ID: ${id}`);

        // 1. Get Owner ID(s)
        const { data: owners, error: ownerError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('organization_id', id)
            .eq('role', 'owner');

        if (owners && owners.length > 0) {
            console.log(`[Admin] Found ${owners.length} owners to delete from Auth.`);
            for (const owner of owners) {
                const { error: deleteParam } = await supabaseAdmin.auth.admin.deleteUser(owner.id);
                if (deleteParam) console.error(`Failed to delete user ${owner.id}:`, deleteParam);
                else console.log(`Deleted user ${owner.id} from Auth.`);
            }
        }

        // 2. Delete Organization (Cascades to profiles, clients, etc.)
        const { error: deleteError } = await supabaseAdmin
            .from('organizations')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error("Delete Error:", deleteError);
            throw new Error(deleteError.message);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Admin Delete API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
