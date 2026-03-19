'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Zap, CheckCircle, Send, Radio } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Zone {
  id: string;
  name: string;
  highFillBins: number;
  status: 'normal' | 'high' | 'critical';
}

interface EmergencyCleanButtonProps {
  onEmergencyClean?: (zoneName: string) => void;
}

const mockZones: Zone[] = [
  { id: 'z1', name: 'Food Court', highFillBins: 4, status: 'critical' },
  { id: 'z2', name: 'Stage Area', highFillBins: 2, status: 'high' },
  { id: 'z3', name: 'Entrance', highFillBins: 0, status: 'normal' },
  { id: 'z4', name: 'Parking', highFillBins: 3, status: 'critical' },
  { id: 'z5', name: 'Restrooms', highFillBins: 1, status: 'normal' },
];

export default function EmergencyCleanButton({ onEmergencyClean }: EmergencyCleanButtonProps) {
  const [selectedZone, setSelectedZone] = useState('');
  const [isCleaningActive, setIsCleaningActive] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const criticalZones = mockZones.filter(z => z.status === 'critical');
  const highFillZones = mockZones.filter(z => z.highFillBins >= 3);

  const handleEmergencyClean = () => {
    if (!selectedZone) return;

    const zone = mockZones.find(z => z.id === selectedZone);
    if (!zone) return;

    setIsCleaningActive(true);
    setNotificationMessage(`⚠️ High Waste Alert\n${zone.name} requires immediate cleaning.\n\nNotification sent to ${3} nearby workers.`);

    setTimeout(() => {
      setShowSuccess(true);
      setIsCleaningActive(false);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);

    onEmergencyClean?.(zone.name);
  };

  return (
    <div className="space-y-6">
      {/* Auto-Detection Alert */}
      {highFillZones.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-[1.5rem] backdrop-blur-xl shadow-[0_0_30px_rgba(245,158,11,0.1)] flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-5 h-5 text-black" />
             </div>
             <div>
               <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500">Waste Congestion Detected</p>
               <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest mt-0.5">{highFillZones.length} Sectors exceeding nominal thresholds</p>
             </div>
          </div>
        </div>
      )}

      {/* Critical Zones Summary */}
      {criticalZones.length > 0 && (
        <div className="relative group overflow-hidden bg-[#FF3B5C]/5 border border-[#FF3B5C]/20 rounded-[2rem] p-8 backdrop-blur-md">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertTriangle className="w-16 h-16 text-[#FF3B5C]" />
          </div>
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-[#FF3B5C]/20 border border-[#FF3B5C]/30 flex items-center justify-center shrink-0">
               <Zap className="w-6 h-6 text-[#FF3B5C]" />
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[#FF3B5C]">Priority Intervention Required</h4>
                <p className="text-[10px] font-bold text-[#FF3B5C]/40 uppercase tracking-widest mt-1">Immediate purge protocol recommended</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {criticalZones.map((zone) => (
                  <div key={zone.id} className="flex items-center gap-3 bg-[#FF3B5C]/10 p-3 rounded-xl border border-[#FF3B5C]/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF3B5C] animate-ping" />
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{zone.name}</p>
                      <p className="text-[8px] font-bold text-[#FF3B5C] uppercase mt-1">{zone.highFillBins} Critical Units</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Clean Control */}
      <div className="relative group bg-white/[0.03] border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-md shadow-2xl transition-all hover:border-[#FF3B5C]/30">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FF3B5C]/10 border border-[#FF3B5C]/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#FF3B5C]" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Purge Dispatch</h3>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Emergency Unit Deployment</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Objective Sector</label>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="h-14 bg-white/[0.02] border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/[0.04] transition-all">
                <SelectValue placeholder="Designate Target..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0D1117] border-white/10 rounded-2xl overflow-hidden backdrop-blur-2xl">
                {mockZones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id} className="text-[10px] font-black uppercase tracking-widest text-white/60 focus:bg-white/5 focus:text-white">
                    <div className="flex items-center gap-3">
                      <span className={zone.status === 'critical' ? 'text-[#FF3B5C]' : 'text-white'}>{zone.name}</span>
                      {zone.highFillBins > 0 && (
                        <div className="px-2 py-0.5 rounded-full bg-red-400/10 border border-red-500/20 text-[7px] font-black text-red-500">
                          {zone.highFillBins} ALERT
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Zone Details */}
          {selectedZone && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {(() => {
                const zone = mockZones.find(z => z.id === selectedZone);
                return zone ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                       <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Sector ID</p>
                       <p className="text-[10px] font-black text-white uppercase tracking-widest">{zone.name}</p>
                    </div>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                       <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Threat Level</p>
                       <p className={`text-[10px] font-black uppercase tracking-widest ${zone.status === 'critical' ? 'text-[#FF3B5C]' : 'text-yellow-500'}`}>
                          {zone.status.toUpperCase()}
                       </p>
                    </div>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                       <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Sensor Overflow</p>
                       <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{zone.highFillBins} Devices</p>
                    </div>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                       <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Response Latency</p>
                       <p className="text-[10px] font-black text-[#00FF9C] uppercase tracking-widest">~4.2 Minutes</p>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Notification Preview */}
          {selectedZone && notificationMessage && (
            <div className="p-5 bg-white/[0.02] border border-amber-500/20 rounded-2xl animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/40" />
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-3 italic">Broadcast Preview</p>
              <p className="text-[10px] font-medium text-white/60 leading-relaxed uppercase tracking-widest">
                {notificationMessage}
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="space-y-4">
            <Button
              onClick={handleEmergencyClean}
              disabled={!selectedZone || isCleaningActive}
              className={`w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all transform active:scale-95 shadow-2xl ${
                isCleaningActive 
                  ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                  : 'bg-[#FF3B5C] hover:bg-[#FF3B5C]/90 text-white shadow-[0_0_30px_rgba(255,59,92,0.3)] hover:shadow-[0_0_50px_rgba(255,59,92,0.4)]'
              }`}
            >
              {isCleaningActive ? (
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                   UPDATING FIELD OPS...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                   <Send className="w-4 h-4" />
                   INITIATE EMERGENCY PURGE
                </div>
              )}
            </Button>

            {/* Success Message */}
            {showSuccess && (
              <div className="flex items-center justify-center gap-3 p-4 bg-[#00FF9C]/10 border border-[#00FF9C]/20 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                <CheckCircle className="w-4 h-4 text-[#00FF9C]" />
                <span className="text-[10px] font-black text-[#00FF9C] uppercase tracking-widest">Broadcast Acknowledged</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tactical Manual */}
      <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
           <Radio className="w-24 h-24 text-white" />
        </div>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-6">Execution Protocol</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {[
             { title: "Target Selection", desc: "Designate sector with critical saturation levels" },
             { title: "Delta Alert", desc: "Broadcast high-priority vectors to all available field units" },
             { title: "Response Priority", desc: "System auto-overrides secondary tasks for assigned personnel" },
             { title: "Validation", desc: "Sensors monitor fill-rate delta in real-time post-broadcast" }
           ].map((item, idx) => (
             <div key={idx} className="flex gap-4">
                <div className="text-[10px] font-black text-[#00FF9C] opacity-30 mt-0.5">0{idx + 1}</div>
                <div>
                   <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">{item.title}</p>
                   <p className="text-[9px] font-medium text-white/20 uppercase tracking-tighter italic leading-relaxed">{item.desc}</p>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
