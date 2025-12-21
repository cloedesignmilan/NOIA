require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function identifyOrg(orgId) {
    console.log(`Identifying Owner of Org: ${orgId}`);

    // 1. Find profile linked to this Org
    const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name')
        .eq('organization_id', orgId);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.log("No profiles found for this Org!");
    } else {
        console.log("Found Profiles:", profiles);
    }
}

identifyOrg('46dba995-915c-4fb1-954a-1ffd7476f7c4');
