
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function getStartDateForRange(range) {
    const now = new Date(); // Simulating "Now"
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    console.log(`\n--- Range: ${range} ---`);
    console.log(`Current Time (Simulated): ${now.toISOString()}`);

    switch (range) {
        case 'month':
            start.setDate(1);
            console.log(`Logic: setDate(1) -> ${start.toISOString()}`);
            break;
        case 'quarter':
            const currentMonth = now.getMonth();
            const startMonth = Math.floor(currentMonth / 3) * 3;
            start.setMonth(startMonth, 1);
            console.log(`Logic: Month ${currentMonth} -> Start Month ${startMonth} -> ${start.toISOString()}`);
            break;
        case 'year':
            start.setMonth(0, 1);
            console.log(`Logic: setMonth(0, 1) -> ${start.toISOString()}`);
            break;
        case 'all':
            start.setFullYear(2000, 0, 1);
            console.log(`Logic: setYear(2000) -> ${start.toISOString()}`);
            break;
    }
    return start;
}

async function debugFilters() {
    console.log("Fetching recent transactions...");
    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('id, date, amount, description')
        .order('date', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Fetched ${transactions.length} transactions.`);

    const ranges = ['month', 'quarter', 'year', 'all'];

    for (const range of ranges) {
        const startDate = getStartDateForRange(range);

        let count = 0;
        let example = null;

        for (const t of transactions) {
            // Simulate Frontend Logic: new Date(t.date)
            // t.date is string YYYY-MM-DD
            const tDate = new Date(t.date);

            const isIncluded = tDate >= startDate;

            if (isIncluded) {
                count++;
                if (!example) example = `${t.date} (${t.description})`;
            }
        }

        console.log(`[${range.toUpperCase()}] Start Date: ${startDate.toDateString()} (${startDate.toISOString()})`);
        console.log(`   -> Matches in top 20: ${count}`);
        if (example) console.log(`   -> First match: ${example}`);
        else console.log(`   -> No matches in recent items.`);
    }
}

debugFilters();
