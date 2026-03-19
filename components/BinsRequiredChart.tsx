'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BinsRequiredChartProps {
  attendees: number;
  requiredBins: number;
  binCapacity: number;
  eventType: string;
}

export default function BinsRequiredChart({ attendees, requiredBins, binCapacity, eventType }: BinsRequiredChartProps) {
  // Generate data based on attendance tiers
  const data = [
    {
      tier: 'Current',
      bins: requiredBins,
      capacity: requiredBins * binCapacity,
      attendees,
    },
    {
      tier: '+20% Growth',
      bins: Math.ceil(requiredBins * 1.2),
      capacity: Math.ceil(requiredBins * 1.2) * binCapacity,
      attendees: Math.round(attendees * 1.2),
    },
    {
      tier: '+50% Growth',
      bins: Math.ceil(requiredBins * 1.5),
      capacity: Math.ceil(requiredBins * 1.5) * binCapacity,
      attendees: Math.round(attendees * 1.5),
    },
    {
      tier: 'Peak Scenario',
      bins: Math.ceil(requiredBins * 1.8),
      capacity: Math.ceil(requiredBins * 1.8) * binCapacity,
      attendees: Math.round(attendees * 1.8),
    },
  ];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-white">Bins Required by Attendance Scenario</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="tier" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" label={{ value: 'Number of Bins', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Bar dataKey="bins" fill="#2F8CFF" name="Bins Required" radius={[8, 8, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div className="p-3 bg-slate-700/50 rounded">
            <p className="text-slate-400">Bin Capacity</p>
            <p className="text-accent font-semibold">{binCapacity}L</p>
          </div>
          <div className="p-3 bg-slate-700/50 rounded">
            <p className="text-slate-400">Event Type</p>
            <p className="text-accent font-semibold capitalize">{eventType}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
