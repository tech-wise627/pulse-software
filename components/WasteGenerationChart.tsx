'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WasteGenerationChartProps {
  data: Array<{
    time: string;
    waste: number;
    bins: number;
  }>;
}

export default function WasteGenerationChart({ data }: WasteGenerationChartProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Waste Generation Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" label={{ value: 'Waste %', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#F1F5F9',
              }}
              cursor={{ stroke: '#00FF9C', strokeWidth: 2 }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="waste"
              stroke="#00FF9C"
              strokeWidth={3}
              dot={{ fill: '#00FF9C', r: 5 }}
              activeDot={{ r: 7 }}
              name="Waste Level %"
            />
            <Line
              type="monotone"
              dataKey="bins"
              stroke="#FFC857"
              strokeWidth={2}
              dot={{ fill: '#FFC857', r: 4 }}
              name="Bins Filled"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
