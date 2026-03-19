'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import DashboardNav from '@/components/DashboardNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, Calendar, Mail, Phone, User, Loader2 } from 'lucide-react';
import { mockStaffDocuments } from '@/lib/mock-data';
import { HRStaff } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StaffProfilePage({ params }: PageProps) {
  const [param, setParam] = useState<string | null>(null);
  const [staff, setStaff] = useState<HRStaff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Unwrap params promise
    params.then(p => setParam(p.id));
  }, [params]);

  useEffect(() => {
    if (!param) return;
    
    async function fetchStaff() {
      try {
        const res = await fetch(`/api/staff/${param}`);
        if (!res.ok) throw new Error('Failed to fetch staff details');
        const data = await res.json();
        setStaff(data);
      } catch (err: any) {
        console.error('Error fetching staff member:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStaff();
  }, [param]);

  const staffDocs = useMemo(() => {
    if (!param) return [];
    return mockStaffDocuments.filter(d => d.staff_id === param);
  }, [param]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return <Badge className="cursor-pointer bg-[#00FF9C]/10 hover:bg-[#00FF9C]/20 text-[#00FF9C] border border-[#00FF9C]/30 uppercase tracking-widest text-[9px] font-black h-6 px-3">Active</Badge>;
      case 'Inactive': return <Badge className="cursor-pointer bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border border-slate-500/30 uppercase tracking-widest text-[9px] font-black h-6 px-3">Inactive</Badge>;
      case 'Suspended': return <Badge className="cursor-pointer bg-[#FF3B5C]/10 hover:bg-[#FF3B5C]/20 text-[#FF3B5C] border border-[#FF3B5C]/30 uppercase tracking-widest text-[9px] font-black h-6 px-3">Suspended</Badge>;
      default: return <Badge className="cursor-pointer bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border border-slate-500/30 uppercase tracking-widest text-[9px] font-black h-6 px-3">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080C10] text-white flex flex-col">
        <DashboardNav />
        <main className="container mx-auto p-6 flex-1 flex flex-col justify-center items-center">
           <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse mb-4">
              <div className="w-4 h-4 border-2 border-[#00FF9C] border-t-transparent rounded-full animate-spin" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-white/40 animate-pulse">Retrieving identity data...</p>
        </main>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="min-h-screen bg-[#080C10] text-white flex flex-col">
        <DashboardNav />
        <main className="container mx-auto p-6 flex-1 flex flex-col justify-center items-center">
          <div className="text-center py-12">
            <p className="text-[#FF3B5C] font-black tracking-widest uppercase text-sm mb-4">Unit not found in registry</p>
            <Link href="/dashboard/hr/staff">
              <Button className="h-10 px-6 rounded-xl bg-white/[0.05] hover:bg-[#00FF9C]/20 border border-white/10 hover:border-[#00FF9C]/50 text-xs font-black uppercase tracking-widest text-white hover:text-[#00FF9C] transition-all">
                Return to Directory
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C10] text-white selection:bg-[#00FF9C]/30 transition-colors duration-500">
      <DashboardNav />
      {/* Background ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/4 w-[800px] h-[500px] rounded-full bg-[#00FF9C] opacity-[0.02] blur-[120px] z-0" />
      
      <main className="relative z-10 container mx-auto py-10 px-6 max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <Link href="/dashboard/hr/staff">
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 text-white/50 hover:text-white hover:bg-white/[0.08] transition-all">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#00FF9C]">Personnel Protocol</span>
             <span className="w-1 h-1 rounded-full bg-white/20" />
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Identity Visualizer</span>
          </div>
        </div>

        {/* Staff Header Card */}
        <div className="bg-[#0D1117] border border-white/5 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-[#00FF9C]/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative group">
               {staff.photo_url ? (
                 <img
                   src={staff.photo_url}
                   alt={`${staff.first_name} ${staff.last_name}`}
                   className="w-40 h-40 rounded-[2rem] object-cover border border-[#00FF9C]/30 shadow-[0_0_20px_rgba(0,255,156,0.15)] group-hover:border-[#00FF9C]/60 transition-colors duration-500"
                 />
               ) : (
                 <div className="w-40 h-40 rounded-[2rem] bg-white/[0.02] flex items-center justify-center border border-dashed border-white/20 group-hover:border-[#00FF9C]/40 transition-colors duration-500">
                   <User className="h-16 w-16 text-white/20" />
                 </div>
               )}
               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                  {getStatusBadge(staff.status)}
               </div>
            </div>

            <div className="flex-1 text-center md:text-left pt-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                 <div>
                   <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-2">
                     {staff.first_name} {staff.last_name}
                   </h2>
                   <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#00FF9C]">{staff.role}</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#00FF9C]/10 flex items-center justify-center border border-[#00FF9C]/20">
                     <Mail className="h-4 w-4 text-[#00FF9C]" />
                  </div>
                  <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Comms ID (Email)</p>
                     <p className="text-sm font-medium text-white/80 font-mono truncate">{staff.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                     <Phone className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Secure Line (Phone)</p>
                     <p className="text-sm font-medium text-white/80 font-mono truncate">{staff.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                     <Calendar className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Activation Date</p>
                     <p className="text-sm font-medium text-white/80 font-mono truncate">{new Date(staff.hire_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                     <span className="text-orange-400 text-lg">📍</span>
                  </div>
                  <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Designated Division</p>
                     <p className="text-sm font-medium text-white/80 truncate">{staff.department}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Identity Metrics */}
          <div className="bg-[#0D1117] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl">
            <div className="border-b border-white/5 p-6 bg-white/[0.02]">
              <h3 className="text-lg font-black tracking-tighter text-white uppercase">Identity Metrics</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/[0.03]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Date of Origin</p>
                <p className="text-sm font-medium text-white/80 font-mono">{new Date(staff.date_of_birth).toLocaleDateString()}</p>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/[0.03]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Comms Link (Email)</p>
                <p className="text-sm font-medium text-white/80 font-mono">{staff.email}</p>
              </div>
              <div className="flex justify-between items-center py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Comms Link (Phone)</p>
                <p className="text-sm font-medium text-white/80 font-mono">{staff.phone}</p>
              </div>
            </div>
          </div>

          {/* Operational Status */}
          <div className="bg-[#0D1117] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl">
            <div className="border-b border-white/5 p-6 bg-white/[0.02]">
              <h3 className="text-lg font-black tracking-tighter text-white uppercase">Operational Status</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/[0.03]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Designation</p>
                <p className="text-sm font-medium text-white/80">{staff.role}</p>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/[0.03]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Division Path</p>
                <p className="text-sm font-medium text-white/80">{staff.department}</p>
              </div>
              <div className="flex justify-between items-center py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Active Since</p>
                <p className="text-sm font-medium text-white/80 font-mono">{new Date(staff.hire_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        {(staff.emergency_contact || staff.emergency_phone) && (
          <div className="bg-[#0D1117] border border-[#FF3B5C]/10 rounded-[2rem] overflow-hidden shadow-[0_0_30px_rgba(255,59,92,0.02)]">
            <div className="border-b border-[#FF3B5C]/10 p-6 bg-white/[0.02] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF3B5C] animate-pulse" />
              <h3 className="text-lg font-black tracking-tighter text-[#FF3B5C] uppercase">Emergency Protocol Override</h3>
            </div>
            <div className="p-6 space-y-4">
              {staff.emergency_contact && (
                <div className="flex justify-between items-center py-2 border-b border-white/[0.02]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Primary Point of Contact</p>
                  <p className="text-sm font-medium text-white/80">{staff.emergency_contact}</p>
                </div>
              )}
              {staff.emergency_phone && (
                <div className="flex justify-between items-center py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Emergency Comms Channel</p>
                  <p className="text-sm font-medium text-white/80 font-mono">{staff.emergency_phone}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="bg-[#0D1117] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="border-b border-white/5 p-6 bg-white/[0.02] flex items-center justify-between">
            <h3 className="text-lg font-black tracking-tighter text-white uppercase">Secured Documents <span className="opacity-40">({staffDocs.length})</span></h3>
            <Button className="h-8 px-4 rounded-lg bg-white/[0.05] hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/50 text-[10px] font-black uppercase tracking-widest text-white hover:text-blue-400 transition-all">
              Upload New
            </Button>
          </div>
          <div className="p-6">
            {staffDocs.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {staffDocs.map((doc) => (
                  <div key={doc.id} className="group flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-blue-500/30 group-hover:bg-blue-500/10 transition-colors">
                        <FileText className="h-4 w-4 text-white/50 group-hover:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white tracking-tight truncate group-hover:text-blue-200 transition-colors">{doc.document_name}</p>
                        <div className="flex gap-2 mt-1">
                           <span className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[8px] font-black uppercase tracking-widest text-white/40">{doc.document_type}</span>
                           <span className="text-[9px] font-semibold text-white/30 truncate mt-0.5">Updated {new Date(doc.upload_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-10 h-10 rounded-xl text-white/50 hover:bg-blue-500/20 hover:text-blue-400 ml-4 opacity-0 group-hover:opacity-100 transition-all border border-transparent group-hover:border-blue-500/30"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-8 w-8 text-white/10 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">No classified documents found</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end pt-4">
          <Button variant="outline" className="h-12 px-8 rounded-xl bg-transparent border-white/10 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/[0.05] transition-all">
            Modify Blueprint
          </Button>
          <Button className="h-12 px-8 rounded-xl bg-[#FF3B5C]/10 hover:bg-[#FF3B5C]/20 border border-[#FF3B5C]/30 text-[10px] font-black uppercase tracking-widest text-[#FF3B5C] transition-all">
            Decommission Unit
          </Button>
        </div>
      </main>
    </div>
  );
}
