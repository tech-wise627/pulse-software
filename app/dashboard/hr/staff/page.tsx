'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardNav from '@/components/DashboardNav';
import StaffListView from '@/components/StaffListView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';
import { HRStaff } from '@/lib/types';

export default function StaffListPage() {
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

  return (
    <div className="min-h-screen bg-[#080C10] text-white selection:bg-[#00FF9C]/30 transition-colors duration-500">
      <DashboardNav />
      {/* Background ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/4 w-[800px] h-[500px] rounded-full bg-blue-500 opacity-[0.02] blur-[120px] z-0" />
      
      <main className="relative z-10 container mx-auto py-10 px-6 max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4 mb-2">
              <Link href="/dashboard/hr">
                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 text-white/50 hover:text-white hover:bg-white/[0.08] transition-all">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-white uppercase">Personnel Directory</h1>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-14">View and manage all registered operational units</p>
          </div>
          <Link href="/dashboard/hr/add-staff">
            <Button className="h-12 px-6 rounded-xl bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(0,255,156,0.2)] flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Register New Unit
            </Button>
          </Link>
        </div>

        {/* Staff List */}
        <div className="bg-[#0D1117] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="border-b border-white/5 p-8 flex items-center justify-between bg-white/[0.02]">
            <div>
               <h3 className="text-xl font-black tracking-tighter text-white">ACTIVE ROSTER</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">Complete personnel database</p>
            </div>
          </div>
          <div className="p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                 <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse mb-4">
                    <div className="w-4 h-4 border-2 border-[#00FF9C] border-t-transparent rounded-full animate-spin" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/40 animate-pulse">Accessing directory nodes...</p>
              </div>
            ) : (
              <StaffListView
                staff={staffList}
                onDelete={async (id) => {
                  if (confirm('Are you sure you want to delete this staff member?')) {
                    try {
                      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
                      if (res.ok) {
                        setStaffList(prev => prev.filter(s => s.id !== id));
                      } else {
                        const errorData = await res.json();
                        alert(`Failed to delete: ${errorData.error}`);
                      }
                    } catch (error) {
                      console.error('Error deleting staff:', error);
                      alert('Network error while deleting staff');
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
                    } else {
                      const errorData = await res.json();
                      alert(`Failed to update status: ${errorData.error}`);
                    }
                  } catch (error) {
                    console.error('Error updating status:', error);
                    alert('Network error while updating status');
                  }
                }}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
