import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook for real-time device updates
 * Subscribes to changes in iot_devices table
 */
export function useRealtimeDevices(locationId?: string) {
  const supabase = createClient();
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  const subscribe = useCallback(
    (callback: (event: any) => void) => {
      if (!locationId) return;

      const subscription = supabase
        .channel(`devices:${locationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'iot_devices',
            filter: `location_id=eq.${locationId}`,
          },
          callback
        )
        .subscribe();

      setUnsubscribe(() => {
        supabase.removeChannel(subscription);
      });

      return subscription;
    },
    [supabase, locationId]
  );

  useEffect(() => {
    return () => {
      unsubscribe?.();
    };
  }, [unsubscribe]);

  return { subscribe };
}

/**
 * Hook for real-time alert updates
 * Subscribes to new alerts
 */
export function useRealtimeAlerts(locationId?: string) {
  const supabase = createClient();
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  const subscribe = useCallback(
    (callback: (event: any) => void) => {
      if (!locationId) return;

      const subscription = supabase
        .channel(`alerts:${locationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'alerts',
            filter: `location_id=eq.${locationId}`,
          },
          callback
        )
        .subscribe();

      setUnsubscribe(() => {
        supabase.removeChannel(subscription);
      });

      return subscription;
    },
    [supabase, locationId]
  );

  useEffect(() => {
    return () => {
      unsubscribe?.();
    };
  }, [unsubscribe]);

  return { subscribe };
}

/**
 * Hook for real-time device readings
 * Subscribes to new sensor data
 */
export function useRealtimeReadings(deviceId?: string) {
  const supabase = createClient();
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  const subscribe = useCallback(
    (callback: (event: any) => void) => {
      if (!deviceId) return;

      const subscription = supabase
        .channel(`readings:${deviceId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'device_readings',
            filter: `device_id=eq.${deviceId}`,
          },
          callback
        )
        .subscribe();

      setUnsubscribe(() => {
        supabase.removeChannel(subscription);
      });

      return subscription;
    },
    [supabase, deviceId]
  );

  useEffect(() => {
    return () => {
      unsubscribe?.();
    };
  }, [unsubscribe]);

  return { subscribe };
}

/**
 * Hook for real-time assignment updates
 * Subscribes to staff assignment changes
 */
export function useRealtimeAssignments(staffId?: string) {
  const supabase = createClient();
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  const subscribe = useCallback(
    (callback: (event: any) => void) => {
      if (!staffId) return;

      const subscription = supabase
        .channel(`assignments:${staffId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'staff_assignments',
            filter: `staff_id=eq.${staffId}`,
          },
          callback
        )
        .subscribe();

      setUnsubscribe(() => {
        supabase.removeChannel(subscription);
      });

      return subscription;
    },
    [supabase, staffId]
  );

  useEffect(() => {
    return () => {
      unsubscribe?.();
    };
  }, [unsubscribe]);

  return { subscribe };
}

/**
 * Hook for audio/visual alerts
 * Plays a notification sound when critical alerts occur
 */
export function useAlertNotification() {
  const playAlert = useCallback((type: 'critical' | 'warning' = 'critical') => {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = type === 'critical' ? 800 : 600;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    // Also try to use Notification API if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SmartBin Alert', {
        body: `${type === 'critical' ? 'Critical' : 'Warning'} alert detected`,
        icon: '/icon.svg',
        badge: '/icon.svg',
      });
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  return { playAlert, requestNotificationPermission };
}
