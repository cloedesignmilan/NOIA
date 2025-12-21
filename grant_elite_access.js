require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_EMAIL = 'immobiliare@me.com';

async function run() {
    console.log(`Searching for user: ${TARGET_EMAIL}...`);

    // 1. Find User ID from Auth (Admin API needed or check profiles if email is there)
    // Note: 'profiles' table usually stores email if we synced it. Let's check 'profiles' first.
    // Use admin.listUsers if needed, but simple query might work if email is in public table.
    // If not, we have to use auth.admin.

    // Attempt 1: Check profiles (assuming email is stored or we can join)
    // Actually, profiles table often has email.

    let userId = null;
    let orgId = null;

    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error('Error fetching users:', userError);
        // Fallback: Try to find in profiles directly if email column exists
    } else {
        const user = users.find(u => u.email === TARGET_EMAIL);
        if (user) {
            userId = user.id;
            console.log(`Found User ID: ${userId}`);
        }
    }

    if (!userId) {
        console.error(`User ${TARGET_EMAIL} not found in Auth.`);
        return;
    }

    // 2. Get Organization
    const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userId)
        .single();

    if (profError || !profile) {
        console.error('Profile not found or error:', profError);
        return;
    }

    orgId = profile.organization_id;
    console.log(`Found Organization ID: ${orgId}`);

    if (!orgId) {
        console.error('User has no organization.');
        return;
    }

    // 3. Update Organization to Elite
    const { error: updateError } = await supabase
        .from('organizations')
        .update({
            subscription_tier: 'elite', // strictly lowercase usually? or Elite? Billing page uses 'elite' ID.
            plan_tier: 'elite',         // Sync both fields
            subscription_status: 'active'
        })
        .eq('id', orgId);

    if (updateError) {
        console.error('Error updating organization:', updateError);
    } else {
        console.log(`✅ Success! Organization ${orgId} upgraded to ELITE.`);
    }
}

run();
