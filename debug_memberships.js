require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_EMAIL = 'immobiliare@me.com';

async function run() {
    console.log(`Debug Memberships for: ${TARGET_EMAIL}`);

    // 1. Get User
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === TARGET_EMAIL);

    if (!user) { console.error('User not found'); return; }
    console.log(`User ID: ${user.id}`);

    // 2. Get Memberships
    const { data: members, error: memError } = await supabase
        .from('organization_members')
        .select('organization_id, role, organizations(name)')
        .eq('user_id', user.id);

    if (memError) { console.error('Error fetching members:', memError); }
    else {
        console.log(`\n--- CURRENT MEMBERSHIPS (${members.length}) ---`);
        members.forEach(m => {
            console.log(`- [${m.role}] ${m.organizations?.name} (ID: ${m.organization_id})`);
        });
    }

    // 3. List ALL Orgs (just to see if we can spot the orphan)
    // Be careful if many.
    const { data: allOrgs } = await supabase.from('organizations').select('id, name, created_at, subscription_tier').order('created_at', { ascending: false }).limit(10);

    console.log(`\n--- RECENT ORGS (System Wide) ---`);
    allOrgs.forEach(o => {
        console.log(`- ${o.name} (${o.subscription_tier}) [${o.id}]`);
    });
}

run();
