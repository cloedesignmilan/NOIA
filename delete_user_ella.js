require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function deleteUser() {
    const email = 'ellaandjakewedding@gmail.com';
    console.log(`Searching for user: ${email}...`);

    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) { console.error(error); return; }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.log("User not found in Auth table.");
        return;
    }

    console.log(`Found user ${user.id}. Deleting...`);
    const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (delError) {
        console.error("Error deleting user:", delError);
    } else {
        console.log("Successfully deleted user.");
    }
}

deleteUser();
