import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      device_id,
      fill_level,
      battery_level,
      temperature,
      humidity,
      is_tilted,
      is_connected,
    } = body;

    if (!device_id || fill_level === undefined || battery_level === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get device info
    const { data: device, error: deviceError } = await supabase
      .from('iot_devices')
      .select('id, location_id, battery_level, is_tilted, is_connected')
      .eq('device_id', device_id)
      .single();

    if (deviceError || !device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Insert reading
    const { data: reading, error: readingError } = await supabase
      .from('device_readings')
      .insert({
        device_id: device.id,
        fill_level,
        battery_level,
        temperature,
        humidity,
        is_tilted: is_tilted || false,
        is_connected: is_connected !== false,
        reading_timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (readingError) {
      return NextResponse.json({ error: readingError.message }, { status: 500 });
    }

    // Update device status
    await supabase
      .from('iot_devices')
      .update({
        battery_level,
        is_tilted: is_tilted || false,
        is_connected: is_connected !== false,
        last_sync: new Date().toISOString(),
      })
      .eq('id', device.id);

    // Check for alerts
    const alerts: Array<{ type: string; severity: string; message: string }> = [];

    if (fill_level > 80) {
      alerts.push({
        type: 'high_fill',
        severity: 'critical',
        message: `Bin is ${fill_level.toFixed(1)}% full`,
      });
    }

    if (battery_level < 20) {
      alerts.push({
        type: 'low_battery',
        severity: 'warning',
        message: `Battery level is ${battery_level}%`,
      });
    }

    if (is_tilted && !device.is_tilted) {
      alerts.push({
        type: 'tilted',
        severity: 'warning',
        message: 'Bin is tilted',
      });
    }

    if (!is_connected && device.is_connected) {
      alerts.push({
        type: 'disconnected',
        severity: 'critical',
        message: 'Device is disconnected',
      });
    }

    // Create alerts
    for (const alert of alerts) {
      // Check if alert already exists and not resolved
      const { data: existingAlert } = await supabase
        .from('alerts')
        .select('id')
        .eq('device_id', device.id)
        .eq('alert_type', alert.type)
        .is('resolved_at', null)
        .single();

      if (!existingAlert) {
        await supabase.from('alerts').insert({
          location_id: device.location_id,
          device_id: device.id,
          alert_type: alert.type,
          severity: alert.severity,
          message: alert.message,
          fill_level: alert.type === 'high_fill' ? fill_level : null,
          battery_level: alert.type === 'low_battery' ? battery_level : null,
        });
      }
    }

    return NextResponse.json(reading, { status: 201 });
  } catch (error) {
    console.error('[v0] Error in POST /api/devices/readings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
