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

        // 1. Delete Organization (Cascades to profiles, clients, etc.)
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
