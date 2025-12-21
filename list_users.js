require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function listAll() {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) { console.error(error); return; }

    console.log("--- CURRENT AUTH USERS ---");
    users.forEach(u => {
        console.log(`- ${u.email} [${u.id}] (Confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'})`);
    });
    console.log("--------------------------");
}

listAll();
