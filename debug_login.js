
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser(email) {
    console.log(`Checking user: ${email}`);

    // List users (requires service role)
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.log('❌ USER NOT FOUND in auth.users');
        console.log('Total users found:', users.length);
        if (users.length > 0) console.log('Sample user:', users[0].email);
    } else {
        console.log('✅ USER FOUND');
        console.log('ID:', user.id);
        console.log('Email Confirmed At:', user.email_confirmed_at);
        console.log('Phone Confirmed At:', user.phone_confirmed_at);
        console.log('Last Sign In:', user.last_sign_in_at);
        console.log('User Metadata:', user.user_metadata);

        // Check Profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.log('❌ PROFILE ERROR:', profileError.message);
        } else {
            console.log('✅ PROFILE FOUND:', profile);
        }
    }
}

// Get email from arg
const email = process.argv[2];
if (!email) {
    console.log("Usage: node debug_login.js <email>");
} else {
    checkUser(email);
}
