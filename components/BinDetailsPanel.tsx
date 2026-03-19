'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IoTDevice } from '@/lib/types';
import { Battery, Droplet, User, Clock, BarChart3, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface BinDetailsProps {
  device: IoTDevice | null;
  staffList?: any[];
  onClose: () => void;
}

export default function BinDetailsPanel({ device, staffList = [], onClose }: BinDetailsProps) {
  const [assignedStaff, setAssignedStaff] = useState<any>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (!device) return;
    
    async function fetchAssignment() {
      setLoadingAssignment(true);
      try {
        const res = await fetch(`/api/assignments/single?device_id=${device!.id}`);
        if (res.ok) {
          const { assignment } = await res.json();
          if (assignment && assignment.staff) {
            setAssignedStaff(assignment.staff);
            setSelectedStaffId(assignment.staff.id);
          } else {
            setAssignedStaff(null);
            setSelectedStaffId('');
          }
        }
      } catch (err) {
        console.error('Failed to load assignment', err);
      }
      setLoadingAssignment(false);
    }
    
    fetchAssignment();
  }, [device]);

  const handleAssign = async () => {
    if (!device || !selectedStaffId) return;
    
    setIsAssigning(true);
    try {
      const res = await fetch('/api/assignments/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: device.id,
          staff_id: selectedStaffId,
          action: 'assign'
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to assign');
      }
      
      const assigned = staffList.find(s => s.id === selectedStaffId);
      if (assigned) setAssignedStaff(assigned);
    } catch (error: any) {
      console.error('Error assigning staff:', error);
      alert(`Failed to assign staff: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!device || !assignedStaff) return;
    
    setIsAssigning(true);
    try {
      const res = await fetch('/api/assignments/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: device.id,
          staff_id: assignedStaff.id,
          action: 'unassign'
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to unassign');
      }
      
      setAssignedStaff(null);
      setSelectedStaffId('');
    } catch (error: any) {
      console.error('Error unassigning staff:', error);
      alert(`Failed to unassign staff: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  if (!device) return null;

  // Mock cleaning history
  const cleaningHistory = [
    { time: '19:12', worker: 'Rahul', duration: 5 },
    { time: '18:40', worker: 'Amit', duration: 4 },
    { time: '18:02', worker: 'Rahul', duration: 6 },
    { time: '17:15', worker: 'Suresh', duration: 5 },
    { time: '16:30', worker: 'Amit', duration: 4 },
    { time: '15:45', worker: 'Rahul', duration: 5 },
  ];

  const totalCleans = cleaningHistory.length;
  const avgFillRate = 72;

  return (
    <div className="relative group bg-white/[0.03] border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-md shadow-2xl transition-all hover:border-[#00FF9C]/30 w-full">
      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-start justify-between bg-white/[0.01]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#00FF9C]/10 border border-[#00FF9C]/20 flex items-center justify-center">
            <Droplet className="w-6 h-6 text-[#00FF9C]" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">{device.name}</h3>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Asset ID: {device.device_id}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          ✕
        </button>
      </div>

      <div className="p-8 space-y-8">
        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 relative group/stat overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/stat:opacity-20 transition-opacity">
               <BarChart3 className="w-8 h-8 text-[#00FF9C]" />
            </div>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3">Saturation</p>
            <div className="space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#00FF9C] tracking-tighter">{device.fill_level}%</span>
                <span className="text-[10px] font-bold text-white/20 uppercase italic">Capacity</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00FF9C] to-[#00FF9C]/50 shadow-[0_0_15px_rgba(0,255,156,0.5)] transition-all duration-1000"
                  style={{ width: `${device.fill_level}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 relative group/stat overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/stat:opacity-20 transition-opacity">
               <Battery className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3">Potential</p>
            <div className="space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-yellow-500 tracking-tighter">{device.battery_level}%</span>
                <span className="text-[10px] font-bold text-white/20 uppercase italic">Charge</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all duration-1000"
                  style={{ width: `${device.battery_level}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operational Flow */}
        <div className="grid grid-cols-1 gap-4">
           {/* Assignment Section */}
           <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl group/item transition-all flex flex-col gap-4">
             <div className="flex items-center gap-4">
               <div className="w-2 h-2 rounded-full bg-[#00FF9C] shadow-[0_0_10px_rgba(0,255,156,0.5)]" />
               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Unit Lead Assignment</span>
             </div>
             
             {loadingAssignment ? (
               <div className="flex items-center gap-2 text-white/40">
                 <Loader2 className="w-4 h-4 animate-spin" />
                 <span className="text-xs">Fetching assignment...</span>
               </div>
             ) : assignedStaff ? (
               <div className="flex flex-col gap-3">
                 <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                   <div className="flex items-center gap-3">
                     <User className="w-4 h-4 text-[#00FF9C]" />
                     <div>
                       <p className="text-xs font-black text-white uppercase tracking-widest">{assignedStaff.full_name || assignedStaff.first_name}</p>
                       <p className="text-[9px] text-white/40 uppercase tracking-widest">{assignedStaff.role}</p>
                     </div>
                   </div>
                   <Button 
                     variant="ghost" 
                     size="sm"
                     onClick={handleUnassign}
                     disabled={isAssigning}
                     className="text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-500 hover:bg-red-500/10 h-8"
                   >
                     {isAssigning ? <Loader2 className="w-3 h-3 animate-spin" /> : 'UNASSIGN'}
                   </Button>
                 </div>
               </div>
             ) : (
               <div className="flex gap-2">
                 <div className="flex-1">
                   <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                     <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white text-xs">
                       <SelectValue placeholder="Select Staff Member" />
                     </SelectTrigger>
                     <SelectContent className="bg-[#0D1117] border-white/10">
                       {staffList.map(staff => (
                         <SelectItem key={staff.id} value={staff.id} className="text-white text-xs hover:bg-white/10">
                           {staff.first_name} {staff.last_name} ({staff.role})
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <Button 
                   onClick={handleAssign}
                   disabled={!selectedStaffId || isAssigning}
                   className="h-10 bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black font-black text-[9px] uppercase tracking-widest px-6"
                 >
                   {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ASSIGN'}
                 </Button>
               </div>
             )}
           </div>

           <div className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl group/item hover:bg-white/[0.04] transition-all">
             <div className="flex items-center gap-4">
               <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Sector Allocation</span>
             </div>
             <span className="text-[10px] font-black text-white uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/10 group-hover/item:border-blue-500/30 transition-all">Food Court</span>
           </div>
        </div>

        {/* Tactical History */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Clock className="w-4 h-4 text-white/20" />
               <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Purge History</h4>
            </div>
            <span className="text-[9px] font-black text-white/40 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-widest">{totalCleans} Ops Today</span>
          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {cleaningHistory.map((clean, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-white/[0.01] rounded-xl border border-white/[0.03] group/history hover:border-white/10 hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest w-12">{clean.time}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest italic">{clean.worker}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="text-[8px] font-black text-white/20 uppercase tracking-tighter">Dur</div>
                   <span className="text-[10px] font-black text-white/60 lowercase tracking-widest">{clean.duration}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Delta */}
        <div className="pt-2 grid grid-cols-2 gap-4">
           <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-1">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Daily Cycle</span>
              <span className="text-[12px] font-black text-[#00FF9C] uppercase tracking-[0.1em]">{totalCleans} Cleans</span>
           </div>
           <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-1">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Saturation Delta</span>
              <span className="text-[12px] font-black text-yellow-500 uppercase tracking-[0.1em]">{avgFillRate}% Avg</span>
           </div>
        </div>
      </div>
    </div>
  );
}
