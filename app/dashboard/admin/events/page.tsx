'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNav from '@/components/DashboardNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  MapPin, 
  Trash2, 
  ArrowLeft, 
  Loader2, 
  Globe, 
  Calendar,
  MoreVertical,
  Plus
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EventLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  event_date: string | null;
  created_at: string;
}

export default function EventsManagementPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [events, setEvents] = useState<EventLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      const res = await fetch('/api/locations');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data);
    } catch (err: any) {
      setError(err.message);
      console.error('[EventsManagement] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to delete event');
      }

      setEvents(events.filter(event => event.id !== id));
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    } catch (err: any) {
      console.error(`[EventsManagement] Delete failed:`, err);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: err.message,
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#080C10] text-white selection:bg-[#00FF9C]/30 selection:text-white">
      <DashboardNav />
      {/* Background ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/4 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-[#00FF9C] opacity-[0.03] blur-[120px] z-0" />
      
      <main className="container mx-auto p-6 space-y-8 relative z-10 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-start gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
              className="text-white/40 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 mt-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00FF9C]">Administration</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Infrastructure</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white">Manage Events</h1>
              <p className="text-white/40 mt-1 max-w-xl">
                Configure spatial boundaries, manage active event locations, and monitor infrastructure deployment across the P.U.L.S.E network.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              className="bg-white/5 border-white/10 hover:bg-white/10 text-white/80 transition-all font-medium"
              onClick={fetchEvents}
              disabled={loading}
            >
              <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sync Data
            </Button>
            <Button 
              className="bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black font-bold tracking-tight px-6 transition-all shadow-[0_0_20px_rgba(0,255,156,0.2)] hover:shadow-[0_0_25px_rgba(0,255,156,0.3)]"
              onClick={() => router.push('/dashboard/admin')}
            >
              <Plus className="h-4 w-4 mr-2" strokeWidth={3} />
              Create Event
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 backdrop-blur-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              System Error: {error}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-[#00FF9C] animate-spin" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-white/5" />
            </div>
            <p className="text-white/40 font-medium tracking-widest text-[10px] uppercase animate-pulse">Establishing Connection...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/[0.02] rounded-3xl border border-white/5 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Globe className="h-10 w-10 text-white/20" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Active Nodes</h3>
            <p className="text-white/40 max-w-md text-center px-6 leading-relaxed">
              The P.U.L.S.E network currently has no registered event locations. Initialize your first node to begin predictive spatial monitoring.
            </p>
            <Button 
              className="mt-8 bg-white/10 hover:bg-white/20 text-white border border-white/10"
              onClick={() => router.push('/dashboard/admin')}
            >
              Initialize Network
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="group relative bg-white/[0.02] border border-white/5 hover:border-[#00FF9C]/30 hover:bg-white/[0.04] rounded-2xl overflow-hidden transition-all duration-500"
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00FF9C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="p-6 relative z-10 space-y-6">
                  {/* Top Bar */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className="bg-[#00FF9C]/10 text-[#00FF9C] border-[#00FF9C]/20 text-[9px] font-bold uppercase tracking-wider py-0"
                        >
                          Operational
                        </Badge>
                        <span className="text-[10px] text-white/30 font-mono">#{event.id.slice(0, 6)}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white tracking-tight truncate group-hover:text-[#00FF9C] transition-colors duration-300">
                        {event.name}
                      </h3>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white hover:bg-white/10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0D1117] border-white/10 text-white">
                        <DropdownMenuItem 
                          className="text-white/70 hover:text-white hover:bg-white/5 cursor-pointer"
                          onClick={() => router.push(`/dashboard/admin/events/${event.id}`)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-white/70 hover:text-white hover:bg-white/5 cursor-pointer">
                          Edit Boundary
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Information Grid */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-4 w-4 text-white/40" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">Location</p>
                        <p className="text-sm text-white/80 font-medium truncate">{event.address}</p>
                        <p className="text-xs text-white/40 italic">{event.city}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          < Globe className="h-3 w-3" /> Coordinates
                        </p>
                        <p className="text-[11px] font-mono text-white/60">
                          {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          < Calendar className="h-3 w-3" /> Event Date
                        </p>
                        <p className="text-[11px] text-white/60">
                          {event.event_date ? new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Continuous'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-4 flex items-center justify-between border-t border-white/5">
                    <div className="text-[9px] text-white/20 uppercase tracking-[0.15em] font-medium">
                      Node Linked: {new Date(event.created_at).toLocaleDateString()}
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-white/30 hover:text-red-400 hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-widest transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Terminate
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#0D1117] border-white/10 text-white backdrop-blur-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-2xl font-bold tracking-tight">Terminate Event Node?</AlertDialogTitle>
                          <AlertDialogDescription className="text-white/40 leading-relaxed">
                            This will high-level disconnect the event node <span className="text-white font-semibold">"{event.name}"</span> from the P.U.L.S.E system. This action is irreversible and all associated telemetry will be archived.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 flex gap-3">
                          <AlertDialogCancel className="bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white rounded-xl">Hold Operation</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={(e) => {
                              handleDelete(event.id);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white border-0 rounded-xl"
                          >
                            {deletingId === event.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : 'Full Deletion'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Bottom Border Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 group-hover:bg-[#00FF9C]/50 transition-colors duration-500" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
