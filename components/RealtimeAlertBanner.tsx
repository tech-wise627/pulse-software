'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeAlerts, useAlertNotification } from '@/lib/realtime';
import { Alert as AlertType } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RealtimeAlertBannerProps {
  locationId?: string;
  onNewAlert?: (alert: AlertType) => void;
}

export default function RealtimeAlertBanner({ locationId, onNewAlert }: RealtimeAlertBannerProps) {
  const supabase = createClient();
  const [newAlerts, setNewAlerts] = useState<AlertType[]>([]);
  const [userId, setUserId] = useState<string>('');
  const { subscribe } = useRealtimeAlerts(locationId);
  const { playAlert, requestNotificationPermission } = useAlertNotification();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await requestNotificationPermission();
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!locationId) return;

    const handleNewAlert = (event: any) => {
      const alert = event.new as AlertType;
      setNewAlerts((prev) => [alert, ...prev.slice(0, 4)]);
      playAlert('critical');
      onNewAlert?.(alert);
    };

    subscribe(handleNewAlert);
  }, [locationId, subscribe, onNewAlert, playAlert]);

  const removeAlert = (alertId: string) => {
    setNewAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  if (newAlerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50 max-w-md">
      {newAlerts.map((alert) => (
        <div key={alert.id} className="animate-in slide-in-from-top-2">
          <Alert variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2">
                {alert.severity === 'critical' ? (
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <AlertDescription className="text-sm">
                  <p className="font-semibold">{alert.message}</p>
                  <p className="text-xs opacity-80 mt-1">
                    {alert.alert_type === 'high_fill' && `Fill: ${alert.fill_level?.toFixed(1)}%`}
                    {alert.alert_type === 'low_battery' && `Battery: ${alert.battery_level}%`}
                    {alert.alert_type === 'disconnected' && 'Device is offline'}
                    {alert.alert_type === 'tilted' && 'Bin is tilted'}
                  </p>
                </AlertDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeAlert(alert.id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        </div>
      ))}
    </div>
  );
}
