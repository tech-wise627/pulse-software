-- Create zones table
CREATE TABLE IF NOT EXISTS public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  color VARCHAR(50) NOT NULL,
  boundary JSONB NOT NULL, -- Array of [latitude, longitude] coordinates
  location_id UUID NOT NULL REFERENCES public.event_locations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance when filtering by location
CREATE INDEX IF NOT EXISTS idx_zones_location ON public.zones(location_id);

-- Add comment for documentation
COMMENT ON TABLE public.zones IS 'Operational zones within event locations';
COMMENT ON COLUMN public.zones.boundary IS 'Array of [latitude, longitude] coordinates forming the zone polygon';

-- Enable RLS
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

-- Zones RLS Policies
-- Drop existing policies to replace them
DROP POLICY IF EXISTS "Users can view zones in their location" ON public.zones;
DROP POLICY IF EXISTS "Managers can insert zones for their locations" ON public.zones;
DROP POLICY IF EXISTS "Managers can update zones for their locations" ON public.zones;
DROP POLICY IF EXISTS "Managers can delete zones for their locations" ON public.zones;

-- 1. VIEW POLICY: Everyone in the location (Admin, Manager, Staff) can view zones
CREATE POLICY "Users can view zones in their location" ON public.zones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND (
        u.role = 'admin' 
        OR u.event_location_id = location_id
        OR EXISTS (SELECT 1 FROM event_locations el WHERE el.id = location_id AND el.manager_id = auth.uid())
      )
    )
  );

-- 2. MANAGE POLICY: Only Admins and the specific Event Manager can manage zones
CREATE POLICY "Managers and admins can manage zones" ON public.zones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM event_locations el 
      WHERE el.id = location_id AND el.manager_id = auth.uid()
    )
  );

