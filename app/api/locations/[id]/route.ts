import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: Request,
  { params }: { params: any }
) {
  try {
    // Support both promise and sync params (depends on Next.js version)
    const resolvedParams = params instanceof Promise ? await params : params
    const id = resolvedParams?.id
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Missing location ID' 
      }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Log for debugging
    console.log(`[DELETE /api/locations/${id}] Attempting deletion...`)

    // Attempt to use service role if available for full admin bypass
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const adminSupabase = serviceRoleKey 
      ? (await import('@supabase/supabase-js')).createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
      : null

    const client = adminSupabase || supabase

    if (!serviceRoleKey) {
      console.warn(`[DELETE /api/locations/${id}] SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to session-based client. This may fail due to RLS if you are an admin not explicitly assigned as this event's manager.`)
    }

    // 1. Delete filtering/metadata tables
    await client
      .from('alerts')
      .delete()
      .eq('location_id', id)

    await client
      .from('cleaning_logs')
      .delete()
      .eq('location_id', id)

    // 2. Delete related devices and their dependencies
    const { data: devices } = await client
      .from('iot_devices')
      .select('id')
      .eq('location_id', id)
    
    if (devices && devices.length > 0) {
      const deviceIds = devices.map(d => d.id)
      
      // Delete readings for these devices
      await client
        .from('device_readings')
        .delete()
        .in('device_id', deviceIds)
        
      // Delete assignments for these devices
      await client
        .from('staff_assignments')
        .delete()
        .in('device_id', deviceIds)

      // Finally delete the devices
      await client
        .from('iot_devices')
        .delete()
        .in('id', deviceIds)
    }

    // 3. Delete the location itself
    const { data, error, count } = await client
      .from('event_locations')
      .delete({ count: 'exact' })
      .eq('id', id)
      .select()

    if (error) throw error

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        error: 'Deletion failed', 
        details: 'The event location was not found or could not be deleted. Check if it still has active references or if you have the correct permissions.' 
      }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Location and all related data deleted successfully' })
  } catch (error: any) {
    console.error('Delete location API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
