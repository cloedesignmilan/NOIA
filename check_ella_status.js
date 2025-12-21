require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkStatus() {
    const email = 'ellaandjakewedding@gmail.com';
    console.log(`Checking status for: ${email}`);

    // 1. Check Auth
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = users.find(u => u.email === email);
    console.log(`[AUTH] Exists? ${authUser ? 'YES (' + authUser.id + ')' : 'NO'}`);

    // 2. Check Profiles (by email if possible, or assume we don't know ID)
    // We can't query profiles by email directly usually unless we have a column.
    // We can try to query all profiles and filter manually if small, or if we had the ID.

    // Let's assume we don't have ID. Let's dump profiles.
    const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
    // Check if any profile matches email? Usually profiles don't store email directly, they link to auth.
    // Wait, profiles often DO replicate email or use auth.uid.
    // Let's assume we can't find by email easily in profiles unless we iterate.
    // But if Auth is NO, then we don't have an ID to link.

    // Is there any other table? 'organizations'?
    const { data: orgs } = await supabaseAdmin.from('organizations').select('*');
    const org = orgs.find(o => o.email === email); // if orgs have email
    console.log(`[ORG] Exists by email? ${org ? 'YES' : 'NO'}`);

    if (authUser) {
        // Check if profile exists for this ID
        const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', authUser.id).single();
        console.log(`[PROFILE] Exists for AuthID? ${profile ? 'YES' : 'NO'}`);
    }
}

checkStatus();
