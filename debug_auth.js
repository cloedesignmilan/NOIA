require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://example.supabase.co';
const supabaseKey = 'public-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Methods on supabase.auth:');
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(supabase.auth)));
console.log('setPersistence exists:', typeof supabase.auth.setPersistence);
