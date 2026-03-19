const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function applyMigration() {
  try {
    const sqlPath = path.join(__dirname, '04-create-zones-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying migration: 04-create-zones-table.sql...');

    // Try to use exec_sql RPC if it exists
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      if (error.message.includes('function "exec_sql" does not exist')) {
        console.error('The "exec_sql" RPC is not set up in your Supabase instance.');
        console.error('Please manually run the content of scripts/04-create-zones-table.sql in the Supabase SQL Editor.');
      } else {
        console.error('Migration failed:', error.message);
      }
      process.exit(1);
    }

    console.log('Migration applied successfully!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

applyMigration();
