'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calendar, Users, Clock, MapPin, Activity, Sparkles, ChevronRight } from 'lucide-react';
import { EventType } from '@/lib/prediction-engine';

interface EventPredictionFormProps {
  onPredict: (data: {
    eventName: string;
    eventType: EventType;
    expectedAttendees: number;
    eventDuration: number;
    eventDate: string;
    eventLocation: string;
  }) => void;
  loading?: boolean;
}

export default function EventPredictionForm({ onPredict, loading = false }: EventPredictionFormProps) {
  const [formData, setFormData] = useState({
    eventName: '',
    eventType: 'conference' as EventType,
    expectedAttendees: 5000,
    eventDuration: 8,
    eventDate: new Date().toISOString().split('T')[0],
    eventLocation: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.eventName.trim()) newErrors.eventName = 'Event name is required';
    if (formData.expectedAttendees < 100) newErrors.expectedAttendees = 'Minimum 100 attendees';
    if (formData.expectedAttendees > 1000000) newErrors.expectedAttendees = 'Maximum 1,000,000 attendees';
    if (formData.eventDuration < 1) newErrors.eventDuration = 'Minimum 1 hour';
    if (formData.eventDuration > 72) newErrors.eventDuration = 'Maximum 72 hours';
    if (!formData.eventLocation.trim()) newErrors.eventLocation = 'Location is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onPredict(formData);
  };

  const inputClasses = "w-full px-4 py-3 bg-white/[0.03] border border-white/10 text-white placeholder-white/20 rounded-xl focus:border-[#00FF9C]/50 focus:bg-white/[0.05] focus:outline-none transition-all duration-300";
  const labelClasses = "text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2";

  return (
    <div className="w-full bg-[#0D1117] relative">
      <div className="p-8 md:p-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[#00FF9C]/10 border border-[#00FF9C]/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#00FF9C]" />
             </div>
             <div>
               <h2 className="text-xl font-bold text-white tracking-tight">Simulator Input</h2>
               <p className="text-xs text-white/30">Define event parameters for AI modeling</p>
             </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-white/40 uppercase tracking-tighter">
             Step 01 <ChevronRight className="w-3 h-3" /> Step 02
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Event Name */}
          <div className="space-y-2 group">
            <label className={labelClasses}>
              <Activity className="w-3 h-3" /> Event Name
            </label>
            <input
              type="text"
              value={formData.eventName}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              placeholder="e.g., Global Tech Summit"
              className={inputClasses}
            />
            {errors.eventName && <p className="text-red-400 text-[10px] font-bold uppercase mt-1 ml-1">{errors.eventName}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Event Type */}
            <div className="space-y-2">
              <label className={labelClasses}>
                <Sparkles className="w-3 h-3" /> Category
              </label>
              <div className="relative">
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value as EventType })}
                  className={`${inputClasses} appearance-none pr-10 cursor-pointer`}
                >
                  <option value="conference">Conference</option>
                  <option value="festival">Music & Arts Festival</option>
                  <option value="sports">Athletic/Sports Arena</option>
                  <option value="retail">Retail Hub</option>
                  <option value="food">Culinary Exhibition</option>
                  <option value="cultural">Heritage/Cultural</option>
                  <option value="other">Custom Event</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                   <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            {/* Event Date */}
            <div className="space-y-2">
              <label className={labelClasses}>
                <Calendar className="w-3 h-3" /> Scheduled Date
              </label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Expected Attendees */}
            <div className="space-y-2">
              <label className={labelClasses}>
                <Users className="w-3 h-3" /> Capacity Pulse
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.expectedAttendees}
                  onChange={(e) => setFormData({ ...formData, expectedAttendees: parseInt(e.target.value) || 0 })}
                  placeholder="5000"
                  className={inputClasses}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/20 uppercase tracking-widest">PPL</span>
              </div>
              {errors.expectedAttendees && <p className="text-red-400 text-[10px] font-bold uppercase mt-1 ml-1">{errors.expectedAttendees}</p>}
            </div>

            {/* Event Duration */}
            <div className="space-y-2">
              <label className={labelClasses}>
                <Clock className="w-3 h-3" /> Time Window
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.eventDuration}
                  onChange={(e) => setFormData({ ...formData, eventDuration: parseInt(e.target.value) || 0 })}
                  placeholder="8"
                  className={inputClasses}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/20 uppercase tracking-widest">Hrs</span>
              </div>
              {errors.eventDuration && <p className="text-red-400 text-[10px] font-bold uppercase mt-1 ml-1">{errors.eventDuration}</p>}
            </div>
          </div>

          {/* Event Location */}
          <div className="space-y-2">
            <label className={labelClasses}>
              <MapPin className="w-3 h-3" /> Simulation Zone
            </label>
            <input
              type="text"
              value={formData.eventLocation}
              onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
              placeholder="e.g., Skyview Convention Center"
              className={inputClasses}
            />
            {errors.eventLocation && <p className="text-red-400 text-[10px] font-bold uppercase mt-1 ml-1">{errors.eventLocation}</p>}
          </div>

          {/* Info Alert */}
          <div className="p-4 rounded-2xl bg-[#00FF9C]/5 border border-[#00FF9C]/10 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-[#00FF9C] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-white/40 leading-relaxed italic">
              AI modeling factor: Predictions are synthesized from historical crowd dynamics. Venue-specific constraints may shift tactical requirements by ±5%.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black font-bold h-14 rounded-2xl text-base tracking-tight shadow-[0_0_30px_rgba(0,255,156,0.15)] transition-all group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 /> Synthesizing Logic...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Generate Simulation <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Loader2() {
  return (
    <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
  );
}
