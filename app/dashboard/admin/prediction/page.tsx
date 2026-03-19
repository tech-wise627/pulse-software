'use client';

import { useState } from 'react';
import DashboardNav from '@/components/DashboardNav';
import EventPredictionForm from '@/components/EventPredictionForm';
import MetricCards from '@/components/MetricCards';
import BinPlacementCard from '@/components/BinPlacementCard';
import SimilarEventsPanel from '@/components/SimilarEventsPanel';
import WasteVsCrowdChart from '@/components/WasteVsCrowdChart';
import BinsRequiredChart from '@/components/BinsRequiredChart';
import PeakWasteTimeline from '@/components/PeakWasteTimeline';
import { Button } from '@/components/ui/button';
import { predictEventResources, PredictionResult, EventType } from '@/lib/prediction-engine';
import { Download, ArrowLeft, Lightbulb, Sparkles, FileText, Settings2 } from 'lucide-react';
import Link from 'next/link';

export default function EventPredictionPage() {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState<EventType>('conference');

  const handlePredict = async (data: any) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setEventType(data.eventType);
      const prediction = predictEventResources({
        eventName: data.eventName,
        eventType: data.eventType,
        expectedAttendees: data.expectedAttendees,
        eventDuration: data.eventDuration,
        eventDate: data.eventDate,
        eventLocation: data.eventLocation,
      });
      setResult(prediction);
    } catch (error) {
      console.error('[Prediction] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;

    const reportContent = `
EVENT PREDICTION REPORT
Generated: ${new Date().toLocaleString()}

EVENT DETAILS
============
Name: ${result.eventName}
Expected Attendees: ${result.expectedAttendees.toLocaleString()}
Duration: ${result.eventDuration} hours

PREDICTIONS
===========
Peak Waste: ${result.predictions.peakWaste} kg
Total Waste: ${result.predictions.totalWaste} kg
Required Bins: ${result.predictions.requiredBins}
Suggested Bin Capacity: ${result.predictions.suggestedBinCapacity}L
Required Staff: ${result.predictions.requiredStaff}
Cleaning Cycles: ${result.predictions.cleaningCycles}
Estimated Collections: ${result.predictions.estimatedCollections}

METRICS
=======
Waste per Attendee: ${result.metrics.wastePerAttendee} kg
Waste per Hour: ${result.metrics.wastePerHour} kg
Bin Fill Rate: ${result.metrics.binFillRate}%/hour

CONFIDENCE SCORES
=================
Waste Confidence: ${result.confidence.wasteConfidence}%
Bins Confidence: ${result.confidence.binsConfidence}%
Staff Confidence: ${result.confidence.staffConfidence}%

RECOMMENDATIONS
===============
${result.recommendations.binPlacement.map(r => `• ${r}`).join('\n')}

Staff Strategy: ${result.recommendations.staffStrategy}
Collection Schedule: ${result.recommendations.collectionSchedule}

Contingencies:
${result.recommendations.contingencies.map(c => `• ${c}`).join('\n')}
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent));
    element.setAttribute('download', `prediction-${result.eventName}-${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-[#080C10] text-white selection:bg-[#00FF9C]/30 transition-colors duration-500">
      <DashboardNav />
      {/* Dynamic background glow based on result state */}
      <div className={`pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[120px] z-0 transition-all duration-1000 ${result ? 'bg-[#00FF9C] opacity-[0.04]' : 'bg-blue-500 opacity-[0.03]'}`} />

      <main className="container mx-auto p-6 space-y-8 relative z-10 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
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
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00FF9C]">AI Engine</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Resource planning</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                Event Prediction <span className="inline-flex py-0.5 px-2 rounded-md bg-[#00FF9C]/10 text-[#00FF9C] text-[10px] font-bold uppercase">v2.4 Live</span>
              </h1>
              <p className="text-white/40 mt-1 max-w-xl">
                Leverage high-fidelity waste modeling to optimize bin deployment and staff allocation for upcoming spatial events.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {result && (
              <Button
                onClick={downloadReport}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/90 font-medium px-6 h-11 transition-all rounded-xl"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Intelligence
              </Button>
            )}
            <Button
              className="bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black font-bold tracking-tight px-6 h-11 transition-all shadow-[0_0_20px_rgba(0,255,156,0.15)] rounded-xl"
              onClick={() => setResult(null)}
              disabled={!result}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              New Simulation
            </Button>
          </div>
        </div>

        {!result ? (
          <div className="max-w-4xl mx-auto pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="p-1 rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-transparent shadow-2xl">
              <div className="bg-[#0D1117] rounded-[22px] overflow-hidden border border-white/5 p-2">
                 <EventPredictionForm onPredict={handlePredict} loading={loading} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-[#00FF9C]/10 flex items-center justify-center mb-4 border border-[#00FF9C]/20">
                  <Sparkles className="w-6 h-6 text-[#00FF9C]" />
                </div>
                <h4 className="font-bold text-white mb-2">Predictive Logic</h4>
                <p className="text-xs text-white/40 leading-relaxed">Advanced algorithms analyze historical crowd flow and waste generation patterns.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                  <Lightbulb className="w-6 h-6 text-blue-400" />
                </div>
                <h4 className="font-bold text-white mb-2">Resource Insights</h4>
                <p className="text-xs text-white/40 leading-relaxed">Get precise numbers on bins, staff, and collection cycles needed for 100% event efficiency.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <h4 className="font-bold text-white mb-2">Tactical Reports</h4>
                <p className="text-xs text-white/40 leading-relaxed">Download full deployment strategy reports for field managers and operational teams.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-1000">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00FF9C]/10 border border-[#00FF9C]/20 w-fit">
               <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9C] animate-pulse" />
               <span className="text-[10px] font-bold text-[#00FF9C] uppercase tracking-wider">Simulation Ready: {result.eventName}</span>
            </div>

            {/* Metric Cards overhaul */}
            <MetricCards result={result} />

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Bin Placement overhauled via component edit next */}
              <div className="p-1 rounded-3xl bg-white/5 border border-white/10">
                <BinPlacementCard result={result} />
              </div>

               {/* Similar Events overhauled via component edit next */}
              <div className="p-1 rounded-3xl bg-white/5 border border-white/10">
                <SimilarEventsPanel eventType={eventType} attendees={result.expectedAttendees} />
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="rounded-3xl bg-[#0D1117] border border-white/5 p-6 hover:border-[#00FF9C]/20 transition-all duration-500 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <BarChart3 className="w-24 h-24 text-[#00FF9C]" />
                </div>
                <WasteVsCrowdChart
                  attendees={result.expectedAttendees}
                  duration={result.eventDuration}
                  peakWaste={result.predictions.peakWaste}
                  totalWaste={result.predictions.totalWaste}
                />
              </div>
              <div className="rounded-3xl bg-[#0D1117] border border-white/5 p-6 hover:border-blue-500/20 transition-all duration-500 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Activity className="w-24 h-24 text-blue-500" />
                </div>
                <PeakWasteTimeline
                  duration={result.eventDuration}
                  peakWaste={result.predictions.peakWaste}
                  totalWaste={result.predictions.totalWaste}
                />
              </div>
            </div>

            <div className="rounded-3xl bg-[#0D1117] border border-white/5 p-8 hover:border-purple-500/20 transition-all duration-500 overflow-hidden relative group">
               <BinsRequiredChart
                attendees={result.expectedAttendees}
                requiredBins={result.predictions.requiredBins}
                binCapacity={result.predictions.suggestedBinCapacity}
                eventType={eventType}
              />
            </div>
            
            <div className="flex justify-center pt-8 pb-12">
               <Button 
                onClick={() => setResult(null)}
                variant="ghost"
                className="text-white/30 hover:text-white hover:bg-white/5 gap-2 px-8 py-6 rounded-2xl border border-transparent hover:border-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Initialize New Deployment Simulator
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
