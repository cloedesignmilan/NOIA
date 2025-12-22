require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ORG_ID = '37000b91-7a69-4549-b448-777855526bd7';

async function run() {
    console.log(`Upgrading Org ${ORG_ID} to PRO/ACTIVE...`);

    const { data, error } = await supabase
        .from('organizations')
        .update({
            subscription_tier: 'pro',
            subscription_status: 'active',
            plan_tier: 'pro',
            trial_ends_at: null // Remove trial
        })
        .eq('id', ORG_ID)
        .select();

    if (error) console.error(error);
    else console.log('Success:', data);
}

run();
