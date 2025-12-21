require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_EMAIL = 'immobiliare@me.com';

async function run() {
    console.log(`Checking status for: ${TARGET_EMAIL}...`);

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === TARGET_EMAIL);

    if (!user) { console.error('User not found'); return; }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile) { console.error('Profile not found'); return; }

    const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single();

    console.log('User ID:', user.id);
    console.log('Org ID:', profile.organization_id);
    console.log('--- ORG DATA ---');
    console.log('Name:', org.name);
    console.log('Subscription Tier:', org.subscription_tier);
    console.log('Plan Tier:', org.plan_tier);
    console.log('Subscription Status:', org.subscription_status);
    console.log('Trial Ends:', org.trial_ends_at);
}

run();
