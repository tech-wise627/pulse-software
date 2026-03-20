
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { mockLocations, mockDevices, mockAlerts, mockStaff, mockAssignments, mockWorkerLocations } from '@/lib/mock-data';
import { IoTDevice, EventLocation, Zone } from '@/lib/types';
import { getBinStatus } from '@/lib/bin-colors';
import DashboardNav from '@/components/DashboardNav';
import { createClient } from '@/lib/supabase/client';
import AddBinDialog from '@/components/AddBinDialog';
import BinManagementPanel from '@/components/BinManagementPanel';
import ZoneCreationPanel from '@/components/ZoneCreationPanel';
import BinDetailsPanel from '@/components/BinDetailsPanel';
import ZonePerformancePanel from '@/components/ZonePerformancePanel';
import WorkerStatusMonitor from '@/components/WorkerStatusMonitor';
import EmergencyCleanButton from '@/components/EmergencyCleanButton';
import OverflowPredictionPanel from '@/components/OverflowPredictionPanel';
import CrowdDensityPanel from '@/components/CrowdDensityPanel';
import MaintenanceTracker from '@/components/MaintenanceTracker';
import PanicButtonPanel from '@/components/PanicButtonPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Zap, AlertTriangle, MapPin, Users, TrendingUp, Activity, Battery, Droplet, Clock, Plus, CheckCircle, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BinMap = dynamic(() => import('@/components/BinMap'), { ssr: false });
const WorkerLocationMap = dynamic(() => import('@/components/WorkerLocationMap'), { ssr: false });

export default function ManagerDashboard() {
  const [locations, setLocations] = useState<EventLocation[]>([]);
  const [deviceList, setDeviceList] = useState<IoTDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'location'>('name');
  const [showAddBinDialog, setShowAddBinDialog] = useState(false);
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);
  const [showAssignBinDialog, setShowAssignBinDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [newStaffName, setNewStaffName] = useState('');
  const [selectedBinForAssignment, setSelectedBinForAssignment] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [newStaffData, setNewStaffData] = useState({ name: '', phone: '', role: '', notes: '' });
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedBinForDetails, setSelectedBinForDetails] = useState<string | null>(null);
  const [isRegisteringBin, setIsRegisteringBin] = useState(false);
  const supabase = createClient();

  // Fetch real data
  useEffect(() => {
    async function fetchData() {
      try {
        const [locRes, devRes, staffRes] = await Promise.all([
          fetch('/api/locations'),
          fetch('/api/devices'),
          fetch('/api/staff')
        ]);
        
        if (locRes.ok) {
          const locData = await locRes.json();
          setLocations(locData);
          if (locData.length > 0 && !selectedLocation) {
            setSelectedLocation(locData[0].id);
          }
        }
        
        if (devRes.ok) {
          const devData = await devRes.json();
          setDeviceList(devData);
        }
        
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setStaffList(staffData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Subscribe to staff location updates
    const channel = supabase
      .channel('staff-telemetry')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users' },
        (payload: any) => {
          if (payload.new.role === 'staff') {
            setStaffList((current) => 
              current.map((s) => s.id === payload.new.id ? { ...s, ...payload.new } : s)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Fetch zones when location changes
  useEffect(() => {
    async function fetchZones() {
      if (!selectedLocation || selectedLocation === 'all') return;
      try {
        const response = await fetch(`/api/zones?location_id=${selectedLocation}`);
        if (response.ok) {
          const data = await response.json();
          setZones(data);
        }
      } catch (error) {
        console.error('Error fetching zones:', error);
      }
    }
    fetchZones();
  }, [selectedLocation]);

  const currentLocation = locations.find((l) => l.id === selectedLocation);
  const currentEvent = currentLocation; // Alias for event boundary access
  
  const locationDevices = selectedLocation === 'all' 
    ? deviceList 
    : deviceList.filter((d) => d.location_id === selectedLocation);

  const sortedDevices = [...locationDevices].sort((a, b) => {
    if (sortField === 'location') {
      const locA = locations.find(l => l.id === a.location_id)?.name || '';
      const locB = locations.find(l => l.id === b.location_id)?.name || '';
      return locA.localeCompare(locB);
    }
    return (a.name || '').localeCompare(b.name || '');
  });

  const locationAlerts = selectedLocation === 'all'
    ? mockAlerts.filter(a => deviceList.some(d => d.id === a.device_id))
    : mockAlerts.filter((a) => {
        const device = deviceList.find((d) => d.id === a.device_id);
        return device?.location_id === selectedLocation;
      });

  const criticalAlerts = locationAlerts.filter((a) => a.severity === 'critical');
  const totalDevices = locationDevices.length;
  const onlineDevices = locationDevices.filter((d) => d.is_connected).length;
  const highFillBins = locationDevices.filter((d) => (d.fill_level ?? 0) > 80).length;
  const lowBatteryDevices = locationDevices.filter((d) => d.battery_level < 20).length;
  const avgFillLevel = locationDevices.length > 0 
    ? Math.round(locationDevices.reduce((sum, d) => sum + (d.fill_level ?? 0), 0) / locationDevices.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#080C10] text-white selection:bg-[#00FF9C]/30 transition-colors duration-500">
      <DashboardNav />
      {/* Background ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/4 w-[800px] h-[500px] rounded-full bg-[#00FF9C] opacity-[0.02] blur-[120px] z-0" />
      <div className="pointer-events-none fixed bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] z-0" />

      <main className="relative z-10 container mx-auto py-6 px-6 max-w-7xl space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#00FF9C]">Operational Command</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">Nexus v3.4</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-white mb-2">
                P.U.L.S.E <span className="text-white/20">/</span> MANAGER
              </h1>
              <p className="text-white/40 max-w-xl text-[11px] sm:text-sm leading-relaxed font-medium italic border-l-2 border-white/5 pl-4">
                Real-time telemetry synthesis and autonomous collection monitoring powered by Fostride Intelligence.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-[260px]">
            <label className="text-[9px] font-bold uppercase tracking-widest text-white/30 ml-1 flex items-center gap-2">
              <MapPin className="w-3 h-3 text-[#00FF9C]" /> Site Selection
            </label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="h-10 text-xs bg-white/[0.03] border-white/10 rounded-xl text-white font-bold tracking-tight hover:bg-white/[0.05] hover:border-white/20 transition-all shadow-2xl backdrop-blur-md">
                <SelectValue placeholder="Select Deployment Site" />
              </SelectTrigger>
              <SelectContent className="bg-[#0D1117] border-white/10 rounded-xl">
                <SelectItem value="all" className="text-[#00FF9C] text-xs font-black hover:bg-[#00FF9C]/10 transition-colors py-2 uppercase tracking-widest">
                  ALL LOCATIONS (GLOBAL)
                </SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id} className="text-white text-xs hover:bg-[#00FF9C]/10 hover:text-[#00FF9C] transition-colors py-2">
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {criticalAlerts.length > 0 && (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <div className="relative flex items-center justify-between p-6 bg-[#0D1117] border border-red-500/20 rounded-3xl backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-500 animate-pulse" />
                </div>
                <div>
                   <h4 className="text-red-500 font-black uppercase tracking-widest text-xs mb-1">Critical Intervention Required</h4>
                   <p className="text-red-200/60 text-sm font-medium"><strong>{criticalAlerts.length} Active Node Failures</strong> detected in current sector.</p>
                </div>
              </div>
              <Button variant="ghost" className="text-red-500/50 hover:text-red-500 hover:bg-red-500/5 font-bold uppercase tracking-widest text-[10px]">
                View Priority Stream
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="group relative bg-[#0D1117] border border-white/5 rounded-2xl p-5 hover:border-[#00FF9C]/30 transition-all duration-500 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <Zap className="w-8 h-8 text-[#00FF9C]" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">Deployed Nodes</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tighter text-white">{totalDevices}</span>
                  <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">{onlineDevices} Sync</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                 <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                    <span className="text-white/20">Operational Sync</span>
                    <span className="text-[#00FF9C]">{Math.round((onlineDevices/totalDevices)*100)}%</span>
                 </div>
                 <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#00FF9C] to-emerald-500 shadow-[0_0_10px_#00FF9C]" style={{ width: `${onlineDevices/totalDevices*100}%` }} />
                 </div>
              </div>
            </div>
          </div>

          <div className="group relative bg-[#0D1117] border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-500 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <Activity className="w-8 h-8 text-blue-500" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">Network Health</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tighter text-white">{Math.round((onlineDevices/totalDevices)*100)}<span className="text-lg text-white/20 ml-0.5">%</span></span>
                  <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest">{lowBatteryDevices} Critical</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                 <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                    <span className="text-white/20">Power Reserves</span>
                    <span className="text-blue-500">Optimized</span>
                 </div>
                 <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${(totalDevices-lowBatteryDevices)/totalDevices*100}%` }} />
                 </div>
              </div>
            </div>
          </div>

          <div className="group relative bg-[#0D1117] border border-white/5 rounded-2xl p-5 hover:border-yellow-500/30 transition-all duration-500 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <Droplet className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">Payload Alert</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tighter text-yellow-500">{highFillBins}</span>
                  <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Post-Threshold</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                 <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                    <span className="text-white/20">Collection Pressure</span>
                    <span className="text-yellow-500">High</span>
                 </div>
                 <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-600 shadow-[0_0_10px_rgba(234,179,8,0.5)]" style={{ width: `${highFillBins/totalDevices*100}%` }} />
                 </div>
              </div>
            </div>
          </div>

          <div className="group relative bg-[#0D1117] border border-white/5 rounded-2xl p-5 hover:border-purple-500/30 transition-all duration-500 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">Mean Payload</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tighter text-white">{avgFillLevel}<span className="text-lg text-white/20 ml-0.5">%</span></span>
                  <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Avg Saturation</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                 <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                    <span className="text-white/20">Network Delta</span>
                    <span className="text-purple-500">Stable</span>
                 </div>
                 <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: `${avgFillLevel}%` }} />
                 </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="flex justify-center overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="h-12 inline-flex bg-white/[0.03] border border-white/10 rounded-full px-1.5 py-1.5 shadow-2xl backdrop-blur-md min-w-max">
              {[
                { value: 'overview', label: 'Overview' },
                { value: 'operations', label: 'Operations' },
                { value: 'devices', label: 'Network' },
                { value: 'alerts', label: 'Alert Stream' },
                { value: 'staff', label: 'Force Monitor' }
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className="px-6 h-9 text-[9px] font-black uppercase tracking-[0.2em] text-white/40 data-[state=active]:bg-[#00FF9C] data-[state=active]:text-black rounded-full transition-all duration-300"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <Card className="border-primary/20 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-accent flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                    <Link href="/dashboard/manager/events" className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Live Event Ground Map
                    </Link>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Event:</span>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger className="w-48 bg-input border-primary/30 text-foreground text-sm">
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-primary/30">
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id} className="text-foreground">
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00FF9C' }}></div>
                      <span className="text-foreground">Healthy {'<'}50%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFC857' }}></div>
                      <span className="text-foreground">Medium 50-80%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF3B5C' }}></div>
                      <span className="text-foreground">Full {'>'} 80%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#5A5F66' }}></div>
                      <span className="text-foreground">Offline</span>
                    </div>
                  </div>
                  <div className="h-96 rounded-lg overflow-hidden border border-primary/20">
                    <BinMap 
                      key={selectedLocation}
                      devices={locationDevices}
                      onDeviceClick={(device) => setSelectedBinForDetails(device.id)}
                      center={currentLocation ? [currentLocation.latitude, currentLocation.longitude] : [20.5937, 78.9629]}
                      autoFitBounds={true}
                      eventBoundary={currentEvent?.boundary}
                      restrictToBoundary={true}
                      zones={zones}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="p-2 bg-primary/10 rounded border border-primary/20">
                      <div className="text-xs text-muted-foreground">Total Bins</div>
                      <div className="text-lg font-bold text-primary">{locationDevices.length}</div>
                    </div>
                    <div className="p-2 bg-primary/10 rounded border border-primary/20">
                      <div className="text-xs text-muted-foreground">Online</div>
                      <div className="text-lg font-bold text-primary">{locationDevices.filter(d => d.is_connected).length}</div>
                    </div>
                    <div className="p-2 bg-destructive/10 rounded border border-destructive/20">
                      <div className="text-xs text-muted-foreground">Critical</div>
                      <div className="text-lg font-bold text-destructive">{locationDevices.filter(d => (d.fill_level ?? 0) > 80).length}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bin and Zone Management Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BinManagementPanel 
                event={(currentEvent as any) || null}
                onBinAdded={(newDevice) => {
                  setDeviceList(prev => [...prev, newDevice]);
                }}
              />
              <ZoneCreationPanel
                zones={zones}
                event={currentEvent as any}
                onZoneAdded={(zone) => {
                  setZones([...zones, zone]);
                }}
                onZoneRemoved={(zoneId) => {
                  setZones(zones.filter(z => z.id !== zoneId));
                }}
              />
            </div>

          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations" className="space-y-4">
            {/* Top Grid: Map (2/3) and Bin Details (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:min-h-[600px]">
              {/* Left Column: Worker Location Map (2/3) */}
              <div className="lg:col-span-2 rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden border border-white/10 relative h-[350px] sm:h-[450px] lg:h-auto z-10">
                <WorkerLocationMap
                  workers={staffList.map(s => ({
                    id: s.id,
                    name: (s.full_name || s.name || s.email || 'Unknown').split(' ')[0],
                    latitude: s.latitude || 0,
                    longitude: s.longitude || 0,
                    status: s.status?.toLowerCase() === 'active' ? 'active' : 'offline',
                    isOutOfBounds: false,
                    lastUpdated: s.last_location_update || s.created_at || new Date().toISOString()
                  }))}
                  eventBoundary={currentLocation?.boundary as any || []}
                  zones={zones}
                  bins={locationDevices}
                  centerLocation={currentLocation ? [currentLocation.latitude, currentLocation.longitude] : [20.5937, 78.9629]}
                  onBinClick={(id) => setSelectedBinForDetails(id)}
                />
              </div>

              {/* Right Column: Bin Details & Assignment (1/3) */}
              <div className="lg:col-span-1 flex flex-col h-full z-20">
                {selectedBinForDetails ? (
                  <BinDetailsPanel
                    device={deviceList.find(d => d.id === selectedBinForDetails) || null}
                    staffList={staffList}
                    onClose={() => setSelectedBinForDetails(null)}
                  />
                ) : (
                  <div className="flex-1 min-h-[400px] h-full flex items-center justify-center bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 text-center backdrop-blur-md">
                    <div className="flex flex-col items-center gap-4 opacity-50">
                      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <Droplet className="w-8 h-8 text-[#00FF9C]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">No Node Selected</h4>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 leading-relaxed">Select a node on the telemetry map to<br/>assign personnel or view metrics</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lower Grid: Other Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <EmergencyCleanButton />
              </div>
              <div className="lg:col-span-1">
                <ZonePerformancePanel />
              </div>
              <div className="lg:col-span-1">
                <WorkerStatusMonitor />
              </div>
            </div>

            {/* Advanced Operations Intelligence */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Overflow Predictions */}
              <OverflowPredictionPanel devices={locationDevices} />

              {/* Crowd Density */}
              <CrowdDensityPanel devices={locationDevices} zones={zones} />

              {/* Maintenance Tracker */}
              <MaintenanceTracker devices={locationDevices} />

              {/* Staff Panic Button */}
              <PanicButtonPanel
                staffName="Field Manager"
                zone={currentLocation?.name || 'Event Area'}
                currentBinId={selectedBinForDetails ? deviceList.find(d => d.id === selectedBinForDetails)?.device_id : 'N/A'}
                userLocation={currentLocation ? [currentLocation.latitude, currentLocation.longitude] : [0, 0]}
              />
            </div>

          </TabsContent>

          <TabsContent value="devices" className="space-y-4">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-[#00FF9C]/5 border-[#00FF9C]/20 text-[#00FF9C] px-3 py-1 font-black uppercase tracking-widest text-[10px]">
                  {sortedDevices.length} ACTIVE NODES
                </Badge>
                {selectedLocation === 'all' && (
                  <Badge variant="outline" className="bg-blue-500/5 border-blue-500/20 text-blue-400 px-3 py-1 font-black uppercase tracking-widest text-[10px]">
                    GLOBAL VIEW ENABLED
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Sort By:</span>
                <div className="flex bg-white/[0.03] border border-white/10 rounded-xl p-1">
                  <button 
                    onClick={() => setSortField('name')}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      sortField === 'name' ? 'bg-[#00FF9C] text-black shadow-[0_0_15px_#00FF9C40]' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    IDENTIFIER
                  </button>
                  <button 
                    onClick={() => setSortField('location')}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      sortField === 'location' ? 'bg-[#00FF9C] text-black shadow-[0_0_15px_#00FF9C40]' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    LOCATION
                  </button>
                </div>

                <Dialog open={showAddBinDialog} onOpenChange={setShowAddBinDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      disabled={selectedLocation === 'all'}
                      className={`h-10 px-6 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all ${
                        selectedLocation === 'all' 
                          ? 'bg-white/5 text-white/20' 
                          : 'bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black shadow-[0_0_20px_#00FF9C40]'
                      }`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Initialize Node
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-[#0D1117] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                    <div className="p-8 border-b border-white/10">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tighter text-white uppercase italic">SYSTEM COMMISSIONING</DialogTitle>
                      </DialogHeader>
                    </div>
                    <div className="p-10">
                      <AddBinDialog 
                        locationId={selectedLocation}
                        boundary={currentLocation?.boundary || []}
                        isSubmitting={isRegisteringBin}
                        onBinAdded={async (binData) => {
                          setIsRegisteringBin(true);
                          try {
                            const supabase = createClient();
                            const { data: newDevice, error } = await supabase
                              .from('iot_devices')
                              .insert([{
                                ...binData,
                                installed_at: new Date().toISOString()
                              }])
                              .select()
                              .single();
                            
                            if (!error && newDevice) {
                              setDeviceList(prev => [...prev, newDevice]);
                              setShowAddBinDialog(false);
                              console.log('[v0] Bin persisted successfully via client:', newDevice);
                            } else {
                              console.error('[v0] Error persisting bin via client:', error);
                              alert(`Failed to save bin: ${error?.message || 'Unknown database error'}`);
                            }
                          } catch (error: any) {
                            console.error('[v0] Error persisting bin:', error);
                            alert(`Network/Client error while saving bin: ${error.message}`);
                          } finally {
                            setIsRegisteringBin(false);
                          }
                        }}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sortedDevices.map((device) => {
                const binStatus = getBinStatus(device.fill_level ?? 0, device.is_connected);
                return (
                  <Card key={device.id} className="border-primary/20 bg-gradient-to-br from-card to-card/50 hover:border-primary/40 transition-all">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                               <MapPin className="w-3 h-3 text-[#00FF9C]/40" />
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                                 {locations.find(l => l.id === device.location_id)?.name || 'Unknown Site'}
                               </span>
                            </div>
                            <h3 className="text-lg font-black tracking-tighter text-white uppercase">{device.name}</h3>
                            <p className="text-[10px] font-bold text-white/20 tracking-widest uppercase">{device.device_id}</p>
                          </div>
                          <Badge style={{ backgroundColor: binStatus.color, color: '#fff' }} className="font-semibold">
                            {binStatus.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg border" style={{ backgroundColor: `${binStatus.color}15`, borderColor: `${binStatus.color}40` }}>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Droplet className="w-3 h-3" /> Fill Level
                            </div>
                            <div className="text-2xl font-bold mt-1" style={{ color: binStatus.color }}>{device.fill_level}%</div>
                            <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full" style={{ width: `${device.fill_level}%`, backgroundColor: binStatus.color }} />
                            </div>
                          </div>
                          <div className="p-3 rounded-lg border border-primary/20" style={{ backgroundColor: `#22c55e15` }}>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Battery className="w-3 h-3" /> Battery
                            </div>
                            <div className="text-2xl font-bold text-accent mt-1">{device.battery_level}%</div>
                            <Progress value={device.battery_level} className="mt-2 h-1" />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 rounded-lg border" style={{ backgroundColor: `${binStatus.color}20`, borderColor: `${binStatus.color}40` }}>
                          <Activity className="w-4 h-4" style={{ color: binStatus.color }} />
                          <span className="text-sm text-foreground font-medium">{binStatus.label}</span>
                        </div>

                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          Last update: {device.last_sync ? new Date(device.last_sync).toLocaleTimeString() : 'Never'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            {locationAlerts.length === 0 ? (
              <Card className="border-primary/20 bg-card/50">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No alerts at this time</p>
                </CardContent>
              </Card>
            ) : (
              locationAlerts.map((alert) => {
                const device = locationDevices.find((d) => d.id === alert.device_id);
                const alertColor = alert.severity === 'critical' ? 'bg-red-500/20 border-red-500' : 'bg-yellow-500/20 border-yellow-500';
                return (
                  <Card key={alert.id} className={`border-l-4 ${alertColor} bg-card/50`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {alert.severity === 'critical' ? (
                              <AlertCircle className="w-5 h-5 text-destructive" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            )}
                            <h4 className="font-bold text-foreground">{alert.message}</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <p>Device: <span className="text-accent">{device?.name || 'Unknown Node'}</span></p>
                            <p>Fill Level: <span className="text-accent font-mono">{device?.fill_level ?? 'N/A'}%</span></p>
                          </div>
                        </div>
                        <Badge variant={alert.is_read ? 'secondary' : 'default'}>
                          {alert.is_read ? 'Read' : 'Unread'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9C]">Field Personnel Monitor</h3>
            <Link href="/dashboard/hr/staff">
               <Button variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-[#00FF9C]">
                 Full Directory <ChevronRight className="ml-1 w-3 h-3" />
               </Button>
            </Link>
          </div>

            <div className="flex gap-3 mb-6">
              {selectedStaff && (
                <Dialog open={showAssignBinDialog} onOpenChange={setShowAssignBinDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/10">
                      <Droplet className="w-4 h-4" />
                      Assign Bin to Staff
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-primary/20">
                    <DialogHeader>
                      <DialogTitle className="text-accent">Assign Bin to Staff</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-foreground mb-2 block">Select Bin</label>
                        <Select value={selectedBinForAssignment} onValueChange={setSelectedBinForAssignment}>
                          <SelectTrigger className="bg-input border-primary/20">
                            <SelectValue placeholder="Choose a bin to assign" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-primary/20">
                            {locationDevices.map((device) => (
                              <SelectItem key={device.id} value={device.id}>
                                {device.name} ({device.fill_level}% full)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={() => {
                          if (selectedBinForAssignment) {
                            setSelectedBinForAssignment('');
                            setShowAssignBinDialog(false);
                          }
                        }}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        Assign Bin
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staffList.map((staff) => {
                const isSelected = selectedStaff === staff.id;
                return (
                  <Card 
                    key={staff.id} 
                    className={`border-2 group transition-all duration-300 ${isSelected ? 'border-[#00FF9C] bg-[#00FF9C]/5' : 'border-white/5 bg-[#0D1117] hover:border-white/20'}`}
                    onClick={() => {
                      setSelectedStaff(isSelected ? null : staff.id);
                    }}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-[#00FF9C]/30 transition-colors">
                          {staff.photo_url ? (
                            <img src={staff.photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-6 h-6 text-white/20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-black tracking-tight text-white group-hover:text-[#00FF9C] transition-colors truncate">
                            {staff.first_name} {staff.last_name}
                          </h4>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{staff.role}</p>
                        </div>
                        <Badge className={`uppercase tracking-widest text-[8px] font-black h-5 px-2 ${
                          staff.status === 'Active' ? 'bg-[#00FF9C]/10 text-[#00FF9C] border-[#00FF9C]/30' : 'bg-white/5 text-white/30 border-white/10'
                        }`}>
                          {staff.status}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                           <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Sector</p>
                           <p className="text-xs font-bold text-white/80">{staff.department}</p>
                        </div>
                        <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                           <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Comms</p>
                           <p className="text-xs font-bold text-white/80 font-mono truncate">{staff.phone || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link href={`/dashboard/hr/staff/${staff.id}`} className="flex-1">
                          <Button className="w-full h-10 rounded-xl bg-white/[0.05] hover:bg-[#00FF9C]/20 border border-white/10 hover:border-[#00FF9C]/50 text-[9px] font-black uppercase tracking-widest text-white hover:text-[#00FF9C] transition-all">
                            View Mission Profile
                          </Button>
                        </Link>
                        {isSelected && (
                          <Button onClick={() => setShowAssignBinDialog(true)} className="w-12 h-10 rounded-xl bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black p-0 shadow-[0_0_15px_rgba(0,255,156,0.3)]">
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
