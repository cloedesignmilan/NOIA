require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function simulateUpdate(email) {
    console.log(`Simulating Update for: ${email}`);

    // 1. Get User
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) { console.log("User not found"); return; }

    // 2. Get Org
    const { data: profile } = await supabaseAdmin.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile) { console.log("Profile missing"); return; }
    console.log(`Org ID: ${profile.organization_id}`);

    // 3. Update
    const payload = {
        agency_name: 'Agenzia Test 7 Updated',
        vat_code: '12345678901',
        address: 'Test Address',
        tax_regime: 'ordinario',
        target_annual_revenue: 100000,
        onboarding_completed: true
    };

    console.log("Attempting Update...", payload);

    const { data, error } = await supabaseAdmin
        .from('agency_settings')
        .update(payload)
        .eq('organization_id', profile.organization_id)
        .select();

    if (error) {
        console.error("UPDATE ERROR:", error);
    } else {
        console.log("UPDATE SUCCESS. Rows:", data.length);
        console.log(data);
    }
}

simulateUpdate('test7@agenzia.com');
