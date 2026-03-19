'use client';

import { Trash2, Users, RotateCw, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { PredictionResult } from '@/lib/prediction-engine';

interface MetricCardsProps {
  result: PredictionResult;
}

export default function MetricCards({ result }: MetricCardsProps) {
  const metrics = [
    {
      label: 'Peak Waste Load',
      value: result.predictions.peakWaste,
      unit: 'kg',
      icon: Trash2,
      accent: '#FF3B5C',
      confidence: result.confidence.wasteConfidence,
    },
    {
      label: 'Required Infrastructure',
      value: result.predictions.requiredBins,
      unit: 'bins',
      icon: Package,
      accent: '#2F8CFF',
      confidence: result.confidence.binsConfidence,
    },
    {
      label: 'Operational Force',
      value: result.predictions.requiredStaff,
      unit: 'staff',
      icon: Users,
      accent: '#00FF9C',
      confidence: result.confidence.staffConfidence,
    },
    {
      label: 'Optimum Cycles',
      value: result.predictions.cleaningCycles,
      unit: 'sweeps',
      icon: RotateCw,
      accent: '#A855F7',
      confidence: 85,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        const isHighConfidence = metric.confidence >= 85;
        
        return (
          <div
            key={idx}
            className="group relative bg-[#0D1117] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 overflow-hidden"
          >
            {/* Ambient background glow */}
            <div 
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[40px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500"
              style={{ backgroundColor: metric.accent }}
            />
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-start justify-between mb-8">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors duration-300"
                  style={{ 
                    backgroundColor: `${metric.accent}10`, 
                    borderColor: `${metric.accent}30`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: metric.accent }} strokeWidth={2} />
                </div>
                
                <div className="flex flex-col items-end">
                   <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-tighter ${isHighConfidence ? 'bg-[#00FF9C]/10 text-[#00FF9C] border-[#00FF9C]/30' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'}`}>
                    {isHighConfidence ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                    {metric.confidence}% Accuracy
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-1">{metric.label}</p>
                <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-bold tracking-tight text-white">{metric.value.toLocaleString()}</span>
                   <span className="text-sm font-medium text-white/40">{metric.unit}</span>
                </div>
              </div>

              {/* Mini progress bar for confidence */}
              <div className="mt-6 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${metric.confidence}%`, 
                    backgroundColor: metric.accent,
                    opacity: 0.6
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
