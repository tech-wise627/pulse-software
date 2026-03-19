import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');
    
    const supabase = await createClient();
    
    let query = supabase.from('zones').select('*');
    
    if (locationId) {
      query = query.eq('location_id', locationId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: true });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { name, color, boundary, location_id } = body;
    
    // Get user for logging
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[v0] Zone creation attempt:', {
      userId: user?.id,
      email: user?.email,
      locationId: location_id,
      zoneName: name
    });
    
    if (!name || !color || !boundary || !location_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('zones')
      .insert([
        { 
          name, 
          color, 
          boundary, 
          location_id 
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('[v0] Zone creation error:', error);
      if (error.message.includes('row-level security policy')) {
        return NextResponse.json({ 
          error: `RLS Policy Violation`, 
          message: error.message,
          debug: { 
            userId: user?.id, 
            email: user?.email,
            locationId: location_id
          }
        }, { status: 403 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
