'use client';

import { Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateFillRate, estimateCrowdDensity } from '@/lib/operations-intelligence';

interface CrowdDensityPanelProps {
  devices: any[];
  zones?: Array<{ id: string; name: string }>;
}

export default function CrowdDensityPanel({ devices, zones = [] }: CrowdDensityPanelProps) {
  // Group devices by zone
  const devicesByZone = zones.length > 0
    ? zones.map(zone => ({
        zoneId: zone.id,
        zoneName: zone.name,
        devices: devices.filter(d => d.zone_id === zone.id),
      }))
    : [
        {
          zoneId: 'default',
          zoneName: 'All Zones',
          devices,
        },
      ];

  // Calculate crowd density for each zone
  const densities = devicesByZone.map(({ zoneId, zoneName, devices: zoneDevices }) => {
    const fillRates = zoneDevices.map(d => {
      // Simulate fill rate (in real app, use historical data)
      return calculateFillRate(d.fill_level - 8, d.fill_level, 4);
    });

    return estimateCrowdDensity(zoneId, zoneName, fillRates);
  });

  const getCrowdIcon = (density: string) => {
    switch (density) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const highDensityZones = densities.filter(d => d.density === 'high');

  return (
    <Card className="bg-[#11181F] border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-[#00FF9C]" />
            Crowd Density
          </CardTitle>
          <Badge className={`${highDensityZones.length > 0 ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-[#00FF9C]/20 text-[#00FF9C] border-[#00FF9C]/50'}`}>
            {highDensityZones.length > 0 ? `${highDensityZones.length} High` : 'Normal'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {densities.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No zones configured</p>
          ) : (
            densities.map(density => (
              <div
                key={density.zoneId}
                className={`p-3 rounded-lg border transition-all ${
                  density.density === 'high'
                    ? 'border-red-500/50 bg-red-500/5'
                    : density.density === 'medium'
                    ? 'border-yellow-500/50 bg-yellow-500/5'
                    : 'border-slate-600 bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-white text-sm flex items-center gap-2">
                      <span>{getCrowdIcon(density.density)}</span>
                      {density.zoneName}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {density.binCount} bins • {density.averageFillRate.toFixed(1)}% fill rate/min
                    </p>
                  </div>
                  <Badge
                    className={`${
                      density.density === 'high'
                        ? 'bg-red-500 text-white'
                        : density.density === 'medium'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}
                  >
                    {density.density.toUpperCase()}
                  </Badge>
                </div>

                {/* Visual fill rate indicator */}
                <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all ${
                      density.density === 'high'
                        ? 'bg-red-500'
                        : density.density === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min((density.averageFillRate / 3) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-2 font-medium">Classification:</p>
          <div className="space-y-1 text-xs">
            <p><span className="text-green-500">●</span> <span className="text-slate-300">Low: &lt;1% fill rate/min</span></p>
            <p><span className="text-yellow-500">●</span> <span className="text-slate-300">Medium: 1-2% fill rate/min</span></p>
            <p><span className="text-red-500">●</span> <span className="text-slate-300">High: &gt;2% fill rate/min</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
