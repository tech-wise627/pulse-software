import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLS() {
  console.log("Fixing RLS policies for staff_assignments...");
  
  const sql = `
    -- Drop existing restrictive policies
    DROP POLICY IF EXISTS "Only managers can manage assignments" ON staff_assignments;
    DROP POLICY IF EXISTS "Only managers can update assignments" ON staff_assignments;
    DROP POLICY IF EXISTS "Managers can view assignments in their location" ON staff_assignments;
    DROP POLICY IF EXISTS "Staff can view own assignments" ON staff_assignments;
    DROP POLICY IF EXISTS "Users can view relevant assignments" ON staff_assignments;
    DROP POLICY IF EXISTS "Admins and managers can manage assignments" ON staff_assignments;

    -- Create robust, inclusive policies
    -- 1. Full access for admins and managers
    CREATE POLICY "Admins and managers can manage assignments" ON staff_assignments
      FOR ALL
      TO authenticated
      USING (
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
      )
      WITH CHECK (
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
      );

    -- 2. Staff can view their own assignments
    CREATE POLICY "Staff can view own assignments" ON staff_assignments
      FOR SELECT
      TO authenticated
      USING (staff_id = auth.uid());
      
    -- 3. Anonymous READ access (Temporarily helpful for testing until Auth is enforced everywhere)
    CREATE POLICY "Anonymous read access" ON staff_assignments
      FOR SELECT
      TO anon, authenticated
      USING (true);
  `;

  // We try to run this via rpc if available. If not, this is our limitation in CLI.
  const { error } = await supabase.rpc('run_migration', { sql });
  
  if (error) {
    if (error.message.includes('function public.run_migration(text) does not exist')) {
       console.error("FATAL: Database does not allow remote SQL execution via migration RPC.");
       console.log("Please run this SQL in your Supabase SQL Editor manually:");
       console.log(sql);
    } else {
       console.error("MIGRATION ERROR:", error.message);
    }
  } else {
    console.log("SUCCESS: RLS policies updated successfully!");
  }
}

fixRLS();
