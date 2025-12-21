require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_EMAIL = 'cris.calcagnile@gmail.com';

async function run() {
    console.log(`Checking memberships for: ${TARGET_EMAIL}`);

    const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = users.find(u => u.email === TARGET_EMAIL);

    if (!user) { console.error('User not found'); return; }
    console.log(`User ID: ${user.id}`);

    // Memberships
    const { data: members, error: memError } = await supabase
        .from('organization_members')
        .select('organization_id, role, organizations(name, subscription_status, subscription_tier)')
        .eq('user_id', user.id);

    if (memError) { console.error(memError); }
    else {
        console.log(`\n--- MEMBERSHIPS (${members.length}) ---`);
        members.forEach(m => {
            const org = m.organizations;
            console.log(`- ${org?.name} (ID: ${m.organization_id}) [${m.role}]`);
            console.log(`  Status: ${org?.subscription_status}, Tier: ${org?.subscription_tier}`);
        });
    }
}

run();
