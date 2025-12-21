require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("Searching for 'Firenze' orgs...");

    const { data: orgs, error } = await supabase
        .from('organizations')
        .select('id, name, created_at')
        .ilike('name', '%Firenze%');

    if (error) console.error(error);
    else {
        console.log(`Found ${orgs.length} orgs.`);
        orgs.forEach(o => console.log(`- ${o.name} (${o.id})`));
    }
}

run();
