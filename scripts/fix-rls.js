const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local since dotenv is missing
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error(".env.local not found at", envPath);
    process.exit(1);
  }
  
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local");
  console.log("Current env keys:", Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLS() {
  console.log("Fixing RLS policies for staff_assignments on:", supabaseUrl);
  
  const sql = `
    -- Enable RLS
    ALTER TABLE IF EXISTS staff_assignments ENABLE ROW LEVEL SECURITY;

    -- Drop existing restrictive policies
    DROP POLICY IF EXISTS "Only managers can manage assignments" ON staff_assignments;
    DROP POLICY IF EXISTS "Only managers can update assignments" ON staff_assignments;
    DROP POLICY IF EXISTS "Managers can view assignments in their location" ON staff_assignments;
    DROP POLICY IF EXISTS "Staff can view own assignments" ON staff_assignments;
    DROP POLICY IF EXISTS "Users can view relevant assignments" ON staff_assignments;
    DROP POLICY IF EXISTS "Admins and managers can manage assignments" ON staff_assignments;
    DROP POLICY IF EXISTS "Anonymous read access" ON staff_assignments;

    -- Create robust, inclusive policies
    -- 1. Full access for admins and managers
    -- Simple check to avoid complexity in sub-queries if possible, but role-based is best.
    CREATE POLICY "Admins and managers can manage assignments" ON staff_assignments
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role IN ('admin', 'manager')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.role IN ('admin', 'manager')
        )
      );

    -- 2. Staff can view their own assignments
    CREATE POLICY "Staff can view own assignments" ON staff_assignments
      FOR SELECT
      TO authenticated
      USING (staff_id = auth.uid());
      
    -- 3. Anonymous READ access
    -- CRITICAL: This is what allows 'reload' to work without being logged in.
    CREATE POLICY "Anonymous read access" ON staff_assignments
      FOR SELECT
      TO anon, authenticated
      USING (true);
  `;

  // Try to use a known RPC if it exists.
  // Given the previous failure, we will also simply log the SQL as a backup.
  const { data, error } = await supabase.rpc('run_migration', { sql });
  
  if (error) {
    console.error("RPC Error:", error.message);
    console.log("\n--------------------------------------------------");
    console.log("PLEASE RUN THE FOLLOWING SQL IN YOUR SUPABASE SQL EDITOR MANUALLY:");
    console.log(sql);
    console.log("--------------------------------------------------\n");
  } else {
    console.log("SUCCESS: RLS policies updated successfully!");
  }
}

fixRLS();
