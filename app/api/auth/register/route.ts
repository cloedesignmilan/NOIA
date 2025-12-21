import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { email, password, agencyName, fullName } = await req.json();

        // 1. Create User with Auto-Confirm (Admin)
        // Note: verified email is crucial for certain RLS policies
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError) {
            console.error("Admin CreateUser Error:", authError);
            throw authError;
        }

        const user = authData.user;
        if (!user) throw new Error("User creation failed (no data)");

        console.log(`[REGISTER] User created: ${user.id}, Confirmed At: ${user.email_confirmed_at}`);

        // 2. Create Organization
        const { data: orgData, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert([{ name: agencyName, subscription_tier: 'free' }])
            .select()
            .single();

        if (orgError) throw new Error(`Org Creation Failed: ${orgError.message}`);

        // 3. Create Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert([{
                id: user.id,
                organization_id: orgData.id,
                full_name: fullName,
                email: email,
                role: 'owner',
                role_level: 'admin',
                access_level: 'full_access'
            }]);

        if (profileError) throw new Error(`Profile Creation Failed: ${profileError.message}`);

        // 4. Create Settings (Force Onboarding)
        await supabaseAdmin.from('agency_settings').insert([{
            organization_id: orgData.id,
            agency_name: agencyName,
            onboarding_completed: false
        }]);

        return NextResponse.json({ success: true, user });

    } catch (error: any) {
        console.error("Registration API Error:", error);
        return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
    }
}
