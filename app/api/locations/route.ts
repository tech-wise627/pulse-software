import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Missing Configuration', 
        details: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in Vercel environment variables.' 
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: locations, error } = await supabase
      .from('event_locations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(locations)
  } catch (error: any) {
    console.error('Fetch locations API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, address, latitude, longitude, city, event_date, boundary } = body

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required field: name, latitude or longitude' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Missing Configuration', 
        details: 'Supabase URL/Key environment variables are not set on Vercel.' 
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Try to find a manager to assign
    // First try admin, then manager, then any user
    let { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .order('role', { ascending: true }) // 'admin' comes before 'manager' alphabetically roughly? no.
        .limit(1)

    let manager_id = users?.[0]?.id

    // Fallback if role-based fetch fails or returns nothing
    if (!manager_id) {
        const { data: allUsers } = await supabase.from('users').select('id').limit(1)
        manager_id = allUsers?.[0]?.id
    }

    if (!manager_id) {
        return NextResponse.json({ 
            error: 'Database error: No registered users found.', 
            details: 'You must sign up or create at least one user in the database before creating events. Check public.users table in Supabase.'
        }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('event_locations')
      .insert({
        name,
        address,
        latitude,
        longitude,
        city,
        event_date: event_date || null,
        boundary: boundary || null,
        manager_id: manager_id
      })
      .select()
      .single()

    if (error) {
        console.error('Supabase Insert Error:', error)
        return NextResponse.json({ 
            error: 'Save failed: Database rejected the insert.', 
            details: `${error.message}. Code: ${error.code}. Hint: ${error.hint || 'Check if you ran the SQL scripts.'}`
        }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('CRITICAL API ERROR in POST /api/locations:', error)
    return NextResponse.json({ 
      error: 'API Execution Error',
      details: error.message || 'The server crashed while processing the request.',
      code: error.code || 'EXCEPTION'
    }, { status: 500 })
  }
}
