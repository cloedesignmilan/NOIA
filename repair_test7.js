require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function repair(email) {
    console.log(`Repairing settings for: ${email}`);

    // 1. Get User & Org
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) { console.log("User not found"); return; }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile) { console.log("Profile missing"); return; }

    // 2. Insert Settings
    console.log(`Inserting settings for Org: ${profile.organization_id}`);

    const { error } = await supabase.from('agency_settings').insert([{
        organization_id: profile.organization_id,
        agency_name: 'Agenzia Test 7',
        onboarding_completed: false // THIS TRIGGERS THE WIZARD
    }]);

    if (error) {
        console.error("Insert Failed:", error);
        if (error.code === '42703') console.log("!! COLUMN STILL MISSING !!");
    } else {
        console.log("SUCCESS! Settings created.");
    }
}

repair('test7@agenzia.com');
