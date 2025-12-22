require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ORG_ID = '37000b91-7a69-4549-b448-777855526bd7';

async function run() {
    console.log(`Checking Org ${ORG_ID}...`);

    const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', ORG_ID)
        .single();

    if (org) {
        console.log(`Name: ${org.name}`);
        console.log(`Tier: ${org.subscription_tier}`); // Likely 'free'
        console.log(`Status: ${org.subscription_status}`);
        console.log(`Trial Ends: ${org.trial_ends_at}`);
    } else {
        console.error('Org not found.');
    }
}

run();
