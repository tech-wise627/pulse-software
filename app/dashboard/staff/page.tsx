'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { mockAssignments, mockDevices, mockLocations, mockStaff } from '@/lib/mock-data';
import { notificationService } from '@/lib/notification-service';
import { checkGeofenceStatus, calculateDistance } from '@/lib/geofence';
import { createClient } from '@/lib/supabase/client';
import DashboardNav from '@/components/DashboardNav';
import StaffPanicButton from '@/components/StaffPanicButton';
import StaffDashboardMinimal from '@/components/StaffDashboardMinimal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Battery, Droplet, MapPin, CheckCircle2, Clock, Bell, X, AlertCircle, Navigation } from 'lucide-react';

const StaffMap = dynamic(() => import('@/components/StaffMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center"><span className="text-gray-600">Loading map...</span></div>
});

export default function StaffDashboard() {
  const staff = mockStaff?.[0];
  
  if (!staff) {
    return (
      <div className="min-h-screen bg-white">
        <DashboardNav />
        <div className="container mx-auto py-4 px-4">
          <Alert className="border-red-500 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 ml-2">
              No staff member found. Please check your data.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const staffAssignments = mockAssignments.filter((a) => a.staff_id === staff.id);
  const staffLocation = mockLocations.find((l) => l.id === staff.location_id);
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<string>(staffAssignments[0]?.id || '');
  const [completedAssignments, setCompletedAssignments] = useState<Set<string>>(new Set());
  const [isOutOfZone, setIsOutOfZone] = useState(false);
  const [geofenceStatus, setGeofenceStatus] = useState<any>(null);
  const [alertedBins, setAlertedBins] = useState<Set<string>>(new Set());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [outOfZoneStartTime, setOutOfZoneStartTime] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const outOfZoneTimerRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();
  const lastUpdateRef = useRef<number>(0);

  const startGeolocation = () => {
    if (!('geolocation' in navigator)) {
      setGeolocationError('Geolocation is not supported by your browser');
      return;
    }

    setGeolocationError(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setGeolocationError(null);
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setGeolocationError('PERMISSION_DENIED');
        } else {
          setGeolocationError('GEOLOCATION_FAILED');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    startGeolocation();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Sync location to Supabase
  useEffect(() => {
    if (!userLocation) return;

    const syncLocation = async () => {
      const now = Date.now();
      // Throttle: Update at most once every 10 seconds
      if (now - lastUpdateRef.current < 10000) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({
          latitude: userLocation[0],
          longitude: userLocation[1],
          last_location_update: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error syncing location:', error);
      } else {
        lastUpdateRef.current = now;
      }
    };

    syncLocation();
  }, [userLocation, supabase]);

  // Geofencing check - monitor if worker is inside event boundary
  useEffect(() => {
    if (!userLocation || !staffLocation?.boundary) return;

    const status = checkGeofenceStatus(userLocation, staffLocation.boundary as any);
    setGeofenceStatus(status);

    if (!status.isInside) {
      // Worker is outside the zone
      if (!isOutOfZone) {
        // First time going out of zone
        setIsOutOfZone(true);
        setOutOfZoneStartTime(Date.now());

        // Trigger immediate alert
        notificationService.sendAlert({
          binId: 'geofence',
          binName: `Outside Event Area - ${status.distance}m away`,
          fillLevel: 0,
          distance: status.distance,
          zone: `Return ${status.direction}`,
        });

        // Vibration alert
        if (navigator.vibrate) {
          navigator.vibrate([300, 150, 300, 150, 300]);
        }
      }

      // Check if outside for more than 2 minutes
      if (outOfZoneStartTime && Date.now() - outOfZoneStartTime > 120000) {
        if (outOfZoneTimerRef.current) {
          clearTimeout(outOfZoneTimerRef.current);
        }
        // Manager will be notified (handled in manager dashboard)
        console.log('[v0] Worker outside zone for 2+ minutes');
      }
    } else {
      // Worker is back inside the zone
      if (isOutOfZone) {
        // Just returned to zone
        setIsOutOfZone(false);
        setOutOfZoneStartTime(null);

        if (outOfZoneTimerRef.current) {
          clearTimeout(outOfZoneTimerRef.current);
        }

        // Show confirmation
        notificationService.sendAlert({
          binId: 'geofence-return',
          binName: 'Welcome back to event zone',
          fillLevel: 0,
          distance: 0,
          zone: 'Active',
        });

        // Success vibration pattern
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100, 50, 100]);
        }
      }
    }
  }, [userLocation, staffLocation?.boundary, isOutOfZone, outOfZoneStartTime]);

  useEffect(() => {
    const initNotifications = async () => {
      const permission = await notificationService.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'default') {
        setShowPermissionPrompt(true);
      }
    };

    initNotifications();
  }, []);

  // Monitor for nearby full bins and trigger notifications
  useEffect(() => {
    if (!userLocation) return;

    const assignedDevices = staffAssignments
      .map((a) => mockDevices.find((d) => d.id === a.device_id))
      .filter(Boolean) as typeof mockDevices;

    assignedDevices.forEach((device) => {
      if (!device?.latitude || !device?.longitude) return;

      const isFull = device.fill_level >= 80;
      const distance = calculateDistance(userLocation, [device.latitude, device.longitude]);
      const isNearby = distance < 30000; // 30 meters
      const shouldAlert = isFull && isNearby && !alertedBins.has(device.id);

      if (shouldAlert) {
        // Use notification service for multi-modal alerts
        notificationService.sendAlert({
          binId: device.id,
          binName: device.name,
          fillLevel: device.fill_level,
          distance,
          zone: staffLocation?.name || 'Unknown Zone',
        });

        setAlertedBins((prev) => new Set([...prev, device.id]));
      }
    });
  }, [userLocation, staffAssignments, alertedBins, calculateDistance]);

  const currentAssignment = staffAssignments.find((a) => a.id === selectedAssignment);
  const currentDevice = mockDevices.find((d) => d.id === currentAssignment?.device_id);

  const getNextBinRecommendation = () => {
    const uncompletedAssignments = staffAssignments.filter((a) => !completedAssignments.has(a.id));
    if (uncompletedAssignments.length === 0) return null;

    if (!userLocation) {
      // If no location, sort by fill level
      return uncompletedAssignments.sort((a, b) => {
        const deviceA = mockDevices.find((d) => d.id === a.device_id);
        const deviceB = mockDevices.find((d) => d.id === b.device_id);
        return (deviceB?.fill_level || 0) - (deviceA?.fill_level || 0);
      })[0];
    }

    // Calculate priority score for each bin: (fill_level * 0.7) + (distance_weight * 0.3)
    const scoredAssignments = uncompletedAssignments.map((a) => {
      const device = mockDevices.find((d) => d.id === a.device_id);
      if (!device?.latitude || !device?.longitude) return { assignment: a, score: 0 };

      const fillScore = (device.fill_level || 0) * 0.7;
      const distance = calculateDistance(userLocation, [device.latitude, device.longitude]);
      const maxDistance = 500; // 500 meters as max distance for scoring
      const distanceScore = Math.max(0, (1 - distance / maxDistance) * 100) * 0.3;
      
      return {
        assignment: a,
        score: fillScore + distanceScore,
        distance,
      };
    });

    return scoredAssignments.sort((a, b) => b.score - a.score)[0]?.assignment || null;
  };

  const nextBin = getNextBinRecommendation();
  const nextBinDevice = nextBin ? mockDevices.find((d) => d.id === nextBin.device_id) : null;

  const completedCount = completedAssignments.size;
  const totalCount = staffAssignments.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const handleCompleteAssignment = () => {
    if (selectedAssignment) {
      const newCompleted = new Set(completedAssignments);
      newCompleted.add(selectedAssignment);
      setCompletedAssignments(newCompleted);

      const nextUncompleted = staffAssignments.find((a) => !newCompleted.has(a.id));
      if (nextUncompleted) {
        setSelectedAssignment(nextUncompleted.id);
      }
    }
  };

  const getBinStatus = (fillLevel: number) => {
    if (fillLevel < 50) return { label: 'Healthy', color: 'bg-green-500', textColor: 'text-green-600', lightBg: 'bg-green-50', lightBorder: 'border-green-200' };
    if (fillLevel < 80) return { label: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-600', lightBg: 'bg-amber-50', lightBorder: 'border-amber-200' };
    return { label: 'Critical', color: 'bg-red-500', textColor: 'text-red-600', lightBg: 'bg-red-50', lightBorder: 'border-red-200' };
  };

  const binStatus = currentDevice ? getBinStatus(currentDevice.fill_level) : null;
  const nextBinStatus = nextBinDevice ? getBinStatus(nextBinDevice.fill_level) : null;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <StaffDashboardMinimal
        workerName={staff.name}
        currentBin={currentDevice}
        nextBin={nextBinDevice}
        zone={staffLocation?.name || 'Unknown Zone'}
        userLocation={userLocation || undefined}
        geolocationError={geolocationError}
        onRetryGeolocation={startGeolocation}
        onMarkCleaned={handleCompleteAssignment}
        completedCount={completedAssignments.size}
        allBins={staffAssignments.map((a) => mockDevices.find((d) => d.id === a.device_id)).filter(Boolean) as typeof mockDevices}
        completedAssignmentIds={Array.from(completedAssignments)}
        staffAssignments={staffAssignments}
      />
    </div>
  );
}
