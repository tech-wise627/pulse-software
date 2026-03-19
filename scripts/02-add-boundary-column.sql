-- Add boundary column to event_locations table if it doesn't exist
ALTER TABLE event_locations 
ADD COLUMN IF NOT EXISTS boundary jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS boundary_created_at timestamp DEFAULT NULL;

-- Create index on boundary for better query performance
CREATE INDEX IF NOT EXISTS idx_event_locations_boundary ON event_locations USING GIN (boundary);

-- Add comment for documentation
COMMENT ON COLUMN event_locations.boundary IS 'GeoJSON-like polygon array of [latitude, longitude] coordinates defining event area boundaries';
