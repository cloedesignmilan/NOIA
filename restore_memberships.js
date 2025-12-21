require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EMAIL = 'immobiliare@me.com';
const ORGS_TO_RESTORE = [
    'df829c8f-0476-4b43-aa47-7f99b869050f', // Firenze 1
    '2b971887-4ac1-4477-87ca-a6a68a8a47a7'  // Firenze 2
];

async function run() {
    console.log(`Restoring Memberships for: ${EMAIL}`);

    const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = users.find(u => u.email === EMAIL);
    if (!user) { console.error('User not found'); return; }

    for (const orgId of ORGS_TO_RESTORE) {
        // Check if exists
        const { data: org } = await supabase.from('organizations').select('name').eq('id', orgId).single();
        if (!org) {
            console.log(`⚠️ Org ${orgId} not found. Skipping.`);
            continue;
        }

        console.log(`Adding to ${org.name} (${orgId})...`);
        const { error } = await supabase.from('organization_members').insert({
            user_id: user.id,
            organization_id: orgId,
            role: 'owner'
        });

        if (error) {
            // Ignore unique violation if already there
            if (error.code === '23505') console.log("   -> Already a member.");
            else console.error("   -> Error:", error);
        } else {
            console.log("   ✅ Added.");
        }
    }
}

run();
