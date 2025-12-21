require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const USER_ID = '2f6b652c-7984-4420-b48d-742efcf632a2';
const AZZURRA_ID = '9b076a02-953e-4b84-bfab-8b23e28901c0';
const EMAIL = 'immobiliare@me.com';

async function run() {
    console.log(`Fixing Profile for User: ${USER_ID}`);

    // Check if profile truly missing
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', USER_ID).single();
    if (existing) {
        console.log('Profile exists! Maybe RLS blocked read?');
    } else {
        console.log('Profile missing. Inserting...');
        const { error } = await supabase.from('profiles').insert({
            id: USER_ID,
            organization_id: AZZURRA_ID,
            full_name: 'Immobiliare Me',
            email: EMAIL
        });

        if (error) console.error('Insert Error:', error);
        else console.log('✅ Profile Created and linked to Azzurra.');
    }
}

run();
