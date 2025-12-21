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

        return NextResponse.json({ orgs });

    } catch (error: any) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
