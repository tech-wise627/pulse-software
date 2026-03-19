'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WasteVsCrowdChartProps {
  attendees: number;
  duration: number;
  peakWaste: number;
  totalWaste: number;
}

export default function WasteVsCrowdChart({ attendees, duration, peakWaste, totalWaste }: WasteVsCrowdChartProps) {
  // Generate timeline data
  const data = [];
  const avgWastePerHour = totalWaste / duration;
  
  for (let hour = 0; hour <= duration; hour++) {
    const hourlyFraction = hour / duration;
    // Waste typically peaks at 50-60% through the event
    const peakFactor = Math.sin((hourlyFraction - 0.2) * Math.PI) * 0.8 + 0.6;
    const waste = Math.max(avgWastePerHour * peakFactor, avgWastePerHour * 0.3);
    
    data.push({
      hour,
      'Waste (kg)': Math.round(waste),
      'Attendees': Math.round(attendees * (Math.sin((hourlyFraction - 0.25) * Math.PI) * 0.7 + 0.7)),
    });
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-white">Waste Generation vs Attendee Presence</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="hour" stroke="#94a3b8" label={{ value: 'Hour', position: 'insideBottomRight', offset: -5, fill: '#94a3b8' }} />
            <YAxis stroke="#94a3b8" label={{ value: 'Amount', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Waste (kg)"
              stroke="#FF6B35"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="Attendees"
              stroke="#2F8CFF"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
