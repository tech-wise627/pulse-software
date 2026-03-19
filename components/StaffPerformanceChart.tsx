'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StaffPerformanceChartProps {
  data: Array<{
    name: string;
    binsCleaned: number;
    responseTime: number;
    efficiency: number;
  }>;
}

export default function StaffPerformanceChart({ data }: StaffPerformanceChartProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Staff Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" label={{ value: 'Count / %', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#F1F5F9',
              }}
              cursor={{ fill: 'rgba(0, 255, 156, 0.1)' }}
            />
            <Legend />
            <Bar dataKey="binsCleaned" fill="#00FF9C" radius={[8, 8, 0, 0]} name="Bins Cleaned" />
            <Bar dataKey="efficiency" fill="#FFC857" radius={[8, 8, 0, 0]} name="Efficiency %" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
