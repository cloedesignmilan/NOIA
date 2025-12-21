require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables.');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function cleanupOrphanedUsers() {
    console.log('Starting cleanup of orphaned users...');

    // 1. List all users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    console.log(`Found total ${users.length} users in Auth.`);

    for (const user of users) {
        // PROTECT SUPERADMIN
        if (user.email === 'superadmin@noia.cloud') continue;

        // Check if profile exists
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        // If profile is missing (and not superadmin), delete user
        if (!profile) {
            console.log(`User ${user.email} (${user.id}) has NO profile. Deleting...`);
            const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
            if (delError) console.error(`Failed to delete ${user.email}:`, delError);
            else console.log(`Deleted orphaned user: ${user.email}`);
        } else {
            // console.log(`User ${user.email} is valid.`);
        }
    }

    console.log('Cleanup complete.');
}

cleanupOrphanedUsers();
