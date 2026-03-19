'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PeakWasteTimelineProps {
  duration: number;
  peakWaste: number;
  totalWaste: number;
}

export default function PeakWasteTimeline({ duration, peakWaste, totalWaste }: PeakWasteTimelineProps) {
  // Generate waste accumulation data
  const data = [];
  const avgWastePerHour = totalWaste / duration;
  let cumulativeWaste = 0;

  for (let hour = 0; hour <= duration; hour++) {
    const hourlyFraction = hour / duration;
    // Waste generation curve - peaks mid-event
    const peakFactor = Math.sin((hourlyFraction - 0.25) * Math.PI) * 0.8 + 0.6;
    const hourlyWaste = Math.max(avgWastePerHour * peakFactor, avgWastePerHour * 0.3);
    cumulativeWaste += hourlyWaste;

    data.push({
      hour,
      'Hourly Waste': Math.round(hourlyWaste),
      'Cumulative': Math.round(cumulativeWaste),
    });
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-white">Peak Waste Timeline</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorWaste" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#FF6B35" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="hour" stroke="#94a3b8" label={{ value: 'Hour', position: 'insideBottomRight', offset: -5, fill: '#94a3b8' }} />
            <YAxis stroke="#94a3b8" label={{ value: 'Waste (kg)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Area
              type="monotone"
              dataKey="Cumulative"
              stroke="#FF6B35"
              fill="url(#colorWaste)"
              isAnimationActive={false}
              name="Cumulative Waste"
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
          <div className="p-3 bg-slate-700/50 rounded">
            <p className="text-slate-400">Peak Waste</p>
            <p className="text-orange-400 font-semibold">{peakWaste.toLocaleString()} kg</p>
          </div>
          <div className="p-3 bg-slate-700/50 rounded">
            <p className="text-slate-400">Total Waste</p>
            <p className="text-accent font-semibold">{totalWaste.toLocaleString()} kg</p>
          </div>
          <div className="p-3 bg-slate-700/50 rounded">
            <p className="text-slate-400">Avg/Hour</p>
            <p className="text-blue-400 font-semibold">{Math.round(totalWaste / duration).toLocaleString()} kg</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
