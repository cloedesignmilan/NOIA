require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Admin to bypass RLS and see truth
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EMAIL = 'immobiliare@me.com';

async function run() {
    console.log(`Checking Membership Validity for: ${EMAIL}`);

    const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = users.find(u => u.email === EMAIL);
    if (!user) return;

    // Get Memberships
    const { data: members } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id);

    console.log(`User has ${members.length} memberships.`);

    for (const m of members) {
        // Check if Org actually exists
        const { data: org, error } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('id', m.organization_id)
            .single();

        if (!org) {
            console.log(`❌ ZOMBIE DETECTED! Member of ${m.organization_id} but Org not found.`);
            // Fix?
            console.log("   Deleting zombie membership...");
            await supabase.from('organization_members').delete().eq('id', m.id);
            console.log("   ✅ Cleaned.");
        } else {
            console.log(`✅ Valid: Connected to ${org.name} (${org.id})`);
        }
    }
}

run();
