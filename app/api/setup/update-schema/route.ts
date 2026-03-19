import { NextRequest, NextResponse } from 'next/server';

/**
 * Update database schema
 * This endpoint adds missing columns and indexes to existing tables
 * Only accessible with service role key
 */
export async function POST(request: NextRequest) {
  try {
    // Check for authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run schema updates using the service role credentials from environment
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({
        query: `
          -- Add boundary column to event_locations table if it doesn't exist
          ALTER TABLE event_locations 
          ADD COLUMN IF NOT EXISTS boundary jsonb DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS boundary_created_at timestamp DEFAULT NULL;

          -- Create index on boundary for better query performance
          CREATE INDEX IF NOT EXISTS idx_event_locations_boundary ON event_locations USING GIN (boundary);

          -- Add comment for documentation
          COMMENT ON COLUMN event_locations.boundary IS 'GeoJSON-like polygon array of [latitude, longitude] coordinates defining event area boundaries';
        `,
      }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Schema update failed:', errorData);
        return NextResponse.json({ 
            message: 'Schema update failed. You may need to run the SQL manually in Supabase SQL Editor.',
            details: errorData.message || response.statusText 
        }, { status: response.status });
    }

    return NextResponse.json({ message: 'Schema updated successfully' });
  } catch (error) {
    console.error('Error updating schema:', error);
    return NextResponse.json({
      message: 'Error updating schema',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
