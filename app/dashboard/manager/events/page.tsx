'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import DashboardNav from '@/components/DashboardNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, MapPin, ArrowLeft, Loader2, Globe, Calendar, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EventLocation, IoTDevice } from '@/lib/types';

const BinMap = dynamic(() => import('@/components/BinMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-96 bg-slate-900 animate-pulse rounded-lg flex items-center justify-center"><span className="text-slate-400">Loading map...</span></div>
});

export default function ManagerEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventLocation[]>([]);
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [zones, setZones] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [locRes, devRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/devices')
      ]);
      
      if (!locRes.ok) throw new Error('Failed to fetch events');
      const locData = await locRes.json();
      setEvents(locData);
      
      if (devRes.ok) {
        const devData = await devRes.json();
        setDevices(devData);
      }
      
      if (locData.length > 0) {
        setSelectedEventId(locData[0].id);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('[ManagerEvents] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }

  // Fetch zones when event changes
  useEffect(() => {
    async function fetchZones() {
      if (!selectedEventId) return;
      try {
        const response = await fetch(`/api/zones?location_id=${selectedEventId}`);
        if (response.ok) {
          const data = await response.json();
          setZones(data);
        }
      } catch (error) {
        console.error('Error fetching zones:', error);
      }
    }
    fetchZones();
  }, [selectedEventId]);

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const eventDevices = devices.filter(d => d.location_id === selectedEventId);

  return (
    <div className="min-h-screen bg-background pb-20">
      <DashboardNav />
      
      <main className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/dashboard/manager')}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1 tracking-tight italic">Live Event Ground Map</h1>
              <p className="text-slate-400">Real-time spatial overview of all active events</p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-slate-400 font-medium">Synchronizing live map data...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-slate-700">
            <Globe className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No active events found</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Event locations must be created by an administrator. Please contact your admin to set up a new event boundary.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-slate-900 border-primary/20 overflow-hidden relative group">
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <Badge className="bg-black/60 backdrop-blur border-primary/30 text-primary font-bold">
                    {events.length} Live Event{events.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="h-[500px] w-full">
                  <BinMap 
                    devices={eventDevices}
                    center={selectedEvent ? [selectedEvent.latitude, selectedEvent.longitude] : [20.5937, 78.9629]}
                    zoom={selectedEvent ? 16 : 5}
                    eventBoundary={selectedEvent?.boundary}
                    zones={zones}
                    restrictToBoundary={false}
                    autoFitBounds={true}
                  />
                </div>
              </Card>

              {/* Event Info Card */}
              {selectedEvent && (
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        Boundary Details: {selectedEvent.name}
                      </CardTitle>
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        {eventDevices.length} Connected Bins
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Address</p>
                      <p className="text-sm text-slate-200">{selectedEvent.address}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Coordinates</p>
                      <p className="text-sm font-mono text-slate-200">{selectedEvent.latitude.toFixed(6)}, {selectedEvent.longitude.toFixed(6)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Event Date</p>
                      <p className="text-sm text-slate-200">{selectedEvent.event_date ? new Date(selectedEvent.event_date).toLocaleDateString() : 'Continuous'}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* List Section */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Active Ground Areas</h2>
              <div className="space-y-3 overflow-y-auto max-h-[650px] pr-2 custom-scrollbar">
                {events.map((event) => (
                  <Card 
                    key={event.id} 
                    onClick={() => setSelectedEventId(event.id)}
                    className={`cursor-pointer transition-all border-l-4 ${selectedEventId === event.id ? 'bg-primary/10 border-primary ring-1 ring-primary/20' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'} overflow-hidden relative`}
                  >
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className={`text-lg italic tracking-tight ${selectedEventId === event.id ? 'text-primary' : 'text-white'}`}>
                            {event.name}
                          </CardTitle>
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                            <MapPin className="h-3 w-3" />
                            {event.city}
                          </div>
                        </div>
                        {selectedEventId === event.id && (
                          <div className="bg-primary/20 text-primary p-1 rounded-full">
                            <ArrowLeft className="h-4 w-4 rotate-180" />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 156, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 156, 0.4);
        }
      `}</style>
    </div>
  );
}
