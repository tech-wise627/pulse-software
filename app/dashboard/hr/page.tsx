'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardNav from '@/components/DashboardNav';
import StaffListView from '@/components/StaffListView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, FileText, BarChart3, Loader2 } from 'lucide-react';
import { HRStaff } from '@/lib/types';

export default function HRDashboard() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<HRStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStaff() {
      try {
        const res = await fetch('/api/staff');
        if (!res.ok) throw new Error('Failed to fetch staff');
        const data = await res.json();
        setStaffList(data);
      } catch (error) {
        console.error('Error fetching staff list:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStaff();
  }, []);

  const totalStaff = staffList.length;
  const activeStaff = staffList.filter(s => s.status === 'Active').length;
  const inactiveStaff = staffList.filter(s => s.status === 'Inactive').length;
  const suspendedStaff = staffList.filter(s => s.status === 'Suspended').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080C10] flex flex-col text-white">
        <DashboardNav />
        <main className="container mx-auto p-6 flex-1 flex justify-center items-center">
          <Loader2 className="h-8 w-8 text-[#00FF9C] animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C10] text-white selection:bg-[#00FF9C]/30 transition-colors duration-500">
      <DashboardNav />
      {/* Background ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/4 w-[800px] h-[500px] rounded-full bg-[#00FF9C] opacity-[0.02] blur-[120px] z-0" />
      <div className="pointer-events-none fixed bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] z-0" />
      
      <main className="relative z-10 container mx-auto py-10 px-6 max-w-7xl space-y-12">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#00FF9C]">Personnel Logistics</span>
             <span className="w-1 h-1 rounded-full bg-white/20" />
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Resource Command</span>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-4">
               H.R. <span className="text-white/20">/</span> MANAGEMENT
            </h1>
            <p className="text-white/40 max-w-xl text-lg leading-relaxed font-medium italic border-l-2 border-white/5 pl-6">
               Staff onboarding, real-time assignment monitoring, and personnel resource tracking.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative bg-[#0D1117] border border-white/5 rounded-[2rem] p-6 hover:border-[#00FF9C]/30 transition-all duration-500 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Users className="w-12 h-12 text-[#00FF9C]" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Total Workforce</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tighter text-white">{totalStaff}</span>
                  <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Registered</span>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative bg-[#0D1117] border border-white/5 rounded-[2rem] p-6 hover:border-green-500/30 transition-all duration-500 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Users className="w-12 h-12 text-green-500" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Active Staff</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tighter text-green-500">{activeStaff}</span>
                  <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Deployed</span>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative bg-[#0D1117] border border-white/5 rounded-[2rem] p-6 hover:border-slate-500/30 transition-all duration-500 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Users className="w-12 h-12 text-slate-500" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Inactive Staff</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tighter text-slate-400">{inactiveStaff}</span>
                  <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Off-Duty</span>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative bg-[#0D1117] border border-white/5 rounded-[2rem] p-6 hover:border-[#FF3B5C]/30 transition-all duration-500 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Users className="w-12 h-12 text-[#FF3B5C]" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Suspended</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tighter text-[#FF3B5C]">{suspendedStaff}</span>
                  <span className="text-[10px] text-[#FF3B5C]/50 font-bold uppercase tracking-widest">Restricted</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard/hr/add-staff" className="group block h-full">
            <div className="relative bg-[#0D1117] border border-white/5 hover:border-[#00FF9C]/40 rounded-[2rem] p-8 transition-all duration-500 overflow-hidden shadow-2xl h-full flex items-center justify-between">
               <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 w-32 h-32 bg-[#00FF9C]/10 rounded-full blur-[40px] group-hover:bg-[#00FF9C]/20 transition-all duration-500" />
               <div className="relative z-10">
                 <h3 className="text-2xl font-black tracking-tighter text-white mb-2 group-hover:text-[#00FF9C] transition-colors">INITIATE ONBOARDING</h3>
                 <p className="text-xs font-bold uppercase tracking-widest text-white/40">Register new personnel to the grid</p>
               </div>
               <div className="relative z-10 w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 group-hover:border-[#00FF9C]/30 flex items-center justify-center transition-all duration-500">
                 <UserPlus className="h-8 w-8 text-white/50 group-hover:text-[#00FF9C] transition-colors" />
               </div>
            </div>
          </Link>

          <Link href="/dashboard/hr/staff" className="group block h-full">
            <div className="relative bg-[#0D1117] border border-white/5 hover:border-blue-500/40 rounded-[2rem] p-8 transition-all duration-500 overflow-hidden shadow-2xl h-full flex items-center justify-between">
               <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] group-hover:bg-blue-500/20 transition-all duration-500" />
               <div className="relative z-10">
                 <h3 className="text-2xl font-black tracking-tighter text-white mb-2 group-hover:text-blue-400 transition-colors">PERSONNEL DIRECTORY</h3>
                 <p className="text-xs font-bold uppercase tracking-widest text-white/40">Access and manage full workforce roster</p>
               </div>
               <div className="relative z-10 w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 group-hover:border-blue-500/30 flex items-center justify-center transition-all duration-500">
                 <Users className="h-8 w-8 text-white/50 group-hover:text-blue-400 transition-colors" />
               </div>
            </div>
          </Link>
        </div>

        {/* Staff Overview */}
        <div className="bg-[#0D1117] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="border-b border-white/5 p-8 flex items-center justify-between bg-white/[0.02]">
            <div>
               <h3 className="text-xl font-black tracking-tighter text-white">STAFF ROSTER SUMMARY</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">Recent registry updates</p>
            </div>
            <Link href="/dashboard/hr/staff">
              <Button className="h-10 px-6 rounded-xl bg-white/[0.05] hover:bg-[#00FF9C]/20 border border-white/10 hover:border-[#00FF9C]/50 text-xs font-black uppercase tracking-widest text-white hover:text-[#00FF9C] transition-all">
                Access Full Register
              </Button>
            </Link>
          </div>
          <div className="p-8">
            <StaffListView
              staff={staffList.slice(0, 3)}
              onDelete={async (id) => {
                if (confirm('Are you sure you want to delete this staff member?')) {
                  try {
                    const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                      setStaffList(prev => prev.filter(s => s.id !== id));
                    }
                  } catch (error) {
                    console.error('Error deleting staff:', error);
                  }
                }
              }}
              onStatusChange={async (id, newStatus) => {
                try {
                  const res = await fetch(`/api/staff/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                  });
                  if (res.ok) {
                    setStaffList(prev => prev.map(s => s.id === id ? { ...s, status: newStatus as any } : s));
                  }
                } catch (error) {
                  console.error('Error updating status:', error);
                }
              }}
              onAddNew={() => {
                router.push('/dashboard/hr/add-staff');
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
