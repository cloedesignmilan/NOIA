require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EMAIL = 'immobiliare@me.com';
const PASSWORD = 'password123'; // Temporary
const AGENCY_ID = '9b076a02-953e-4b84-bfab-8b23e28901c0'; // Agenzia Azzurra

async function run() {
    console.log(`Re-creating user: ${EMAIL}...`);

    // 1. Create Auth User
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true
    });

    if (createError) {
        console.error('Create User Error:', createError);
        return;
    }
    console.log(`✅ User Created. ID: ${user.id}`);

    // 2. Create Profile (if trigger didn't do it)
    // Note: Our system likely has a trigger on auth.users -> profiles.
    // Let's update the profile to point to the agency immediately.

    // Give a sec for trigger
    await new Promise(r => setTimeout(r, 2000));

    // Update Profile
    const { error: profError } = await supabase
        .from('profiles')
        .update({
            organization_id: AGENCY_ID,
            first_name: 'Immobiliare',
            last_name: 'Me'
        })
        .eq('id', user.id);

    if (profError) console.error('Profile update error:', profError);
    else console.log('✅ Profile linked to Agency.');

    // 3. Add to Organization Members
    const { error: memError } = await supabase
        .from('organization_members')
        .insert({
            user_id: user.id,
            organization_id: AGENCY_ID,
            role: 'owner'
        });

    if (memError) console.error('Membership error:', memError);
    else console.log('✅ Added as Owner of Agenzia Azzurra.');

    console.log(`\nDONE. Login with: ${EMAIL} / ${PASSWORD}`);
}

run();
