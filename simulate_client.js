require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Use ANON key to simulate client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EMAIL = 'immobiliare@me.com';
const PASSWORD = 'password123';

async function run() {
    console.log(`Simulating Client for: ${EMAIL}...`);

    // 1. Log in
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASSWORD
    });

    if (loginError) {
        console.error('Login Failed:', loginError.message);
        return;
    }
    console.log(`✅ Logged in. User ID: ${session.user.id}`);

    // 2. Fetch Memberships (Matches AgencySwitcher.tsx)
    console.log("Fetching memberships...");
    const { data: members, error: memError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', session.user.id);

    if (memError) {
        console.error('❌ Membership Fetch Failed:', memError);
    } else {
        console.log(`✅ Memberships found: ${members.length}`);
        members.forEach(m => console.log(`   - OrgID: ${m.organization_id} (${m.role})`));

        if (members.length > 0) {
            // 3. Fetch Organizations
            const orgIds = members.map(m => m.organization_id);
            console.log(`Fetching details for ${orgIds.length} orgs...`);

            const { data: orgs, error: orgError } = await supabase
                .from('organizations')
                .select('*')
                .in('id', orgIds);

            if (orgError) {
                console.error('❌ Organization Fetch Failed:', orgError);
            } else {
                console.log(`✅ Organizations loaded: ${orgs.length}`);
                orgs.forEach(o => console.log(`   - ${o.name} (${o.id})`));
            }
        }
    }
}

run();
