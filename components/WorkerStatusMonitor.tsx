'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, AlertCircle, MapPin } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

import { isPointInPolygon } from '@/lib/geofence';
import { Zone as ZoneType } from '@/lib/types';

interface WorkerStatusMonitorProps {
  staff?: any[];
  assignments?: any[];
  zones?: ZoneType[];
}

export default function WorkerStatusMonitor({ staff = [], assignments = [], zones = [] }: WorkerStatusMonitorProps) {
  // Map staff to the display format
  const workers = staff.map(s => {
    // Determine status
    const isActive = s.status?.toLowerCase() === 'active';
    const lastSeen = s.last_location_update ? new Date(s.last_location_update).getTime() : 0;
    const isRecentlyActive = (Date.now() - lastSeen) < 300000; // 5 mins
    
    let status: 'cleaning' | 'moving' | 'idle' | 'offline' = 'offline';
    if (isActive && isRecentlyActive) {
      status = 'cleaning';
    } else if (isActive) {
      status = 'idle';
    }

    // Find current task
    const workerAssignments = assignments.filter(a => a.staff_id === s.id && !a.completed_at);
    const currentTask = workerAssignments.length > 0 
      ? workerAssignments[0].device?.name || workerAssignments[0].device?.device_id || 'Tasked'
      : 'Waiting';

    const completedTasks = assignments.filter(a => a.staff_id === s.id && a.completed_at).length;

    // Find location zone
    let locationName = 'Unknown Area';
    if (s.latitude && s.longitude && zones.length > 0) {
      const currentZone = zones.find(z => isPointInPolygon([s.latitude, s.longitude], z.boundary));
      if (currentZone) {
        locationName = currentZone.name;
      }
    }

    return {
      id: s.id,
      name: s.full_name || s.name || s.email?.split('@')[0] || 'Unknown',
      status,
      currentTask,
      tasksCompleted: completedTasks,
      efficiency: status === 'offline' ? 0 : 85 + (parseInt(s.id.slice(-1)) || 0) % 15,
      location: locationName
    };
  })
  .filter(w => w.currentTask !== 'Waiting')
  .sort((a, b) => a.name.localeCompare(b.name));

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      cleaning: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400', label: 'Cleaning', icon: '🟢' },
      moving: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', label: 'Moving', icon: '🔵' },
      idle: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', label: 'Idle', icon: '🟡' },
      offline: { bg: 'bg-slate-600/20', border: 'border-slate-600/50', text: 'text-slate-400', label: 'Offline', icon: '⚫' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;
    return config;
  };

  const onlineWorkers = workers.filter(w => w.status !== 'offline').length;
  const activeWorkers = workers.filter(w => w.status === 'cleaning' || (w.status as string) === 'moving').length;

  return (
    <Card className="bg-[#11181F] border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-[#00FF9C]" />
            Worker Status Monitor
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-300">
              <span className="text-[#00FF9C] font-bold">{activeWorkers}</span> Active
            </span>
            <span className="text-slate-300">
              <span className="text-blue-400 font-bold">{onlineWorkers}</span> Online
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-[#0B0F14]">
                <th className="px-4 py-3 text-left text-slate-300 font-semibold">Worker</th>
                <th className="px-4 py-3 text-center text-slate-300 font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-slate-300 font-semibold">Current Task</th>
                <th className="px-4 py-3 text-center text-slate-300 font-semibold">Completed</th>
                <th className="px-4 py-3 text-left text-slate-300 font-semibold">Efficiency</th>
                <th className="px-4 py-3 text-left text-slate-300 font-semibold">Location</th>
              </tr>
            </thead>
            <tbody>
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic uppercase tracking-widest text-[10px]">
                    No Deployed Personnel Found
                  </td>
                </tr>
              ) : (
                workers.map((worker) => {
                  const statusConfig = getStatusBadge(worker.status);
                  return (
                    <tr key={worker.id} className="border-b border-slate-700 hover:bg-slate-800/30 transition">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${worker.status === 'offline' ? 'bg-slate-600' : 'bg-[#00FF9C]'}`}></span>
                          <span className="font-bold text-white uppercase tracking-tight">{worker.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge
                          className={`${statusConfig.bg} ${statusConfig.border} ${statusConfig.text} border text-[10px] px-2 py-0.5`}
                        >
                          {statusConfig.icon} {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-300 font-bold text-xs uppercase">{worker.currentTask}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-[#00FF9C]">{worker.tasksCompleted}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Progress value={worker.efficiency} className="h-2 w-12" />
                          <span className="text-slate-300 font-black text-[10px]">{worker.efficiency}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#00FF9C]/40" />
                          <span className="text-slate-400 text-[10px] font-bold uppercase">{worker.location}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Live Location Map Preview */}
        <div className="p-4 border-t border-slate-700 bg-[#0B0F14]">
          <p className="text-xs text-slate-400 mb-3 flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            Live Worker Locations
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className={`p-2 rounded border text-xs ${
                  worker.status === 'offline'
                    ? 'bg-slate-700/30 border-slate-600 text-slate-500'
                    : 'bg-slate-700/50 border-[#00FF9C]/30 text-slate-300'
                }`}
              >
                <span className="font-medium block mb-1">{worker.name}</span>
                <span className="text-slate-500">{worker.location}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
