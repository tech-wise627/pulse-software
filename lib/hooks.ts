import useSWR from 'swr';
import { IoTDevice, Alert, StaffAssignment, EventLocation } from './types';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('Failed to fetch');
    const data = await res.json().catch(() => ({}));
    (error as any).status = res.status;
    (error as any).message = data?.error || data?.message || 'Failed to fetch';
    throw error;
  }
  return res.json();
};

export function useDevices(locationId?: string) {
  const url = locationId ? `/api/devices?location_id=${locationId}` : '/api/devices';
  const { data, error, isLoading, mutate } = useSWR<IoTDevice[]>(url, fetcher);

  return {
    devices: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useAlerts(locationId?: string, unreadOnly = false) {
  const params = new URLSearchParams();
  if (locationId) params.append('location_id', locationId);
  if (unreadOnly) params.append('unread', 'true');

  const url = `/api/alerts${params.toString() ? '?' + params.toString() : ''}`;
  const { data, error, isLoading, mutate } = useSWR<Alert[]>(url, fetcher);

  return {
    alerts: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useAssignments(staffId?: string) {
  const url = staffId ? `/api/assignments?staff_id=${staffId}` : '/api/assignments';
  const { data, error, isLoading, mutate } = useSWR<StaffAssignment[]>(url, fetcher);

  return {
    assignments: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useLocations() {
  const { data, error, isLoading, mutate } = useSWR<EventLocation[]>('/api/locations', fetcher);

  return {
    locations: data || [],
    isLoading,
    error,
    mutate,
  };
}

export async function markAlertAsRead(alertId: string) {
  const res = await fetch('/api/alerts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alert_id: alertId, is_read: true }),
  });
  if (!res.ok) throw new Error('Failed to mark alert as read');
  return res.json();
}

export async function resolveAlert(alertId: string) {
  const res = await fetch('/api/alerts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alert_id: alertId, resolved: true }),
  });
  if (!res.ok) throw new Error('Failed to resolve alert');
  return res.json();
}

export async function completeAssignment(assignmentId: string) {
  const res = await fetch('/api/assignments', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignment_id: assignmentId, completed: true }),
  });
  if (!res.ok) throw new Error('Failed to complete assignment');
  return res.json();
}

export async function createDevice(data: {
  device_id: string;
  name: string;
  location_id: string;
  latitude: number;
  longitude: number;
  device_type?: string;
  bin_capacity_liters?: number;
}) {
  const res = await fetch('/api/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create device');
  return res.json();
}

export async function assignDevicesToStaff(staffId: string, deviceIds: string[]) {
  const res = await fetch('/api/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      staff_id: staffId,
      device_ids: deviceIds,
    }),
  });
  if (!res.ok) throw new Error('Failed to assign devices');
  return res.json();
}
