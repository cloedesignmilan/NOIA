import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    try {
        const { organizationId } = await req.json();

        // 1. Get Current User
        const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

        // Simpler: Just rely on the client sending the access token, or assume this is a secure environment?
        // No, we must verify the user.
        // Let's use the standard `supabase.auth.getUser()` pattern if we can pass cookies/headers.
        // Or simpler: Trust the client to pass the Authorization header and use `getUser` with that.

        // For simplicity in this codebase context where Supabase Helper is separate:
        // We will try to parse the user from the Authorization header manually?
        // Or just assume `supabase` client is constructed with headers.

        // Let's grab the token from headers
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 2. Verify Membership
        const { data: membership, error: memError } = await supabaseAdmin
            .from('organization_members')
            .select('id')
            .eq('user_id', user.id)
            .eq('organization_id', organizationId)
            .single();

        if (memError || !membership) {
            return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
        }

        // 3. Update Profile (Context Switch)
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ organization_id: organizationId })
            .eq('id', user.id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Switch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
