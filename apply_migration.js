
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ No POSTGRES_URL or DATABASE_URL found in .env.local");
    // Try to construct from Supabase URL if strictly needed, but usually POSTGRES_URL is provided by Vercel/Supabase envs
    // For local dev, we might differ. Let's try to parse from standard args if missing.
    process.exit(1);
}

// Fix for "self signed certificate" error in some envs
const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        await client.connect();
        console.log("🔌 Connected to Database");

        const sqlPath = path.join(__dirname, 'supabase/migrations/20251221_add_last_backup.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log(`📜 Running migration: ${sqlPath}`);
        await client.query(sql);

        console.log("✅ Migration applied successfully!");
    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await client.end();
    }
}

runMigration();
