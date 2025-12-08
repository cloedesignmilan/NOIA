
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetPassword(email, newPassword) {
    console.log(`Resetting password for: ${email}`);

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User not found');
        return;
    }

    const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
    );

    if (error) {
        console.error('Error resetting password:', error);
    } else {
        console.log('✅ Password updated successfully to:', newPassword);
    }
}

const email = process.argv[2];
const password = process.argv[3] || 'password123';

if (!email) {
    console.log("Usage: node reset_password.js <email> [new_password]");
} else {
    resetPassword(email, password);
}
