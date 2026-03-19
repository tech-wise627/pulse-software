'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Eye, Edit, Trash2 } from 'lucide-react';
import { HRStaff } from '@/lib/types';

interface StaffListViewProps {
  staff: HRStaff[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: string) => void;
  onAddNew?: () => void;
}

export default function StaffListView({ staff, onEdit, onDelete, onStatusChange, onAddNew }: StaffListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive' | 'Suspended'>('All');

  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const matchesSearch = (s.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                           (s.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                           (s.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                           (s.phone || '').includes(searchQuery);
      
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [staff, searchQuery, statusFilter]);

  const getStatusBadge = (status: string, id: string) => {
    const badge = (() => {
      switch (status) {
        case 'Active': return <Badge className="cursor-pointer bg-[#00FF9C]/10 hover:bg-[#00FF9C]/20 text-[#00FF9C] border border-[#00FF9C]/30 uppercase tracking-widest text-[9px] font-black h-6 px-3">Active</Badge>;
        case 'Inactive': return <Badge className="cursor-pointer bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border border-slate-500/30 uppercase tracking-widest text-[9px] font-black h-6 px-3">Inactive</Badge>;
        case 'Suspended': return <Badge className="cursor-pointer bg-[#FF3B5C]/10 hover:bg-[#FF3B5C]/20 text-[#FF3B5C] border border-[#FF3B5C]/30 uppercase tracking-widest text-[9px] font-black h-6 px-3">Suspended</Badge>;
        default: return <Badge className="cursor-pointer bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border border-slate-500/30 uppercase tracking-widest text-[9px] font-black h-6 px-3">{status}</Badge>;
      }
    })();

    if (!onStatusChange) return badge;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {badge}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#0D1117] border-white/10 rounded-xl overflow-hidden backdrop-blur-xl">
          <DropdownMenuItem onClick={() => onStatusChange(id, 'Active')} className="text-[10px] font-black uppercase tracking-widest text-white/60 focus:bg-white/5 focus:text-[#00FF9C] cursor-pointer">Active</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange(id, 'Inactive')} className="text-[10px] font-black uppercase tracking-widest text-white/60 focus:bg-white/5 focus:text-slate-300 cursor-pointer">Inactive</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange(id, 'Suspended')} className="text-[10px] font-black uppercase tracking-widest text-white/60 focus:bg-white/5 focus:text-[#FF3B5C] cursor-pointer">Suspended</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 w-full max-w-sm">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-[#00FF9C] transition-colors" />
            <Input
              placeholder="Search personnel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-white/[0.03] border-white/10 rounded-[1.25rem] text-sm text-white placeholder-white/30 focus:border-[#00FF9C]/50 focus:ring-1 focus:ring-[#00FF9C]/50 transition-all shadow-inner"
            />
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {(['All', 'Active', 'Inactive', 'Suspended'] as const).map((status) => (
            <Button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`h-10 px-6 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === status 
                  ? 'bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black shadow-[0_0_20px_rgba(0,255,156,0.3)]' 
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/50 border border-white/10'
              }`}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid gap-4">
        {filteredStaff.length > 0 ? (
          filteredStaff.map((staffMember) => (
            <div key={staffMember.id} className="group relative bg-[#0D1117] border border-white/5 hover:border-white/20 rounded-2xl p-4 transition-all duration-300 overflow-hidden shadow-xl flex items-center justify-between">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00FF9C]/0 via-[#00FF9C]/0 to-[#00FF9C]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex items-center gap-4 flex-1">
                {staffMember.photo_url ? (
                  <img
                    src={staffMember.photo_url}
                    alt={staffMember.first_name}
                    className="w-14 h-14 rounded-2xl object-cover border border-white/10 group-hover:border-[#00FF9C]/30 transition-colors"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 group-hover:border-[#00FF9C]/30 flex items-center justify-center transition-colors">
                    <span className="text-xl opacity-50">👤</span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-bold text-white tracking-tight">{staffMember.first_name} {staffMember.last_name}</p>
                    <div className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/50">
                      {staffMember.role}
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-white/40 mb-1">{staffMember.department}</p>
                  <div className="flex gap-4 text-[10px] items-center text-white/30 font-medium font-mono">
                    <span className="hover:text-white/70 transition-colors">✉️ {staffMember.email}</span>
                    <span className="hover:text-white/70 transition-colors">📱 {staffMember.phone}</span>
                  </div>
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-4">
                {getStatusBadge(staffMember.status, staffMember.id)}
                <div className="w-[1px] h-8 bg-white/10 mx-2" />
                <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Link href={`/dashboard/hr/staff/${staffMember.id}`}>
                    <Button size="icon" variant="ghost" className="w-9 h-9 rounded-xl text-white/50 hover:text-[#00FF9C] hover:bg-[#00FF9C]/10">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-9 h-9 rounded-xl text-white/50 hover:text-[#FF3B5C] hover:bg-[#FF3B5C]/10"
                    onClick={() => onDelete?.(staffMember.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-[#0D1117] border border-white/5 rounded-2xl p-12 text-center shadow-xl">
             <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-white/30" />
             </div>
             <p className="text-sm font-bold text-white/50 tracking-tight mb-6">No personnel records found.</p>
             <Button onClick={onAddNew} className="h-10 px-8 rounded-xl bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(0,255,156,0.2)]">
               Register First Unit
             </Button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 text-center">
        Showing directory slice <span className="text-white">[{filteredStaff.length}/{staff.length}]</span> units total
      </p>
    </div>
  );
}
