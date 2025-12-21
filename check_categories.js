require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCategories(email) {
    console.log(`Checking categories for: ${email}`);

    // 1. Get User/Org
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) { console.log("User not found"); return; }

    const { data: profile } = await supabaseAdmin.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile) { console.log("Profile missing"); return; }
    console.log(`Org ID: ${profile.organization_id}`);

    // 2. Count Categories
    const { count, error } = await supabaseAdmin
        .from('transaction_categories')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id);

    if (error) {
        console.error("Count Error:", error);
    } else {
        console.log(`Total Categories Found in DB: ${count}`);
    }
}

checkCategories('test7@agenzia.com');
