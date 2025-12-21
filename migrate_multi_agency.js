require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log('--- STARTING MULTI-AGENCY MIGRATION ---');

    // 1. Apply Schema via PG (if available) or Manual instruction
    if (postgresUrl) {
        console.log('Detected POSTGRES_URL, applying schema...');
        try {
            const client = new Client({ connectionString: postgresUrl });
            await client.connect();
            const sql = fs.readFileSync(path.join(__dirname, 'multi_agency_schema.sql'), 'utf8');
            await client.query(sql);
            await client.end();
            console.log('Schema applied successfully.');
        } catch (e) {
            console.error('PG execution failed:', e);
            console.log('Trying fallback or proceeding if table exists...');
        }
    } else {
        console.warn('⚠️ NO POSTGRES_URL FOUND. Cannot apply DDL automatically.');
        console.warn('Please run "multi_agency_schema.sql" in your Supabase SQL Editor manually.');
        // We will try to proceed with backfill hoping the table exists or user runs it.
    }

    // 2. Backfill Data
    // For every profile, ensure there is an organization_members record
    console.log('Backfilling organization_members...');

    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, organization_id, role');

    if (profError) {
        console.error('Error fetching profiles:', profError);
        return;
    }

    console.log(`Found ${profiles.length} profiles to check.`);

    let successCount = 0;

    for (const p of profiles) {
        if (!p.organization_id) continue;

        // Check if exists
        const { data: existing } = await supabase
            .from('organization_members')
            .select('id')
            .eq('user_id', p.id)
            .eq('organization_id', p.organization_id)
            .maybeSingle();

        if (!existing) {
            // Insert
            const { error: insertError } = await supabase
                .from('organization_members')
                .insert({
                    user_id: p.id,
                    organization_id: p.organization_id,
                    // Map profile role to member role? Profile role might be 'owner'/'agent'.
                    // Member role logic: if profile.role is 'owner' or 'admin', make them owner.
                    role: (p.role === 'owner' || p.role === 'admin') ? 'owner' : 'member'
                });

            if (insertError) {
                // If error is "relation does not exist", it means schema wasn't applied
                if (insertError.message.includes('relation "organization_members" does not exist')) {
                    console.error('❌ CRITICAL: Table "organization_members" missing. Please run the SQL script first.');
                    return;
                }
                console.error(`Error adding user ${p.id} to org ${p.organization_id}:`, insertError.message);
            } else {
                successCount++;
            }
        }
    }

    console.log(`Backfill complete. Added ${successCount} new memberships.`);
}

run();
