import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role and location
    const { data: userData } = await supabase
      .from('users')
      .select('role, event_location_id')
      .eq('id', user.id)
      .single();

    const unreadOnly = request.nextUrl.searchParams.get('unread') === 'true';
    const locationId = request.nextUrl.searchParams.get('location_id');

    let query = supabase
      .from('alerts')
      .select(`
        *,
        device:iot_devices(id, name, device_id, location_id),
        location:event_locations(id, name)
      `)
      .order('created_at', { ascending: false });

    // Filter based on user role
    if (userData?.role === 'manager') {
      if (locationId) {
        query = query.eq('location_id', locationId);
      } else if (userData.event_location_id) {
        query = query.eq('location_id', userData.event_location_id);
      }
    } else if (userData?.role === 'staff') {
      // Staff see alerts for their assigned devices
      const { data: assignments } = await supabase
        .from('staff_assignments')
        .select('device_id')
        .eq('staff_id', user.id);

      const deviceIds = assignments?.map((a) => a.device_id) || [];
      if (deviceIds.length > 0) {
        query = query.in('device_id', deviceIds);
      }
    }

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: alerts, error: alertsError } = await query;

    if (alertsError) {
      return NextResponse.json({ error: alertsError.message }, { status: 500 });
    }

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('[v0] Error in GET /api/alerts:', error);
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
    const { alert_id, is_read, resolved } = body;

    if (!alert_id) {
      return NextResponse.json({ error: 'Missing alert_id' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (is_read !== undefined) {
      updates.is_read = is_read;
      if (is_read) {
        updates.read_by = user.id;
        updates.read_at = new Date().toISOString();
      }
    }

    if (resolved) {
      updates.resolved_at = new Date().toISOString();
    }

    const { data: alert, error: updateError } = await supabase
      .from('alerts')
      .update(updates)
      .eq('id', alert_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error('[v0] Error in PATCH /api/alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
