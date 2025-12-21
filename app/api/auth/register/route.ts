import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    let createdUserId: string | null = null;
    let createdOrgId: string | null = null;

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
            throw authError; // No rollback needed yet
        }

        const user = authData.user;
        if (!user) throw new Error("User creation failed (no data)");

        createdUserId = user.id; // Mark for potential rollback
        console.log(`[REGISTER] User created: ${user.id}`);

        // 2. Create Organization
        const { data: orgData, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert([{ name: agencyName, subscription_tier: 'free' }])
            .select()
            .single();

        if (orgError) throw new Error(`Org Creation Failed: ${orgError.message}`);
        createdOrgId = orgData.id; // Could rollback org too if needed, but cascade might handle user

        // 3. Create Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert([{
                id: user.id,
                organization_id: orgData.id,
                full_name: fullName,
                email: email,
                role: 'owner'
            }]);

        if (profileError) throw new Error(`Profile Creation Failed: ${profileError.message}`);

        // 4. Create Settings (Force Onboarding)
        const { error: settingsError } = await supabaseAdmin.from('agency_settings').insert([{
            organization_id: orgData.id,
            agency_name: agencyName,
            onboarding_completed: false
        }]);

        if (settingsError) throw new Error(`Settings Creation Failed: ${settingsError.message}`);

        // 5. Seed Default Categories (Entrate & Uscite)
        const defaultCategories = [
            // INCOME
            { section: 'income', macro_category: 'intermediazione', name: '1.1 Comm. Vendita' },
            { section: 'income', macro_category: 'intermediazione', name: '1.2 Comm. Locazione' },
            { section: 'income', macro_category: 'servizi', name: '2.1 Consulenza' },
            { section: 'income', macro_category: 'servizi', name: '2.2 Gestione Affitti' },
            // EXPENSE
            { section: 'expense', macro_category: 'marketing', name: 'Portali Immobiliari' },
            { section: 'expense', macro_category: 'marketing', name: 'Social Ads' },
            { section: 'expense', macro_category: 'ufficio', name: 'Affitto Ufficio' },
            { section: 'expense', macro_category: 'ufficio', name: 'Utenze' },
            { section: 'expense', macro_category: 'personale', name: 'Collaboratori' },
            { section: 'expense', macro_category: 'tasse', name: 'Imposte e Tasse' }
        ];

        const { error: seedError } = await supabaseAdmin
            .from('transaction_categories')
            .insert(defaultCategories.map(c => ({ ...c, organization_id: orgData.id })));

        if (seedError) {
            console.error("Category Seeding Warning:", seedError);
            // We don't rollback for this, it's non-critical, user can add manually.
        }

        return NextResponse.json({ success: true, user });

    } catch (error: any) {
        console.error("Registration API Error:", error);

        // ROLLBACK
        if (createdUserId) {
            console.warn(`[ROLLBACK] Deleting user ${createdUserId} due to failure...`);
            await supabaseAdmin.auth.admin.deleteUser(createdUserId);
            // If we created an org, we might want to delete it too, but user deletion cascades usually? 
            // Or orphaned orgs are less critical than zombie users.
            if (createdOrgId) {
                await supabaseAdmin.from('organizations').delete().eq('id', createdOrgId);
            }
        }

        return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
    }
}
