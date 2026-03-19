export type UserRole = 'admin' | 'manager' | 'staff' | 'hr';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  event_location_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventLocation {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  city: string | null;
  event_date: string | null;
  manager_id: string;
  boundary?: Array<[number, number]>; // Array of [lat, lng] coordinates forming the polygon
  boundary_created_at?: string;
  created_at: string;
  updated_at: string;
}

export interface IoTDevice {
  id: string;
  device_id: string;
  name: string;
  location_id: string;
  latitude: number | null;
  longitude: number | null;
  device_type: string;
  bin_capacity_liters: number;
  battery_level: number;
  fill_level?: number;
  is_connected: boolean;
  is_tilted: boolean;
  last_sync: string | null;
  installed_at: string | null;
  installed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceReading {
  id: string;
  device_id: string;
  fill_level: number;
  battery_level: number;
  temperature: number | null;
  humidity: number | null;
  is_tilted: boolean;
  is_connected: boolean;
  reading_timestamp: string;
  created_at: string;
}

export interface StaffAssignment {
  id: string;
  staff_id: string;
  device_id: string;
  assigned_at: string;
  assigned_by: string;
  assignment_order: number | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  location_id: string;
  device_id: string;
  alert_type: 'high_fill' | 'low_battery' | 'disconnected' | 'tilted';
  severity: 'critical' | 'warning' | 'info';
  message: string | null;
  fill_level: number | null;
  battery_level: number | null;
  is_read: boolean;
  read_by: string | null;
  read_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CleaningLog {
  id: string;
  device_id: string;
  staff_id: string;
  location_id: string;
  fill_level_before: number | null;
  fill_level_after: number | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
}

// HR Staff Management Types
export type StaffStatus = 'Active' | 'Inactive' | 'Suspended';
export type StaffRole = 'Sanitation Worker' | 'Supervisor' | 'Team Lead' | 'Manager';

export interface HRStaff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  role: StaffRole;
  department: string;
  status: StaffStatus;
  hire_date: string;
  photo_url: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffDocument {
  id: string;
  staff_id: string;
  document_type: 'ID Proof' | 'Address Proof' | 'Contract' | 'Training Certificate' | 'Medical' | 'Other';
  document_name: string;
  document_url: string;
  upload_date: string;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  boundary: Array<[number, number]>;
  location_id: string;
  created_at?: string;
  updated_at?: string;
}
