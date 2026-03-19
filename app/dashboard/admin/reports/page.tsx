'use client';

import { useState } from 'react';
import DashboardNav from '@/components/DashboardNav';
import FilterPanel from '@/components/FilterPanel';
import EventSummaryMetrics from '@/components/EventSummaryMetrics';
import WasteGenerationChart from '@/components/WasteGenerationChart';
import BinUsageChart from '@/components/BinUsageChart';
import StaffPerformanceChart from '@/components/StaffPerformanceChart';
import WasteHeatmap from '@/components/WasteHeatmap';
import WastePredictionCard from '@/components/WastePredictionCard';
import HistoricalComparison from '@/components/HistoricalComparison';
import { Button } from '@/components/ui/button';
import { Download, BarChart3, TrendingUp, Filter, FileBarChart, Zap, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { mockLocations, mockDevices, mockAssignments } from '@/lib/mock-data';
import {
  calculateWasteMetrics,
  generateHourlyWasteData,
  generateStaffPerformance,
  predictWasteTrend,
  getZoneWasteIntensity,
  generateEventComparison,
} from '@/lib/analytics-utils';

export default function ReportsAnalyticsPage() {
  const [filters, setFilters] = useState({
    eventName: '',
    location: '',
    dateFrom: '',
    dateTo: '',
    timeFilter: 'all',
  });

  // Calculate metrics
  const metrics = calculateWasteMetrics(mockDevices, mockAssignments);
  const wasteData = generateHourlyWasteData();
  const staffData = generateStaffPerformance();
  const zoneData = getZoneWasteIntensity();
  const comparison = generateEventComparison(mockLocations);

  const currentAvgFill = mockDevices.length > 0
    ? Math.round(mockDevices.reduce((sum, d) => sum + (d.fill_level || 0), 0) / mockDevices.length)
    : 0;

  const prediction = predictWasteTrend(currentAvgFill);

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    console.log(`[Reports] Exporting report as ${format}`);
    alert(`Generating ${format.toUpperCase()} Intelligence Report...`);
  };

  return (
    <div className="min-h-screen bg-[#080C10] text-white selection:bg-[#00FF9C]/30 transition-colors duration-500">
      <DashboardNav />
      {/* Background ambient glow */}
      <div className="pointer-events-none fixed top-0 right-1/4 w-[800px] h-[500px] rounded-full bg-[#00FF9C] opacity-[0.02] blur-[120px] z-0" />

      <main className="container mx-auto p-6 space-y-10 relative z-10 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-4">
          <div className="flex items-start gap-4">
            <Link href="/dashboard/admin">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white/40 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 mt-1"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00FF9C]">Intelligence Ops</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Visual Analytics</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white flex items-center gap-4">
              <FileBarChart className="w-10 h-10 text-[#00FF9C]/80" />
              Reports & Insights
            </h1>
            <p className="text-white/40 mt-2 max-w-xl text-lg leading-relaxed font-medium">
              Real-time telemetry synthesis and historical performance mapping for the P.U.L.S.E autonomous collector network.
            </p>
          </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex p-1 bg-white/[0.03] border border-white/10 rounded-xl mr-2">
              {['PDF', 'CSV', 'XLS'].map((fmt) => (
                 <button 
                  key={fmt}
                  onClick={() => handleExport(fmt.toLowerCase() as any)}
                  className="px-4 py-2 text-[10px] font-bold text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                 >
                   {fmt}
                 </button>
              ))}
            </div>
            <Button
              className="bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black font-bold tracking-tight px-6 h-11 transition-all shadow-[0_0_20px_rgba(0,255,156,0.15)] rounded-xl"
              onClick={() => handleExport('pdf')}
            >
              <Download className="h-4 w-4 mr-2" />
              Final Report
            </Button>
          </div>
        </div>

        {/* Filter Panel - Redesigned via FilterPanel.tsx next */}
        <div className="bg-white/[0.02] border border-white/5 p-1 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
           <FilterPanel events={mockLocations} onFilterChange={setFilters} />
        </div>

        {/* Event Summary Metrics - Redesigned via EventSummaryMetrics.tsx next */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
              <Zap className="h-4 w-4 text-[#00FF9C]" />
              Executive telemetry summary
            </h2>
            <div className="h-px bg-white/5 flex-1 mx-8 hidden md:block" />
          </div>
          <EventSummaryMetrics metrics={metrics} />
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
          <div className="group rounded-3xl bg-[#0D1117] border border-white/5 p-8 hover:border-blue-500/20 transition-all duration-500">
             <WasteGenerationChart data={wasteData} />
          </div>
          <div className="group rounded-3xl bg-[#0D1117] border border-white/5 p-8 hover:border-[#00FF9C]/20 transition-all duration-500">
             <BinUsageChart data={wasteData} />
          </div>
          <div className="group rounded-3xl bg-[#0D1117] border border-white/5 p-8 hover:border-purple-500/20 transition-all duration-500">
             <StaffPerformanceChart data={staffData} />
          </div>
          <div className="group rounded-3xl bg-[#0D1117] border border-white/5 p-8 hover:border-orange-500/20 transition-all duration-500">
             <WasteHeatmap zones={zoneData} />
          </div>
        </div>

        {/* Predictions and Comparisons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="p-1 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent">
             <WastePredictionCard prediction={prediction} currentFillLevel={currentAvgFill} />
           </div>
           <div className="p-1 rounded-[2rem] bg-white/[0.02] border border-white/5">
             <HistoricalComparison data={comparison} />
           </div>
        </div>

        {/* Tactical Insights Section */}
        <div className="relative pt-8 pb-20">
           <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
           
           <div className="flex items-center gap-3 mb-10 pt-10">
              <div className="w-10 h-10 rounded-2xl bg-[#00FF9C]/10 border border-[#00FF9C]/20 flex items-center justify-center">
                 <TrendingUp className="w-6 h-6 text-[#00FF9C]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Tactical Performance Insights</h2>
                <p className="text-sm text-white/30">AI-generated operational optimization directives</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[
                { 
                  title: 'System Efficiency', 
                  desc: `Operational fidelity at ${metrics.collectionEfficiency}%, exceeding baseline targets. Deployment vector is stable.`,
                  color: '#00FF9C',
                  tag: 'Optimum'
                },
                { 
                  title: 'Resource Delta', 
                  desc: `Identified ±${metrics.recommendedBins - metrics.totalBinsDeployed} bin variance in peak windows (20:00 - 21:00).`,
                  color: '#FFB800',
                  tag: 'Action Needed'
                },
                { 
                  title: 'Performance Trend', 
                  desc: 'Regional efficiency up 4.2% YoY. Critical attention required at Food Court sectors.',
                  color: '#00FF9C',
                  tag: 'Positive'
                },
                { 
                   title: 'Operational Roadmap', 
                   steps: ['Real-time bottleneck monitoring', 'Food Court cluster deployment', 'Staff shift optimization'],
                   color: '#2F8CFF',
                   tag: 'Strategy'
                }
              ].map((insight, i) => (
                <div key={i} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border" style={{ color: insight.color, borderColor: `${insight.color}40`, backgroundColor: `${insight.color}10` }}>
                        {insight.tag}
                      </span>
                      <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/40 transition-colors" />
                   </div>
                   <h4 className="font-bold text-white mb-2 tracking-tight group-hover:text-[#00FF9C] transition-colors">{insight.title}</h4>
                   {insight.desc ? (
                     <p className="text-[11px] text-white/40 leading-relaxed italic">{insight.desc}</p>
                   ) : (
                     <ul className="space-y-2">
                        {insight.steps?.map((s, j) => (
                          <li key={j} className="text-[11px] text-white/40 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: insight.color }} />
                            {s}
                          </li>
                        ))}
                     </ul>
                   )}
                </div>
              ))}
           </div>
        </div>
      </main>
    </div>
  );
}
