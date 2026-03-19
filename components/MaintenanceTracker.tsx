'use client';

import { AlertTriangle, Wrench, Battery, Signal, Smartphone, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { checkDeviceMaintenance, getMaintenanceSummary } from '@/lib/operations-intelligence';

interface MaintenanceTrackerProps {
  devices: any[];
}

export default function MaintenanceTracker({ devices }: MaintenanceTrackerProps) {
  const summary = getMaintenanceSummary(devices);
  const problemDevices = summary.maintenanceStatuses
    .filter(m => m.requiresMaintenance)
    .sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity as keyof typeof severityOrder] - 
             severityOrder[b.severity as keyof typeof severityOrder];
    });

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'battery_low':
        return <Battery className="w-4 h-4 text-yellow-500" />;
      case 'no_signal':
        return <Signal className="w-4 h-4 text-yellow-500" />;
      case 'offline':
        return <Smartphone className="w-4 h-4 text-red-500" />;
      case 'tilt_detected':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'sensor_error':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <Card className="bg-[#11181F] border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <Wrench className="w-5 h-5 text-[#00FF9C]" />
            Device Maintenance
          </CardTitle>
          <Badge className={`${summary.highPriorityIssues > 0 ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-[#00FF9C]/20 text-[#00FF9C] border-[#00FF9C]/50'}`}>
            {summary.requiresMaintenance} Issues
          </Badge>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 rounded p-2">
            <p className="text-xs text-slate-400">Online</p>
            <p className="text-lg font-bold text-green-500">{summary.devicesOnline}</p>
            <p className="text-xs text-slate-500">of {summary.totalDevices}</p>
          </div>
          <div className="bg-slate-800/50 rounded p-2">
            <p className="text-xs text-slate-400">Offline</p>
            <p className="text-lg font-bold text-red-500">{summary.devicesOffline}</p>
            <p className="text-xs text-slate-500">of {summary.totalDevices}</p>
          </div>
          <div className="bg-slate-800/50 rounded p-2">
            <p className="text-xs text-slate-400">Low Battery</p>
            <p className="text-lg font-bold text-yellow-500">{summary.lowBatteryDevices}</p>
            <p className="text-xs text-slate-500">&lt;20%</p>
          </div>
          <div className="bg-slate-800/50 rounded p-2">
            <p className="text-xs text-slate-400">High Priority</p>
            <p className="text-lg font-bold text-red-500">{summary.highPriorityIssues}</p>
            <p className="text-xs text-slate-500">issues</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {problemDevices.length === 0 ? (
            <p className="text-slate-400 text-sm py-6 text-center">All devices operational ✓</p>
          ) : (
            problemDevices.map(device => (
              <div
                key={device.binId}
                className={`p-3 rounded-lg border text-sm transition-all ${
                  device.severity === 'high'
                    ? 'border-red-500/50 bg-red-500/5'
                    : device.severity === 'medium'
                    ? 'border-yellow-500/50 bg-yellow-500/5'
                    : 'border-slate-600 bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-white">{device.deviceId}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{device.binName}</p>
                  </div>
                  <Badge
                    className={`${
                      device.severity === 'high'
                        ? 'bg-red-500 text-white text-xs'
                        : device.severity === 'medium'
                        ? 'bg-yellow-500 text-white text-xs'
                        : 'bg-slate-600 text-white text-xs'
                    }`}
                  >
                    {device.severity.toUpperCase()}
                  </Badge>
                </div>

                {/* Issues list */}
                <div className="space-y-1">
                  {device.issues.map((issue, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      {getIssueIcon(issue.type)}
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
