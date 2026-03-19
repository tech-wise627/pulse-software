'use client';

import { TrendingUp, History, Info, BarChart3, Users, Zap } from 'lucide-react';
import { EventType, getSimilarEvents } from '@/lib/prediction-engine';

interface SimilarEventsPanelProps {
  eventType: EventType;
  attendees: number;
}

export default function SimilarEventsPanel({ eventType, attendees }: SimilarEventsPanelProps) {
  const similarEvents = getSimilarEvents(eventType, attendees);

  const header = (
    <div className="flex items-center gap-3 mb-6 relative z-10">
      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
        <History className="h-4 w-4 text-blue-400" />
      </div>
      <h3 className="text-sm font-bold text-white uppercase tracking-widest">Historical Parity</h3>
    </div>
  );

  if (similarEvents.length === 0) {
    return (
      <div className="bg-[#0D1117] border border-white/5 rounded-3xl p-6 h-full flex flex-col">
        {header}
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
           <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Info className="w-6 h-6 text-white/10" />
           </div>
           <p className="text-xs text-white/30 font-medium italic">Insufficient historical data points found for this specific event vector.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D1117] border border-white/5 rounded-3xl p-6 h-full group overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
         <History className="w-12 h-12 text-blue-400" />
      </div>
      
      {header}

      <div className="space-y-4 relative z-10">
        {similarEvents.map((event) => (
          <div key={event.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4 hover:border-blue-500/30 hover:bg-white/[0.04] transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-white tracking-tight">{event.name}</p>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">{event.type}</span>
                   <span className="w-1 h-1 rounded-full bg-white/20" />
                   <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{event.attendees.toLocaleString()} Node Pulse</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/20 p-2.5 rounded-xl border border-white/5 group/metric">
                <p className="text-white/20 text-[8px] font-bold uppercase tracking-widest mb-1 group-hover/metric:text-orange-400/50 transition-colors">Mass</p>
                <p className="text-xs font-bold text-white/80">{event.actualWaste.toLocaleString()} <span className="text-[9px] text-white/30">kg</span></p>
              </div>
              <div className="bg-black/20 p-2.5 rounded-xl border border-white/5 group/metric">
                <p className="text-white/20 text-[8px] font-bold uppercase tracking-widest mb-1 group-hover/metric:text-blue-400/50 transition-colors">Nodes</p>
                <p className="text-xs font-bold text-white/80">{event.actualBins} <span className="text-[9px] text-white/30">units</span></p>
              </div>
              <div className="bg-black/20 p-2.5 rounded-xl border border-white/5 group/metric">
                <p className="text-white/20 text-[8px] font-bold uppercase tracking-widest mb-1 group-hover/metric:text-emerald-400/50 transition-colors">Force</p>
                <p className="text-xs font-bold text-white/80">{event.actualStaff} <span className="text-[9px] text-white/30">PPL</span></p>
              </div>
            </div>

            <div className="flex gap-2.5 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <Zap className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-blue-200/50 leading-relaxed font-medium transition-colors">
                <span className="text-blue-400/80 font-bold uppercase tracking-tighter mr-1">Tactic:</span> 
                {event.lessons}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
