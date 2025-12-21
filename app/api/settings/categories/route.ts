import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getContext(token: string) {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { data: profile } = await supabaseAdmin.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile?.organization_id) throw new Error('Org not found');

    return { user, orgId: profile.organization_id };
}

export async function GET(req: Request) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { user, orgId } = await getContext(token);

        const { data, error } = await supabaseAdmin
            .from('transaction_categories')
            .select('*')
            .eq('organization_id', orgId)
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true });

        if (error) {
            if (error.code === '42703') { // Undefined column
                const { data: retryData } = await supabaseAdmin
                    .from('transaction_categories')
                    .select('*')
                    .eq('organization_id', orgId)
                    .order('name', { ascending: true });

                const response = NextResponse.json(retryData || []);
                response.headers.set('X-Debug-Org-ID', orgId);
                return response;
            }
            throw error;
        }

        const response = NextResponse.json(data || []);
        response.headers.set('X-Debug-Org-ID', orgId);
        response.headers.set('X-Debug-User-ID', user.id);
        return response;

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { orgId } = await getContext(token);
        const body = await req.json();

        const { data, error } = await supabaseAdmin
            .from('transaction_categories')
            .insert({
                organization_id: orgId,
                section: body.section,
                macro_category: body.macro_category,
                name: body.name,
                sort_order: body.sort_order
            })
            .select()
            .single();

        if (error) {
            if (error.code === '42703') {
                const { data: retryData, error: retryError } = await supabaseAdmin
                    .from('transaction_categories')
                    .insert({
                        organization_id: orgId,
                        section: body.section,
                        macro_category: body.macro_category,
                        name: body.name
                    })
                    .select()
                    .single();
                if (retryError) throw retryError;
                return NextResponse.json(retryData);
            }
            throw error;
        }

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { orgId } = await getContext(token);
        const body = await req.json();
        const { id, ...updates } = body;

        const { error } = await supabaseAdmin
            .from('transaction_categories')
            .update(updates)
            .eq('id', id)
            .eq('organization_id', orgId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { orgId } = await getContext(token);

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        const { error } = await supabaseAdmin
            .from('transaction_categories')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
