'use client';

import { MapPin, AlertCircle, ShieldAlert, CheckCircle2, Navigation, Target } from 'lucide-react';
import { PredictionResult } from '@/lib/prediction-engine';

interface BinPlacementCardProps {
  result: PredictionResult;
}

export default function BinPlacementCard({ result }: BinPlacementCardProps) {
  const { recommendations, predictions } = result;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-transparent">
      {/* Bin Placement Strategy */}
      <div className="bg-[#0D1117] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Navigation className="w-12 h-12 text-[#00FF9C]" />
        </div>
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-[#00FF9C]/10 flex items-center justify-center">
            <Target className="h-4 w-4 text-[#00FF9C]" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Tactical Placement</h3>
        </div>

        <div className="space-y-4 relative z-10">
          {recommendations.binPlacement.map((placement, idx) => (
            <div key={idx} className="flex gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#00FF9C]/20 transition-all group/item">
              <div className="w-5 h-5 rounded-full bg-[#00FF9C]/10 border border-[#00FF9C]/20 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-[#00FF9C] transition-colors">
                <span className="text-[10px] font-bold text-[#00FF9C] group-hover/item:text-black">{idx + 1}</span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed font-medium group-hover/item:text-white transition-colors">{placement}</p>
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-[#00FF9C]/5 border border-[#00FF9C]/10 rounded-2xl flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Hardware Optima</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#00FF9C]">{predictions.suggestedBinCapacity}L</span>
              <span className="text-[10px] text-white/40">Capacity Recommended</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collection & Staff Strategy */}
      <div className="flex flex-col gap-6">
        <div className="flex-1 bg-[#0D1117] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4 text-yellow-500" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Operational Directives</h3>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2">Personnel Deployment</p>
              <p className="text-sm text-white/70 leading-relaxed italic border-l-2 border-yellow-500/30 pl-4 py-1">{recommendations.staffStrategy}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2">Collection Cycle</p>
              <p className="text-sm text-white/70 leading-relaxed italic border-l-2 border-[#00FF9C]/30 pl-4 py-1">{recommendations.collectionSchedule}</p>
            </div>
          </div>
        </div>

        {/* Contingency Row */}
        <div className="bg-[#0D1117] border border-white/5 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-500" />
             </div>
             <h3 className="text-sm font-bold text-white uppercase tracking-widest">Surge Contingencies</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
             {recommendations.contingencies.map((contingency, idx) => (
                <div key={idx} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/10 hover:border-red-500/30 transition-all group/item">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500/40 group-hover/item:bg-red-500 transition-colors" />
                   <p className="text-[11px] text-red-200/60 font-medium group-hover/item:text-red-200 transition-colors">{contingency}</p>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
