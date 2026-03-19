'use client';

import { TrendingUp, TrendingDown, Package, Users, RotateCw, Zap, Target, Activity } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  icon: React.ReactNode;
  isWarning?: boolean;
  accent?: string;
}

function MetricCard({ label, value, unit, trend, icon, isWarning, accent = '#00FF9C' }: MetricCardProps) {
  return (
    <div className={`group relative bg-[#0D1117] border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:border-white/10 ${isWarning ? 'ring-1 ring-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.05)]' : ''}`}>
      {/* Mini glow orb */}
      <div 
        className="absolute -top-6 -right-6 w-16 h-16 rounded-full blur-[20px] opacity-0 group-hover:opacity-[0.1] transition-opacity duration-500"
        style={{ backgroundColor: isWarning ? '#EAB308' : accent }}
      />
      
      <div className="flex flex-col h-full justify-between relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">{label}</p>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold tracking-tight ${isWarning ? 'text-yellow-400' : 'text-white'}`}>
                {value}
              </span>
              {unit && <span className="text-[10px] text-white/20 font-medium uppercase tracking-widest">{unit}</span>}
            </div>
          </div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${isWarning ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-white/5 border-white/10 text-white/40 group-hover:text-white group-hover:border-white/20'}`}>
            {icon}
          </div>
        </div>

        {trend !== undefined && (
          <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tighter ${trend > 0 ? 'text-red-400' : 'text-[#00FF9C]'}`}>
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${trend > 0 ? 'bg-red-500/10 border border-red-500/20' : 'bg-[#00FF9C]/10 border border-[#00FF9C]/20'}`}>
              {trend > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              <span>{Math.abs(trend)}%</span>
            </div>
            <span className="text-white/10 lowercase font-medium tracking-normal">vs base</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface EventSummaryMetricsProps {
  metrics: {
    totalBinsDeployed: number;
    recommendedBins: number;
    totalStaffDeployed: number;
    recommendedStaff: number;
    totalCleaningCycles: number;
    collectionEfficiency: number;
  };
}

export default function EventSummaryMetrics({ metrics }: EventSummaryMetricsProps) {
  const binDeficiency = metrics.recommendedBins - metrics.totalBinsDeployed;
  const staffDeficiency = metrics.recommendedStaff - metrics.totalStaffDeployed;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <MetricCard
        label="Deployed Nodes"
        value={metrics.totalBinsDeployed}
        icon={<Package className="w-4 h-4" />}
        accent="#2F8CFF"
      />
      <MetricCard
        label="Strategic Target"
        value={metrics.recommendedBins}
        icon={<Target className="w-4 h-4" />}
        accent="#2F8CFF"
        isWarning={binDeficiency > 0}
        trend={binDeficiency > 0 ? 5 : -2}
      />
      <MetricCard
        label="Active Force"
        value={metrics.totalStaffDeployed}
        icon={<Users className="w-4 h-4" />}
        accent="#a78bfa"
      />
      <MetricCard
        label="Target Force"
        value={metrics.recommendedStaff}
        icon={<Activity className="w-4 h-4" />}
        accent="#a78bfa"
        isWarning={staffDeficiency > 0}
        trend={staffDeficiency > 0 ? 3 : -1}
      />
      <MetricCard
        label="Total Sweeps"
        value={metrics.totalCleaningCycles}
        icon={<RotateCw className="w-4 h-4" />}
        accent="#00FF9C"
      />
      <MetricCard
        label="Network Fidelity"
        value={`${metrics.collectionEfficiency}%`}
        unit="Sync"
        icon={<Zap className="w-4 h-4" />}
        accent="#00FF9C"
        trend={metrics.collectionEfficiency > 85 ? -2 : 3}
      />
    </div>
  );
}
