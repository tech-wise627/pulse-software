import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status } = await request.json()
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey)

    const { data, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', id)
      .select()

    if (error) throw error
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Permission denied or user not found' }, { status: 403 })
    }

    return NextResponse.json({ success: true, message: 'Status updated successfully' })
  } catch (error: any) {
    console.error('Update status API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
