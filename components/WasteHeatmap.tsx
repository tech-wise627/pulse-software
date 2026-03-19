'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface ZoneIntensity {
  zone: string;
  level: 'High' | 'Medium' | 'Low';
  percentage: number;
  color: string;
}

interface WasteHeatmapProps {
  zones: ZoneIntensity[];
}

export default function WasteHeatmap({ zones }: WasteHeatmapProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Waste Zone Heatmap</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {zones.map((zone) => (
          <div key={zone.zone} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white text-sm">{zone.zone}</p>
                <p className="text-xs text-slate-400">{zone.level} intensity</p>
              </div>
              <span className="text-sm font-bold text-accent">{Math.round(zone.percentage)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${zone.percentage}%`,
                  backgroundColor: zone.color,
                  boxShadow: `0 0 8px ${zone.color}80`,
                }}
              />
            </div>
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white mb-1">Peak Activity Zone</p>
              <p className="text-xs text-slate-400">
                Food Court is experiencing the highest waste generation. Consider deploying additional bins in this area.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
