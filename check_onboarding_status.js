require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check(email) {
    console.log(`Checking settings for: ${email}`);

    // 1. Get User ID
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) { console.log("User not found"); return; }

    console.log(`User ID: ${user.id}`);

    // 2. Get Profile -> Org ID
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (profileError) { console.log("Profile Error:", profileError); return; }
    console.log(`Org ID: ${profile.organization_id}`);

    // 3. Get Settings
    const { data: settings, error: settingsError } = await supabase
        .from('agency_settings')
        .select('*') // Select ALL to see available columns
        .eq('organization_id', profile.organization_id)
        .single();

    if (settingsError) {
        console.log("Settings Error:", settingsError);
    } else {
        console.log("Settings Found Keys:", Object.keys(settings));
        console.log("Is 'onboarding_completed' present?", 'onboarding_completed' in settings);
        console.log("Value:", settings.onboarding_completed);
    }
}

check('test6@agenzia.com');
