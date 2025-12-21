require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check(email) {
    console.log(`Checking settings for: ${email}`);

    // 1. Get User
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) { console.log("User not found"); return; }

    // 2. Get Profile -> Org
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile) { console.log("Profile missing"); return; }

    console.log(`Org ID: ${profile.organization_id}`);

    // 3. Get Settings
    const { data: settings, error } = await supabase
        .from('agency_settings')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .single();

    if (error) {
        console.log("Settings Error:", error);
    } else {
        console.log("Settings Found. Onboarding Completed?", settings.onboarding_completed);
        console.log("All Keys:", Object.keys(settings));
    }
}

check('test7@agenzia.com');
