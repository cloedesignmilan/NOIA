require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function confirmUser(email) {
    console.log(`Searching for user: ${email}`);
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) { console.error("User not found!"); return; }

    console.log(`User ID: ${user.id}`);

    if (user.email_confirmed_at) {
        console.log("ALREADY CONFIRMED.");
    } else {
        console.log("CONFIRMING NOW...");
        const { error } = await supabase.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
        );
        if (error) console.error("Error:", error);
        else console.log("SUCCESS! Confirmed.");
    }
}

confirmUser('test7@agenzia.com');
