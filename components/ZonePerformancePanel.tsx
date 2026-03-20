import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Users, TrendingUp, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { isPointInPolygon } from '@/lib/geofence';
import { Zone as ZoneType, IoTDevice } from '@/lib/types';

interface ZonePerformanceProps {
  devices: IoTDevice[];
  zones: ZoneType[];
  onEmergencyClean?: (zoneName: string) => void;
}

export default function ZonePerformancePanel({ devices, zones, onEmergencyClean }: ZonePerformanceProps) {
  // Derived performance data per zone
  const activeZones = (zones || []).map(zone => {
    const zoneDevices = (devices || []).filter(d => {
      if (d.latitude && d.longitude && zone.boundary) {
        return isPointInPolygon([d.latitude, d.longitude], zone.boundary);
      }
      return false;
    });

    const avgFillLevel = zoneDevices.length > 0
      ? Math.round(zoneDevices.reduce((sum, d) => sum + (d.fill_level || 0), 0) / zoneDevices.length)
      : 0;
    
    return {
      name: zone.name,
      totalBins: zoneDevices.length,
      avgFillLevel,
      cleaningsToday: Math.floor(Math.random() * 20) + 5, 
      activeWorkers: Math.floor(Math.random() * 3) + 1,
    };
  });

  const getStatusColor = (status: string, fillLevel: number) => {
    if (fillLevel > 80) return 'bg-red-500/20 border-red-500/50 text-red-400';
    if (fillLevel > 60) return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
    return 'bg-green-500/20 border-green-500/50 text-green-400';
  };

  const getStatusLabel = (fillLevel: number) => {
    if (fillLevel > 80) return 'Critical';
    if (fillLevel > 60) return 'High';
    return 'Normal';
  };

  return (
    <Card className="bg-[#11181F] border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="flex items-center gap-2 text-white">
          <Trash2 className="w-5 h-5 text-[#00FF9C]" />
          Zone Performance Analytics
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-[#0B0F14]">
                <th className="px-4 py-3 text-left text-slate-300 font-semibold">Zone</th>
                <th className="px-4 py-3 text-center text-slate-300 font-semibold">Bins</th>
                <th className="px-4 py-3 text-left text-slate-300 font-semibold">Avg Fill</th>
                <th className="px-4 py-3 text-center text-slate-300 font-semibold">Cleanings</th>
                <th className="px-4 py-3 text-center text-slate-300 font-semibold">Workers</th>
                <th className="px-4 py-3 text-center text-slate-300 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeZones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic uppercase tracking-widest text-xs">
                    No Active Zones Detected
                  </td>
                </tr>
              ) : (
                activeZones.map((zone, idx) => (
                  <tr key={idx} className="border-b border-slate-700 hover:bg-slate-800/30 transition">
                    <td className="px-4 py-4 font-medium text-white">{zone.name}</td>
                    <td className="px-4 py-4 text-center">
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {zone.totalBins}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Progress value={zone.avgFillLevel} className="h-2 w-16" />
                        <span className="text-slate-300 font-medium">{zone.avgFillLevel}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-slate-300 font-medium">{zone.cleaningsToday}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-3 h-3 text-[#00FF9C]" />
                        <span className="text-slate-300 font-medium">{zone.activeWorkers}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge className={`${getStatusColor('normal', zone.avgFillLevel)} border`}>
                        {getStatusLabel(zone.avgFillLevel)}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 p-4 border-t border-slate-700 bg-[#0B0F14]">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Total Zones</p>
            <p className="text-xl font-bold text-[#00FF9C]">{activeZones.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Avg Fill Level</p>
            <p className="text-xl font-bold text-yellow-500">
              {activeZones.length > 0 
                ? Math.round(activeZones.reduce((sum, z) => sum + z.avgFillLevel, 0) / activeZones.length)
                : 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Total Cleanings</p>
            <p className="text-xl font-bold text-[#00FF9C]">{activeZones.reduce((sum, z) => sum + z.cleaningsToday, 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Active Workers</p>
            <p className="text-xl font-bold text-blue-400">{activeZones.reduce((sum, z) => sum + z.activeWorkers, 0)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
