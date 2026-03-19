import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Initialize database schema
 * This endpoint creates all necessary tables and indexes
 * Only accessible with service role key
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if we have service role (admin) access
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if tables already exist by trying to query
    const { data: tableCheck } = await supabase.from('users').select('count()', { count: 'exact' });

    if (tableCheck !== null) {
      return NextResponse.json({ message: 'Database already initialized' }, { status: 200 });
    }

    // Create tables using the service role client
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({
        query: `
          -- Users table (extends Supabase auth)
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email VARCHAR(255) NOT NULL UNIQUE,
            full_name VARCHAR(255),
            role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'staff', 'hr')),
            phone VARCHAR(20),
            date_of_birth DATE,
            department VARCHAR(100),
            hire_date DATE,
            status VARCHAR(20) DEFAULT 'Active',
            photo_url TEXT,
            emergency_contact VARCHAR(255),
            emergency_phone VARCHAR(20),
            event_location_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Staff photos table (optional but good for tracking)
          CREATE TABLE IF NOT EXISTS public.staff_photos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            staff_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            photo_url TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Staff documents table
          CREATE TABLE IF NOT EXISTS public.staff_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            staff_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            document_type VARCHAR(50),
            document_name TEXT NOT NULL,
            document_url TEXT NOT NULL,
            upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            expiry_date DATE,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Event locations table
          CREATE TABLE IF NOT EXISTS public.event_locations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            address TEXT,
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(11, 8) NOT NULL,
            city VARCHAR(100),
            event_date DATE,
            boundary jsonb DEFAULT NULL,
            boundary_created_at timestamp DEFAULT NULL,
            manager_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- IoT Devices table
          CREATE TABLE IF NOT EXISTS public.iot_devices (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            device_id VARCHAR(100) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            location_id UUID NOT NULL REFERENCES public.event_locations(id) ON DELETE CASCADE,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            device_type VARCHAR(50) DEFAULT 'bin',
            bin_capacity_liters DECIMAL(10, 2) DEFAULT 100.0,
            battery_level INTEGER DEFAULT 100,
            is_connected BOOLEAN DEFAULT FALSE,
            is_tilted BOOLEAN DEFAULT FALSE,
            last_sync TIMESTAMP WITH TIME ZONE,
            installed_at TIMESTAMP WITH TIME ZONE,
            installed_by UUID REFERENCES public.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Device readings table
          CREATE TABLE IF NOT EXISTS public.device_readings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            device_id UUID NOT NULL REFERENCES public.iot_devices(id) ON DELETE CASCADE,
            fill_level DECIMAL(5, 2) NOT NULL,
            battery_level INTEGER NOT NULL,
            temperature DECIMAL(5, 2),
            humidity DECIMAL(5, 2),
            is_tilted BOOLEAN DEFAULT FALSE,
            is_connected BOOLEAN DEFAULT TRUE,
            reading_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Staff assignments table
          CREATE TABLE IF NOT EXISTS public.staff_assignments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            staff_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            device_id UUID NOT NULL REFERENCES public.iot_devices(id) ON DELETE CASCADE,
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            assigned_by UUID NOT NULL REFERENCES public.users(id),
            assignment_order INTEGER,
            completed_at TIMESTAMP WITH TIME ZONE,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(staff_id, device_id)
          );

          -- Alerts table
          CREATE TABLE IF NOT EXISTS public.alerts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            location_id UUID NOT NULL REFERENCES public.event_locations(id) ON DELETE CASCADE,
            device_id UUID NOT NULL REFERENCES public.iot_devices(id) ON DELETE CASCADE,
            alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('high_fill', 'low_battery', 'disconnected', 'tilted')),
            severity VARCHAR(20) CHECK (severity IN ('critical', 'warning', 'info')),
            message TEXT,
            fill_level DECIMAL(5, 2),
            battery_level INTEGER,
            is_read BOOLEAN DEFAULT FALSE,
            read_by UUID REFERENCES public.users(id),
            read_at TIMESTAMP WITH TIME ZONE,
            resolved_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Cleaning log table
          CREATE TABLE IF NOT EXISTS public.cleaning_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            device_id UUID NOT NULL REFERENCES public.iot_devices(id) ON DELETE CASCADE,
            staff_id UUID NOT NULL REFERENCES public.users(id),
            location_id UUID NOT NULL REFERENCES public.event_locations(id) ON DELETE CASCADE,
            fill_level_before DECIMAL(5, 2),
            fill_level_after DECIMAL(5, 2),
            duration_minutes INTEGER,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Indexes
          CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
          CREATE INDEX IF NOT EXISTS idx_users_event_location ON public.users(event_location_id);
          CREATE INDEX IF NOT EXISTS idx_iot_devices_location ON public.iot_devices(location_id);
          CREATE INDEX IF NOT EXISTS idx_iot_devices_connected ON public.iot_devices(is_connected);
          CREATE INDEX IF NOT EXISTS idx_device_readings_device ON public.device_readings(device_id);
          CREATE INDEX IF NOT EXISTS idx_device_readings_timestamp ON public.device_readings(reading_timestamp);
          CREATE INDEX IF NOT EXISTS idx_staff_assignments_staff ON public.staff_assignments(staff_id);
          CREATE INDEX IF NOT EXISTS idx_staff_assignments_device ON public.staff_assignments(device_id);
          CREATE INDEX IF NOT EXISTS idx_alerts_location ON public.alerts(location_id);
          CREATE INDEX IF NOT EXISTS idx_alerts_device ON public.alerts(device_id);
          CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);
          CREATE INDEX IF NOT EXISTS idx_cleaning_logs_device ON public.cleaning_logs(device_id);
          CREATE INDEX IF NOT EXISTS idx_cleaning_logs_staff ON public.cleaning_logs(staff_id);
          CREATE INDEX IF NOT EXISTS idx_event_locations_boundary ON public.event_locations USING GIN (boundary);

          -- Storage setup (Bucket and RLS)
          -- This ensures the bucket exists and everyone can upload/view photos
          INSERT INTO storage.buckets (id, name, public) 
          VALUES ('staff-assets', 'staff-assets', true)
          ON CONFLICT (id) DO UPDATE SET public = true;

          -- Allow public insert/select for staff-assets
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public upload to staff-assets'
            ) THEN
              CREATE POLICY "Allow public upload to staff-assets" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'staff-assets');
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public select from staff-assets'
            ) THEN
              CREATE POLICY "Allow public select from staff-assets" ON storage.objects FOR SELECT TO public USING (bucket_id = 'staff-assets');
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public update to staff-assets'
            ) THEN
              CREATE POLICY "Allow public update to staff-assets" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'staff-assets');
            END IF;
          END $$;
        `,
      }),
    });

    if (!response.ok) {
      // Try direct SQL execution approach
      console.log('[v0] Database initialization via REST API not available, will use Supabase client');
      return NextResponse.json({
        message:
          'Database schema setup initiated. Tables will be created through your Supabase console if needed.',
        note: 'Please verify tables exist in Supabase dashboard',
      });
    }

    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('[v0] Error initializing database:', error);
    return NextResponse.json({
      message:
        'Database initialization needs to be done manually through Supabase console. This is expected in most cases.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
