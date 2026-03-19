import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const locationId = request.nextUrl.searchParams.get('location_id');

    let query = supabase
      .from('iot_devices')
      .select(`
        *,
        location:event_locations(id, name, latitude, longitude),
        latest_reading:device_readings(fill_level, battery_level, is_tilted, is_connected, reading_timestamp)
      `)
      .order('created_at', { ascending: false });

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data: devices, error: devicesError } = await query;

    if (devicesError) {
      console.error('[v0] Error fetching devices:', devicesError);
      return NextResponse.json({ error: devicesError.message }, { status: 500 });
    }

    return NextResponse.json(devices);
  } catch (error: any) {
    console.error('[v0] Error in GET /api/devices:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: 'Please log in again.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      device_id,
      name,
      location_id,
      latitude,
      longitude,
      device_type = 'bin',
      bin_capacity_liters = 100,
    } = body;

    if (!device_id || !name || !location_id) {
      return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400 });
    }

    const { data: device, error: deviceError } = await supabase
      .from('iot_devices')
      .insert({
        device_id,
        name,
        location_id,
        latitude,
        longitude,
        device_type,
        bin_capacity_liters,
        installed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (deviceError) {
      console.error('[v0] Device creation error:', deviceError);
      return NextResponse.json({ 
        error: 'Database Error', 
        details: deviceError.message 
      }, { status: 500 });
    }

    return NextResponse.json(device, { status: 201 });
  } catch (error: any) {
    console.error('[v0] Error in POST /api/devices:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}
