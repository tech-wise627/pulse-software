import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const device_id = request.nextUrl.searchParams.get('device_id');
    if (!device_id) {
      return NextResponse.json({ error: 'Missing device_id parameter' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const client = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : await createClient();

    // Step 1: Fetch the assignment record
    const { data: assignmentData, error: assignmentError } = await client
      .from('staff_assignments')
      .select('*')
      .eq('device_id', device_id)
      .order('assigned_at', { ascending: false })
      .limit(1);

    if (assignmentError) {
      console.error('Assignment fetch error:', assignmentError);
      return NextResponse.json({ error: assignmentError.message }, { status: 500 });
    }

    if (!assignmentData || assignmentData.length === 0) {
      return NextResponse.json({ assignment: null });
    }

    const assignment = assignmentData[0];

    // Step 2: Fetch the staff details separately to avoid PGRST200 join issues
    const { data: staffData, error: staffError } = await client
      .from('users')
      .select('id, full_name, role')
      .eq('id', assignment.staff_id)
      .single();

    if (staffError) {
      console.error('Staff fetch error:', staffError);
      // Even if staff details fail, return the assignment ID at least
      return NextResponse.json({ 
        assignment: { ...assignment, staff: { id: assignment.staff_id, full_name: 'Unknown Staff' } } 
      });
    }

    return NextResponse.json({ 
      assignment: { ...assignment, staff: staffData } 
    });
  } catch (error: any) {
    console.error('Error fetching single assignment:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    let { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { device_id, staff_id, action } = body;

    if (!device_id || !staff_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("Missing SUPABASE_SERVICE_ROLE_KEY, falling back to authenticated user client which may fail due to strict RLS.");
    }
    
    // Use service role to completely bypass restrictive RLS policies for assignment ops
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let assignerId = user?.id;

    if (!assignerId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Fallback for local testing without an active session
      const { data: fallbackUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .in('role', ['admin', 'manager'])
        .limit(1)
        .single();
      
      if (fallbackUser) assignerId = fallbackUser.id;
    }

    if (!assignerId) {
      return NextResponse.json({ error: 'Unauthorized: Please ensure you are logged in.' }, { status: 401 });
    }
    
    // Choose client depending on whether service role key is available
    const client = process.env.SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;

    if (action === 'assign') {
      // First, delete any existing assignments for this device
      await client
        .from('staff_assignments')
        .delete()
        .eq('device_id', device_id);

      // Then insert the new assignment explicitly
      const { data, error } = await client
        .from('staff_assignments')
        .insert({
          staff_id,
          device_id,
          assigned_by: assignerId,
        })
        .select();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      
      // CRITICAL FIX: Supabase returns 201 with an empty array `[]` if RLS silently blocks the insert when using `.select()`.
      if (!data || data.length === 0) {
        throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY on Vercel. Database security rules rejected the assignment silently.");
      }

      return NextResponse.json(data[0], { status: 201 });
    } else if (action === 'unassign') {
      const { error } = await client
        .from('staff_assignments')
        .delete()
        .match({ staff_id, device_id });

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in single assignment API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
