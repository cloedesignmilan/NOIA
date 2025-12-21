require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix(email) {
    console.log(`Fixing settings for: ${email}`);

    // 1. Get User & Org
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) { console.log("User not found"); return; }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile) { console.log("Profile missing"); return; }

    console.log(`Org ID: ${profile.organization_id}`);

    // 2. Insert Settings
    // We try to insert with onboarding_completed: false
    const { data, error } = await supabase.from('agency_settings').insert([{
        organization_id: profile.organization_id,
        agency_name: 'Agenzia Test 5',
        onboarding_completed: false
    }]);

    if (error) {
        console.error("Insert Failed!", error);
        if (error.code === '42703') {
            console.log("==> COLUMN MISSING! Please run migration.");
        }
    } else {
        console.log("SUCCESS! Settings row created.");
    }
}

fix('test5@agenzia.com');
