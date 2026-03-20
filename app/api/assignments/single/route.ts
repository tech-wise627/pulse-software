import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const device_id = request.nextUrl.searchParams.get('device_id');
    if (!device_id) {
      return NextResponse.json({ error: 'Missing device_id parameter' }, { status: 400 });
    }

    console.log(`[Diagnostic] GET request received for device_id: ${device_id}`);
    
    // Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log(`[Diagnostic] Env Check - URL: ${hasUrl}, ServiceKey: ${hasServiceKey}, AnonKey: ${hasAnonKey}`);

    if (!hasUrl) {
      return NextResponse.json({ error: 'System configuration error: NEXT_PUBLIC_SUPABASE_URL is missing' }, { status: 500 });
    }

    let client;
    try {
      if (hasServiceKey) {
        client = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        console.log(`[Diagnostic] Using Service Role Client`);
      } else {
        client = await createClient();
        console.log(`[Diagnostic] Falling back to standard Server Client`);
      }
    } catch (clientErr: any) {
      console.error('[Diagnostic] Client creation failed:', clientErr);
      return NextResponse.json({ 
        error: `Supabase client initialization failed: ${clientErr.message}`,
        diagnostics: { hasUrl, hasServiceKey, hasAnonKey }
      }, { status: 500 });
    }

    // Diagnostic query: find ANY assignments to see if the table is even working
    const { count, error: countError } = await client.from('staff_assignments').select('*', { count: 'exact', head: true });
    if (countError) {
      console.error('[Diagnostic] Count query failed:', countError);
      return NextResponse.json({ error: `Database access failed: ${countError.message}`, code: countError.code }, { status: 500 });
    }
    console.log(`[Diagnostic] Total assignments in table: ${count}`);

    const { data, error } = await client
      .from('staff_assignments')
      .select('*, staff:users!staff_id(id, full_name, role)')
      .eq('device_id', device_id)
      .order('assigned_at', { ascending: false });

    console.log(`[Diagnostic] Query result:`, data ? `${data.length} rows` : 'error');

    if (error) {
      console.error('[Diagnostic] Select error:', error);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    const assignment = data && data.length > 0 ? data[0] : null;
    return NextResponse.json({ 
      assignment,
      diagnostics: { count, device_id, env: { hasUrl, hasServiceKey } }
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
