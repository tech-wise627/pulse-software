'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { History, TrendingUp, ChevronRight } from 'lucide-react';

interface ComparisonData {
  event: string;
  efficiency: number;
  binsCleaned: number;
  staffUtilization: number;
}

interface HistoricalComparisonProps {
  data: ComparisonData[];
}

export default function HistoricalComparison({ data }: HistoricalComparisonProps) {
  return (
    <div className="bg-[#0D1117] border border-white/5 rounded-[2rem] p-8 h-full flex flex-col group overflow-hidden relative">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
         <History className="w-24 h-24 text-white" />
      </div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
            <History className="h-5 w-5 text-white/40 group-hover:text-white transition-colors" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Cross-Event Parity</h3>
            <p className="text-xs text-white/30 font-medium">Historical performance audit</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-white/20 uppercase tracking-widest">
           Live Benchmarking
        </div>
      </div>

      <div className="flex-1 w-full relative z-10 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis 
              dataKey="event" 
              stroke="#ffffff15" 
              fontSize={10} 
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#ffffff30' }}
              dy={10}
            />
            <YAxis 
              stroke="#ffffff15" 
              fontSize={10} 
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#ffffff30' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0D1117',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: '600',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
               }}
              itemStyle={{ padding: '2px 0' }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '0px', paddingBottom: '30px', opacity: 0.6 }} />
            <Line
              type="monotone"
              dataKey="efficiency"
              stroke="#00FF9C"
              strokeWidth={3}
              dot={{ fill: '#00FF9C', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              name="Efficiency"
            />
            <Line
              type="monotone"
              dataKey="staffUtilization"
              stroke="#2F8CFF"
              strokeWidth={2}
              dot={{ fill: '#2F8CFF', r: 3, strokeWidth: 0 }}
              name="Force Sync"
            />
            <Line
              type="monotone"
              dataKey="binsCleaned"
              stroke="#FF3B5C"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Collection Load"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-8 p-4 rounded-2xl bg-[#00FF9C]/5 border border-[#00FF9C]/10 flex items-start gap-4 group/insight hover:bg-[#00FF9C]/10 transition-colors">
        <div className="w-8 h-8 rounded-xl bg-[#00FF9C]/10 flex items-center justify-center shrink-0 border border-[#00FF9C]/20 group-hover/insight:bg-[#00FF9C] transition-colors">
           <TrendingUp className="h-4 w-4 text-[#00FF9C] group-hover/insight:text-black transition-colors" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#00FF9C]">Analytical insight</p>
          <p className="text-[11px] text-white/40 leading-relaxed italic font-medium">
            Systemic performance vectors are stabilizing. Efficiency is tracking <span className="text-white">3.8% above historical mean</span> with optimized resource utilization across the last 4 major nodes.
          </p>
        </div>
      </div>
    </div>
  );
}
