'use client';

import { TrendingUp, TrendingDown, AlertCircle, Zap, Activity, Target, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WastePredictionCardProps {
  prediction: {
    predictedNextHour: number;
    peakHour: string;
    recommendedAction: string;
  };
  currentFillLevel: number;
}

export default function WastePredictionCard({
  prediction,
  currentFillLevel,
}: WastePredictionCardProps) {
  const isAlertLevel = prediction.predictedNextHour > 80;
  const growthRate = Math.round(((prediction.predictedNextHour - currentFillLevel) / currentFillLevel) * 100);

  return (
    <div className={`p-8 bg-[#0D1117] border rounded-[2.5rem] h-full flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-500 ${isAlertLevel ? 'border-yellow-500/30 ring-1 ring-yellow-500/10' : 'border-white/5'}`}>
      {/* Background glow orbs */}
      <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[60px] opacity-[0.05] ${isAlertLevel ? 'bg-yellow-500' : 'bg-[#00FF9C]'}`} />
      
      <div className="relative z-10 w-full space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                <Zap className={`w-5 h-5 ${isAlertLevel ? 'text-yellow-400' : 'text-[#00FF9C]'}`} />
             </div>
             <div>
               <h3 className="text-xl font-bold text-white tracking-tight">AI Prediction Engine</h3>
               <p className="text-xs text-white/30 font-medium">Next-hour load modeling</p>
             </div>
          </div>
          {isAlertLevel && (
            <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Surge Warning</span>
            </div>
          )}
        </div>

        {/* Core metrics comparison */}
        <div className="grid grid-cols-2 gap-6 pt-4">
           <div className="space-y-1">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2">Current sync</p>
              <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-bold tracking-tighter text-white/90">{currentFillLevel}</span>
                 <span className="text-xs font-bold text-white/30 uppercase tracking-widest">% fill</span>
              </div>
           </div>
           <div className="space-y-1 border-l border-white/5 pl-6">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2">Predicted state</p>
              <div className="flex items-baseline gap-2 text-[#00FF9C]">
                 <span className={`text-4xl font-bold tracking-tighter ${isAlertLevel ? 'text-yellow-400' : 'text-[#00FF9C]'}`}>
                    {prediction.predictedNextHour}
                 </span>
                 <span className={`text-xs font-bold uppercase tracking-widest ${isAlertLevel ? 'text-yellow-400/40' : 'text-[#00FF9C]/40'}`}>% fill</span>
              </div>
           </div>
        </div>

        {/* Growth and Peak data */}
        <div className="flex items-center gap-8 py-6 border-y border-white/5">
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${growthRate > 0 ? 'bg-orange-500/10' : 'bg-[#00FF9C]/10'}`}>
                 <ArrowUpRight className={`w-4 h-4 ${growthRate > 0 ? 'text-orange-400' : 'text-[#00FF9C]'} ${growthRate < 0 ? 'rotate-90' : ''}`} />
              </div>
              <div>
                 <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-0.5">Growth Delta</p>
                 <p className={`text-sm font-bold ${growthRate > 0 ? 'text-orange-400' : 'text-[#00FF9C]'}`}>
                    {growthRate > 0 ? '+' : ''}{growthRate}% 
                    <span className="text-[10px] text-white/20 font-medium ml-1">v.last hour</span>
                 </p>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10">
                 <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                 <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-0.5">Peak Window</p>
                 <p className="text-sm font-bold text-white/80">{prediction.peakHour}</p>
              </div>
           </div>
        </div>

        {/* Strategic Directive */}
        <div className={`p-5 rounded-3xl border flex items-start gap-4 transition-colors ${isAlertLevel ? 'bg-yellow-500/5 border-yellow-500/10' : 'bg-[#00FF9C]/5 border-[#00FF9C]/10'}`}>
           <div className={`p-2 rounded-xl shrink-0 ${isAlertLevel ? 'bg-yellow-400 text-black' : 'bg-[#00FF9C] text-black'}`}>
              <Target className="w-4 h-4" />
           </div>
           <div className="space-y-1">
              <p className={`text-[10px] font-black uppercase tracking-widest ${isAlertLevel ? 'text-yellow-400' : 'text-[#00FF9C]'}`}>
                Tactical Recommendation
              </p>
              <p className="text-sm text-white/70 leading-relaxed italic font-medium">"{prediction.recommendedAction}"</p>
           </div>
        </div>
      </div>
    </div>
  );
}
