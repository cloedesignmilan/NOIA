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

async function confirmSuperAdmin() {
    const email = 'superadmin@noia.cloud';
    console.log(`Confirming email for: ${email}...`);

    // 1. Get User ID
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.log('User not found. Did you register?');
        return;
    }

    // 2. Update User to Confirm Email
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true, user_metadata: { email_verified: true } }
    );

    if (error) {
        console.error('Error confirming email:', error);
    } else {
        console.log('Successfully confirmed email for superadmin@noia.cloud');
    }
}

confirmSuperAdmin();
