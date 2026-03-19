import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Missing Configuration', 
        details: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in Vercel environment variables.' 
      }, { status: 400 })
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log(`[v0] Fetch individual staff ID: ${id}. Service Role: ${serviceRoleKey ? 'YES' : 'NO'}`)
    const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey)

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !user) {
      console.log(`[v0] Staff not found or error: ${id}. Error:`, error)
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Fallback: Check staff_photos table if photo_url is missing
    let photoUrl = user.photo_url
    if (!photoUrl) {
      const { data: photoData } = await supabase
        .from('staff_photos')
        .select('photo_url')
        .eq('staff_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (photoData) {
        photoUrl = photoData.photo_url
      }
    }

    const nameParts = (user.full_name || 'Unknown').split(' ')
    const formattedStaff = {
      id: user.id,
      first_name: user.first_name || nameParts[0],
      last_name: user.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''),
      email: user.email || '',
      phone: user.phone || '',
      date_of_birth: user.date_of_birth || '1990-01-01',
      role: user.role === 'manager' ? 'Supervisor' : user.role === 'hr' ? 'Manager' : 'Sanitation Worker',
      department: user.department || 'Operations',
      hire_date: user.hire_date || user.created_at || new Date().toISOString(),
      status: user.status || 'Active',
      emergency_contact: user.emergency_contact || 'None',
      emergency_phone: user.emergency_phone || 'None',
      photo_url: photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'S')}&background=random&color=fff`,
      created_at: user.created_at,
      updated_at: user.updated_at
    }

    return NextResponse.json(formattedStaff)
  } catch (error: any) {
    console.error('Fetch individual staff API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .select()

    if (error) throw error
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'User not found or deletion failed' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Staff member deleted' })
  } catch (error: any) {
    console.error('Delete staff API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
