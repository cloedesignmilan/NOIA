
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Create a Supabase client with the SERVICE ROLE key for admin actions
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
        // 1. Verify the Requesting User is an Admin
        // We use a regular client to check the caller's session permissions
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Get the session from the request headers/cookies manually or rely on client passing it?
        // Easier: Verify JWT from Auth header.
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin of their org
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        // 2. Parse Body
        const { email, password, firstName, lastName, role, access_level } = await req.json();

        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // 3. Create User via Admin API
        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: `${firstName} ${lastName}`
            }
        });

        if (createError) throw createError;
        if (!userData.user) throw new Error("User creation failed");

        // 4. Create Profile linked to Org
        // We use supabaseAdmin to bypass RLS for inserting the profile for ANOTHER user
        const { error: profileInsertError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: userData.user.id,
                organization_id: profile.organization_id,
                full_name: `${firstName} ${lastName}`,
                email: email,
                role: role || 'agent',
                access_level: access_level || 'full_access'
            });

        if (profileInsertError) {
            // Rollback user creation if profile fails? 
            // Ideally yes, but complex. For now, throw.
            console.error("Profile insert error:", profileInsertError);
            await supabaseAdmin.auth.admin.deleteUser(userData.user.id); // Try to rollback
            throw new Error("Failed to create profile linked to organization");
        }

        return NextResponse.json({ success: true, user: userData.user });

    } catch (error: any) {
        console.error("Create member error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
