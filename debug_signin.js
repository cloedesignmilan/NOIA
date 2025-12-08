
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Use ANON key for client-like login

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignIn(email, password) {
    console.log(`Attempting login for: ${email}`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('❌ Login Failed:', error.message);
        console.error('Error Details:', error);
    } else {
        console.log('✅ Login Successful!');
        console.log('User ID:', data.user.id);
        console.log('Session expires at:', data.session.expires_at);
    }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
    console.log("Usage: node debug_signin.js <email> <password>");
} else {
    testSignIn(email, password);
}
