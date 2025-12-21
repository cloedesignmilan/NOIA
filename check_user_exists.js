require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_EMAIL = 'immobiliare@me.com';

async function run() {
    console.log(`Verifying existence of: ${TARGET_EMAIL}`);

    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (error) { console.error('Error:', error); return; }

    const user = data.users.find(u => u.email === TARGET_EMAIL);
    if (user) {
        console.log(`✅ User FOUND.`);
        console.log(`ID: ${user.id}`);
        console.log(`Created: ${user.created_at}`);
        console.log(`Last Sign In: ${user.last_sign_in_at}`);
    } else {
        console.log(`❌ User NOT FOUND.`);
        console.log(`Total users found: ${data.users.length}`);
    }
}

run();
