require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function confirmUser(email) {
    console.log(`Searching for user: ${email}`);

    // List users (Admin)
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Error listing users:", error);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error("User not found!");
        return;
    }

    console.log(`Found User ID: ${user.id}`);
    console.log(`Current Status: ${user.email_confirmed_at ? 'CONFIRMED' : 'UNCONFIRMED'}`);

    if (user.email_confirmed_at) {
        console.log("User is already confirmed.");
        return;
    }

    console.log("Attempting to force confirm...");

    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
    );

    if (updateError) {
        console.error("Update failed:", updateError);
    } else {
        console.log("SUCCESS! User confirmed.");
        console.log("New Status:", data.user.email_confirmed_at);
    }
}

confirmUser('test5@agenzia.com');
