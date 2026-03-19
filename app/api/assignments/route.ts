import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role, event_location_id')
      .eq('id', user.id)
      .single();

    const staffId = request.nextUrl.searchParams.get('staff_id');

    let query = supabase
      .from('staff_assignments')
      .select(`
        *,
        staff:users!staff_id(id, full_name, email),
        device:iot_devices(id, name, device_id, latitude, longitude, battery_level, is_connected, is_tilted),
        assignedBy:users!assigned_by(id, full_name)
      `)
      .order('assignment_order', { ascending: true });

    if (staffId) {
      query = query.eq('staff_id', staffId);
    } else if (userData?.role === 'staff') {
      // Staff can only see their own assignments
      query = query.eq('staff_id', user.id);
    } else if (userData?.role === 'manager') {
      // Manager can see assignments for their location
      const { data: usersInLocation } = await supabase
        .from('users')
        .select('id')
        .eq('event_location_id', userData.event_location_id);

      const userIds = usersInLocation?.map((u) => u.id) || [];
      if (userIds.length > 0) {
        query = query.in('staff_id', userIds);
      }
    }

    const { data: assignments, error: assignmentsError } = await query;

    if (assignmentsError) {
      return NextResponse.json({ error: assignmentsError.message }, { status: 500 });
    }

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('[v0] Error in GET /api/assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is manager
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can create assignments' }, { status: 403 });
    }

    const body = await request.json();
    const { staff_id, device_ids, assignment_orders } = body;

    if (!staff_id || !Array.isArray(device_ids) || device_ids.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Delete existing assignments for this staff
    await supabase.from('staff_assignments').delete().eq('staff_id', staff_id);

    // Create new assignments
    const assignments = device_ids.map((device_id: string, index: number) => ({
      staff_id,
      device_id,
      assigned_by: user.id,
      assignment_order: assignment_orders?.[index] || index + 1,
    }));

    const { data: createdAssignments, error: createError } = await supabase
      .from('staff_assignments')
      .insert(assignments)
      .select();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json(createdAssignments, { status: 201 });
  } catch (error) {
    console.error('[v0] Error in POST /api/assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assignment_id, completed } = body;

    if (!assignment_id) {
      return NextResponse.json({ error: 'Missing assignment_id' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (completed) {
      updates.completed_at = new Date().toISOString();
    } else {
      updates.completed_at = null;
    }

    const { data: assignment, error: updateError } = await supabase
      .from('staff_assignments')
      .update(updates)
      .eq('id', assignment_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('[v0] Error in PATCH /api/assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
