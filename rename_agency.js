require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_ID = '9b076a02-953e-4b84-bfab-8b23e28901c0';
const NEW_NAME = 'Agenzia Azzurra';

async function run() {
    console.log(`Renaming Org ${TARGET_ID} to "${NEW_NAME}"...`);

    const { data, error } = await supabase
        .from('organizations')
        .update({ name: NEW_NAME })
        .eq('id', TARGET_ID)
        .select();

    if (error) {
        console.error('Error renaming:', error);
    } else {
        console.log('Success!', data);
    }
}

run();
