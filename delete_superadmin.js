require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables. Check .env.local');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function deleteSuperAdmin() {
    const email = 'superadmin@noia.cloud';

    console.log(`Looking for user: ${email}...`);

    // 1. Find User by Email (listUsers is the only way to search by email in admin api usually, or getUserById if we knew it)
    // Actually, listUsers typically allows filtering? No, usually pagination.
    // But we can just iterate or assume the user exists.

    // Actually, there isn't a direct "getUserByEmail" in admin API.
    // We can try listUsers.

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.log('User not found.');
        return;
    }

    console.log(`Found user ${user.id}. Deleting...`);

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
        console.error('Error deleting user:', deleteError);
    } else {
        console.log('Successfully deleted superadmin@noia.cloud');
    }
}

deleteSuperAdmin();
