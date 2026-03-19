'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Users, TrendingUp, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Zone {
  name: string;
  totalBins: number;
  avgFillLevel: number;
  cleaningsToday: number;
  activeWorkers: number;
  status: 'normal' | 'high' | 'critical';
}

interface ZonePerformanceProps {
  onEmergencyClean?: (zoneName: string) => void;
}

const mockZones: Zone[] = [
  { name: 'Food Court', totalBins: 12, avgFillLevel: 78, cleaningsToday: 36, activeWorkers: 3, status: 'high' },
  { name: 'Entrance', totalBins: 6, avgFillLevel: 42, cleaningsToday: 14, activeWorkers: 1, status: 'normal' },
  { name: 'Stage Area', totalBins: 8, avgFillLevel: 65, cleaningsToday: 22, activeWorkers: 2, status: 'normal' },
  { name: 'Parking', totalBins: 5, avgFillLevel: 88, cleaningsToday: 18, activeWorkers: 1, status: 'critical' },
  { name: 'Restrooms', totalBins: 4, avgFillLevel: 55, cleaningsToday: 12, activeWorkers: 1, status: 'normal' },
];

export default function ZonePerformancePanel({ onEmergencyClean }: ZonePerformanceProps) {
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
              {mockZones.map((zone, idx) => (
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
                    <Badge className={`${getStatusColor(zone.status, zone.avgFillLevel)} border`}>
                      {getStatusLabel(zone.avgFillLevel)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 p-4 border-t border-slate-700 bg-[#0B0F14]">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Total Zones</p>
            <p className="text-xl font-bold text-[#00FF9C]">{mockZones.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Avg Fill Level</p>
            <p className="text-xl font-bold text-yellow-500">
              {Math.round(mockZones.reduce((sum, z) => sum + z.avgFillLevel, 0) / mockZones.length)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Total Cleanings</p>
            <p className="text-xl font-bold text-[#00FF9C]">{mockZones.reduce((sum, z) => sum + z.cleaningsToday, 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Active Workers</p>
            <p className="text-xl font-bold text-blue-400">{mockZones.reduce((sum, z) => sum + z.activeWorkers, 0)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
