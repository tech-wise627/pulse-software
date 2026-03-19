'use client';

import { useState } from 'react';
import { Search, X, Filter, ChevronDown, Calendar, MapPin, Clock, ListFilter } from 'lucide-react';

interface FilterPanelProps {
  events: any[];
  onFilterChange: (filters: any) => void;
}

export default function FilterPanel({ events, onFilterChange }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    eventName: '',
    location: '',
    dateFrom: '',
    dateTo: '',
    timeFilter: 'all',
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      eventName: '',
      location: '',
      dateFrom: '',
      dateTo: '',
      timeFilter: 'all',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const locations = [...new Set(events.map(e => e.city))].filter(Boolean);
  const activeFilterCount = Object.values(filters).filter(v => v && v !== 'all').length;

  const inputClasses = "bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00FF9C]/50 focus:bg-white/[0.05] transition-all";
  const labelClasses = "text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2 flex items-center gap-2";

  return (
    <div className="w-full px-6 py-4 md:py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-3 text-white/60 hover:text-white transition-all group"
          >
            <div className={`p-2 rounded-lg border transition-all ${isExpanded ? 'bg-[#00FF9C]/10 border-[#00FF9C]/40 text-[#00FF9C]' : 'bg-white/5 border-white/10 group-hover:border-white/20'}`}>
              <ListFilter className="h-4 w-4" />
            </div>
            <span className="font-bold tracking-tight">Intelligence Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 bg-[#00FF9C] text-black text-[10px] font-black rounded-full shadow-[0_0_10px_rgba(0,255,156,0.3)]">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          <div className="h-4 w-px bg-white/10 hidden md:block" />

          <div className="hidden lg:flex items-center gap-4 text-[11px] font-medium text-white/20">
             <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#00FF9C]" /> {events.length} Historical Nodes</span>
             <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {locations.length} Global Regions</span>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={handleReset}
            className="text-[10px] font-black uppercase tracking-widest text-[#FF3B5C]/60 hover:text-[#FF3B5C] transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FF3B5C]/5 border border-[#FF3B5C]/10"
          >
            <X className="h-3 w-3" />
            Clear Operations
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500">
          {/* Event Name Filter */}
          <div className="space-y-2">
            <label className={labelClasses}>
              <Search className="w-3 h-3" /> Search Vector
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Event identifier..."
                value={filters.eventName}
                onChange={(e) => handleFilterChange('eventName', e.target.value)}
                className={`${inputClasses} w-full pl-10`}
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
            </div>
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <label className={labelClasses}>
              <MapPin className="w-3 h-3" /> Spatial Region
            </label>
            <div className="relative">
               <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className={`${inputClasses} w-full appearance-none`}
              >
                <option value="">All Terrains</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc} className="bg-[#080C10]">
                    {loc}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 pointer-events-none" />
            </div>
          </div>

          {/* Date Filter */}
          <div className="space-y-2">
            <label className={labelClasses}>
              <Calendar className="w-3 h-3" /> Temporal window
            </label>
            <div className="flex items-center gap-2">
               <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className={`${inputClasses} flex-1 text-xs`}
              />
              <span className="text-white/20">/</span>
               <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className={`${inputClasses} flex-1 text-xs`}
              />
            </div>
          </div>

          {/* Time Filter */}
          <div className="space-y-2">
            <label className={labelClasses}>
              <Clock className="w-3 h-3" /> Intelligence Span
            </label>
            <div className="relative">
              <select
                value={filters.timeFilter}
                onChange={(e) => handleFilterChange('timeFilter', e.target.value)}
                className={`${inputClasses} w-full appearance-none`}
              >
                <option value="all">Unrestricted</option>
                <option value="week">Cycle: 07 Earth Days</option>
                <option value="month">Cycle: 30 Earth Days</option>
                <option value="year">Cycle: Annual Loop</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 pointer-events-none" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
