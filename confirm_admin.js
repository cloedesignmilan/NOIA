
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase keys in .env.local");
    console.log("Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function confirmAdmin() {
    const email = 'superadmin@noia.cloud';
    console.log(`🔍 Looking for user: ${email}...`);

    // 1. Get User ID
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error("Error listing users:", listError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error("❌ User not found! Did you register superadmin@noia.cloud?");
        return;
    }

    console.log(`✅ Found user ID: ${user.id}`);
    console.log(`   Current Status: ${user.email_confirmed_at ? 'Confirmed' : 'Unconfirmed'}`);

    // 2. Confirm Email
    if (user.email_confirmed_at) {
        console.log("   User is already confirmed.");
    } else {
        const { data, error } = await supabase.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
        );

        if (error) {
            console.error("❌ Failed to confirm:", error.message);
        } else {
            console.log("✅ SUCCESS: User confirmed manually.");
        }
    }
}

confirmAdmin();
