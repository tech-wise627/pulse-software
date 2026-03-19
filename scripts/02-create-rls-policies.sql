-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;

-- Users RLS Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can view all users (for management and directory)
CREATE POLICY "Anyone authenticated can view user profiles" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Managers, HR and Admins can update users
CREATE POLICY "Admins, HR and Managers can update users" ON users
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'hr', 'manager')
  );

-- Admins, HR and Managers can delete users
CREATE POLICY "Admins, HR and Managers can delete users" ON users
  FOR DELETE USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'hr', 'manager')
  );

-- Event Locations RLS Policies
-- Users can view locations they manage or are assigned to
CREATE POLICY "Users can view their event locations" ON event_locations
  FOR SELECT USING (
    manager_id = auth.uid()
    OR id IN (SELECT event_location_id FROM users WHERE id = auth.uid() AND event_location_id IS NOT NULL)
  );

-- Only managers can insert/update/delete locations
CREATE POLICY "Only managers can manage locations" ON event_locations
  FOR ALL USING (manager_id = auth.uid());

-- IoT Devices RLS Policies
-- Users can view devices in their location
CREATE POLICY "Users can view devices in their location" ON iot_devices
  FOR SELECT USING (
    location_id IN (
      SELECT id FROM event_locations WHERE manager_id = auth.uid()
      OR id = (SELECT event_location_id FROM users WHERE id = auth.uid())
    )
  );

-- Managers can manage devices
CREATE POLICY "Managers can manage devices" ON iot_devices
  FOR ALL USING (
    location_id IN (SELECT id FROM event_locations WHERE manager_id = auth.uid())
  );

-- Device Readings RLS Policies
-- Users can view readings for devices they can access
CREATE POLICY "Users can view device readings" ON device_readings
  FOR SELECT USING (
    device_id IN (
      SELECT id FROM iot_devices WHERE location_id IN (
        SELECT id FROM event_locations WHERE manager_id = auth.uid()
        OR id = (SELECT event_location_id FROM users WHERE id = auth.uid())
      )
    )
  );

-- Only service role can insert readings (from IoT devices)
CREATE POLICY "Service role can insert readings" ON device_readings
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Staff Assignments RLS Policies
-- Managers can view all assignments in their location
CREATE POLICY "Managers can view assignments in their location" ON staff_assignments
  FOR SELECT USING (
    assigned_by IN (SELECT id FROM users WHERE role = 'manager' AND id = auth.uid())
    OR staff_id = auth.uid()
  );

-- Staff can view their own assignments
CREATE POLICY "Staff can view own assignments" ON staff_assignments
  FOR SELECT USING (staff_id = auth.uid());

-- Only managers can create/update assignments
CREATE POLICY "Only managers can manage assignments" ON staff_assignments
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'manager'
    AND assigned_by = auth.uid()
  );

CREATE POLICY "Only managers can update assignments" ON staff_assignments
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'manager'
    AND assigned_by = auth.uid()
  );

-- Alerts RLS Policies
-- Managers can view alerts in their locations
CREATE POLICY "Managers can view location alerts" ON alerts
  FOR SELECT USING (
    location_id IN (SELECT id FROM event_locations WHERE manager_id = auth.uid())
  );

-- Staff can view alerts for their assigned devices
CREATE POLICY "Staff can view assigned device alerts" ON alerts
  FOR SELECT USING (
    device_id IN (
      SELECT device_id FROM staff_assignments WHERE staff_id = auth.uid()
    )
  );

-- Managers can update alerts
CREATE POLICY "Managers can update alerts" ON alerts
  FOR UPDATE USING (
    location_id IN (SELECT id FROM event_locations WHERE manager_id = auth.uid())
  );

-- Cleaning Logs RLS Policies
-- Users can view cleaning logs
CREATE POLICY "Users can view cleaning logs" ON cleaning_logs
  FOR SELECT USING (
    location_id IN (
      SELECT id FROM event_locations WHERE manager_id = auth.uid()
      OR id = (SELECT event_location_id FROM users WHERE id = auth.uid())
    )
  );

-- Staff and managers can create cleaning logs
CREATE POLICY "Staff can create cleaning logs" ON cleaning_logs
  FOR INSERT WITH CHECK (
    staff_id = auth.uid()
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'manager'
  );

-- Staff Photos RLS
CREATE POLICY "Anyone authenticated can view staff photos" ON staff_photos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and HR can manage staff photos" ON staff_photos
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'hr', 'manager')
  );

-- Staff Documents RLS
CREATE POLICY "Staff can view own documents" ON staff_documents
  FOR SELECT USING (staff_id = auth.uid());

CREATE POLICY "Managers and HR can view all documents" ON staff_documents
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'hr', 'manager')
  );

CREATE POLICY "Managers and HR can manage staff documents" ON staff_documents
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'hr', 'manager')
  );
