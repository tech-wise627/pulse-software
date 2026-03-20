'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Zap, LogOut, Menu } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function DashboardNav() {
  const router = useRouter();
  const pathname = usePathname();

  const getTitle = () => {
    if (pathname?.includes('/manager')) return 'Manager Dashboard';
    if (pathname?.includes('/admin/events')) return 'Events';
    if (pathname?.includes('/admin')) return 'Admin Dashboard';
    if (pathname?.includes('/hr')) return 'HR Management';
    if (pathname?.includes('/staff')) return 'Staff Dashboard';
    return 'Dashboard';
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#080C10]/90 backdrop-blur-xl">
      <div className="flex h-14 max-w-full items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push('/dashboard')}
        >
          <div className="w-6 h-6 rounded-md bg-[#00FF9C] flex items-center justify-center shrink-0">
            <Zap className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xs sm:text-sm text-white tracking-tight">PULSE</span>
          <span className="text-white/20 mx-1 hidden sm:inline">·</span>
          <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest truncate hidden sm:inline-block max-w-[150px]">{getTitle()}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors">
                <Menu className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 bg-[#0D1117] border-white/10 text-white/80"
            >
              <DropdownMenuItem
                onClick={() => router.push('/')}
                className="hover:bg-white/5 focus:bg-white/5 cursor-pointer text-red-400 focus:text-red-400 gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
