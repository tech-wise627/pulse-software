'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import DashboardNav from '@/components/DashboardNav';
import CreateLocationForm from '@/components/CreateLocationForm';
import { ScrollableDialog } from '@/components/ScrollableDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle, Zap, Users, Trash2, AlertTriangle,
  TrendingUp, MapPin, Bell, Plus, BarChart3, Lightbulb,
  Activity, RefreshCw, ArrowUpRight, ChevronRight
} from 'lucide-react';
import { IoTDevice, EventLocation, Zone } from '@/lib/types';

const AdminMap = dynamic(() => import('@/components/AdminMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0D1117] animate-pulse rounded-b-xl flex items-center justify-center">
      <span className="text-white/30 text-sm">Loading map…</span>
    </div>
  ),
});

// ─── Subcomponents ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, status, accent = false,
}: {
  icon: any; label: string; value: string | number; status?: 'good' | 'warning' | 'critical'; accent?: boolean;
}) {
  const statusColor =
    status === 'critical' ? 'text-red-400' :
    status === 'warning' ? 'text-yellow-400' :
    'text-[#00FF9C]';

  return (
    <div className="group relative p-5 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[#00FF9C]/5 to-transparent" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center group-hover:border-[#00FF9C]/30 transition-colors">
            <Icon className="w-4 h-4 text-[#00FF9C]" strokeWidth={1.75} />
          </div>
          {status && (
            <span className={`w-2 h-2 rounded-full mt-1 ${statusColor} bg-current opacity-70`} />
          )}
        </div>
        <p className="text-xs text-white/40 mb-0.5">{label}</p>
        <p className={`text-2xl font-bold tracking-tight ${accent ? 'text-[#00FF9C]' : 'text-white'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function AlertRow({ severity, device, message }: any) {
  const config = {
    critical: { bg: 'bg-red-500/8', border: 'border-red-500/20', text: 'text-red-400', icon: AlertTriangle },
    warning: { bg: 'bg-yellow-500/8', border: 'border-yellow-500/20', text: 'text-yellow-400', icon: AlertCircle },
    info: { bg: 'bg-blue-500/8', border: 'border-blue-500/20', text: 'text-blue-400', icon: Bell },
  };
  const c = config[severity as keyof typeof config] || config.info;
  const Icon = c.icon;
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${c.bg} ${c.border}`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${c.text}`} strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{device?.name}</p>
        <p className="text-xs text-white/40 mt-0.5 truncate">{message}</p>
      </div>
      <button className="text-xs text-white/30 hover:text-white/70 transition-colors flex-shrink-0">
        View
      </button>
    </div>
  );
}

function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest">{title}</h2>
      {action}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [locations, setLocations] = useState<EventLocation[]>([]);
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    if (debugMode) {
      try {
        const { mockLocations: mLoc, mockDevices: mDev } = await import('@/lib/mock-data');
        setLocations(mLoc as any);
        setDevices(mDev as any);
      } catch (e) {
        console.error('Debug import failed:', e);
      }
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [locRes, devRes, staffRes, zonesRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/devices'),
        fetch('/api/staff'),
        fetch('/api/zones'),
      ]);

      if (!locRes.ok) {
        const errData = await locRes.json();
        throw new Error(errData.details || errData.error || `API Error: ${locRes.status}`);
      }

      const locData = await locRes.json();
      setLocations(locData);
      if (locData.length > 0 && !selectedEvent) setSelectedEvent(locData[0].id);

      if (devRes.ok) setDevices(await devRes.json());
      if (staffRes.ok) setStaff(await staffRes.json());
      if (zonesRes.ok) setZones(await zonesRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [debugMode]);

  const activeBins = devices.filter(d => d.is_connected).length;
  const criticalAlerts = devices.filter(d => (d.fill_level || 0) > 80 || !d.is_connected).length;
  const systemHealth = devices.length > 0
    ? Math.round((devices.filter(d => d.is_connected).length / devices.length) * 100)
    : 100;

  const navActions = [
    { href: '/dashboard/admin/events', icon: MapPin, label: 'Events' },
    { href: '/dashboard/admin/reports', icon: BarChart3, label: 'Reports' },
    { href: '/dashboard/admin/prediction', icon: Lightbulb, label: 'Predictions' },
  ];

  return (
    <div className="min-h-screen bg-[#080C10] text-white">
      <DashboardNav />

      {debugMode && (
        <div className="bg-yellow-400 text-black text-[11px] py-1.5 px-5 font-mono font-bold flex justify-between items-center">
          <span>DEBUG MODE — MOCK DATA ACTIVE</span>
          <button onClick={() => setDebugMode(false)} className="underline">Exit</button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-5 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Admin Overview</h1>
            <p className="text-sm text-white/40">Real-time waste operations command centre</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="h-9 px-3 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/20 rounded-lg bg-white/[0.02] hover:bg-white/5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setDebugMode(v => !v)}
              className={`h-9 px-3 inline-flex items-center gap-1.5 text-sm border rounded-lg transition-all ${
                debugMode
                  ? 'bg-yellow-400/20 border-yellow-400/40 text-yellow-400'
                  : 'bg-white/[0.02] border-white/10 text-white/40 hover:text-white hover:border-white/20'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Debug
            </button>
            <button
              onClick={() => setShowCreateEvent(true)}
              className="h-9 px-4 inline-flex items-center gap-1.5 text-sm font-semibold bg-[#00FF9C] text-black rounded-lg hover:bg-[#00FF9C]/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Event
            </button>
            <ScrollableDialog title="Create New Event" open={showCreateEvent} onOpenChange={setShowCreateEvent}>
              <CreateLocationForm
                onSuccess={async (newId) => {
                  setShowCreateEvent(false);
                  const res = await fetch('/api/locations');
                  if (res.ok) {
                    const data = await res.json();
                    setLocations(data);
                    setSelectedEvent(newId);
                  }
                }}
              />
            </ScrollableDialog>
          </div>
        </div>

        {/* ── Quick nav ── */}
        <div className="flex gap-2 flex-wrap">
          {navActions.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-white/50 hover:text-white border border-white/8 hover:border-white/20 rounded-lg bg-transparent hover:bg-white/5 transition-all group"
            >
              <Icon className="w-3.5 h-3.5 group-hover:text-[#00FF9C] transition-colors" />
              {label}
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <span className="font-semibold">API Error:</span>{' '}
              <span className="font-mono text-xs">{error}</span>
            </AlertDescription>
          </Alert>
        )}

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={Zap} label="Active Events" value={locations.length} status="good" />
          <StatCard icon={Trash2} label="Active Bins" value={activeBins} status="good" />
          <StatCard icon={Users} label="Staff" value={staff.length} status="good" />
          <StatCard icon={AlertTriangle} label="Critical Alerts" value={criticalAlerts} status={criticalAlerts > 0 ? 'critical' : 'good'} />
          <StatCard icon={TrendingUp} label="System Health" value={`${systemHealth}%`} status={systemHealth >= 90 ? 'good' : systemHealth >= 70 ? 'warning' : 'critical'} accent />
        </div>

        {/* ── Event filter banner ── */}
        {selectedEvent && (
          <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-white/8 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-[#00FF9C]" />
              <span className="text-white/50">Showing:</span>
              <span className="text-white font-medium">
                {locations.find(l => l.id === selectedEvent)?.name}
              </span>
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              View all
            </button>
          </div>
        )}

        {/* ── Empty state ── */}
        {locations.length === 0 && !loading && (
          <div className="flex items-center justify-between px-4 py-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">No event locations found</p>
                <p className="text-xs text-white/40 mt-0.5">Create an event or enable debug mode to see demo data.</p>
              </div>
            </div>
            <button
              onClick={() => setDebugMode(true)}
              className="text-xs text-yellow-400 border border-yellow-400/30 rounded-lg px-3 py-1.5 hover:bg-yellow-400/10 transition-colors flex-shrink-0"
            >
              Debug mode
            </button>
          </div>
        )}

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Map + Timeline */}
          <div className="lg:col-span-2 space-y-6">

            {/* Map */}
            <div className="rounded-xl border border-white/8 bg-[#0D1117] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Live Event Map</h3>
                  {locations.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-[#00FF9C]/30 bg-[#00FF9C]/10 text-[#00FF9C]">
                      {locations.length} live
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1.5 text-xs text-[#00FF9C]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9C] animate-pulse" />
                  Live
                </span>
              </div>
              <div style={{ height: '400px' }}>
                <AdminMap
                  locations={locations}
                  devices={devices}
                  zones={zones}
                  selectedEventId={selectedEvent || undefined}
                  onEventSelect={setSelectedEvent}
                />
              </div>
            </div>

            {/* Waste Activity Timeline */}
            <div className="rounded-xl border border-white/8 bg-[#0D1117] p-5">
              <SectionHeading title="Waste Activity Timeline" />
              <div className="space-y-3">
                {[
                  { time: '5 PM', percent: 22 },
                  { time: '6 PM', percent: 41 },
                  { time: '7 PM', percent: 67 },
                  { time: '8 PM', percent: 82 },
                ].map((item) => (
                  <div key={item.time} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">{item.time}</span>
                      <span className={`font-medium ${item.percent > 75 ? 'text-red-400' : item.percent > 55 ? 'text-yellow-400' : 'text-[#00FF9C]'}`}>
                        {item.percent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${item.percent}%`,
                          background: item.percent > 75 ? '#FF3B5C' : item.percent > 55 ? '#FFC857' : '#00FF9C',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone Heatmap */}
            <div className="rounded-xl border border-white/8 bg-[#0D1117] p-5">
              <SectionHeading title="Zone Waste Heatmap" />
              <div className="space-y-2">
                {(() => {
                  const activeZones = selectedEvent ? zones.filter(z => z.location_id === selectedEvent) : zones;
                  
                  // If we have real zones, compute stats dynamically
                  if (activeZones.length > 0) {
                    const isPointInPolygon = (point: [number, number], vs: [number, number][]) => {
                      let x = point[0], y = point[1];
                      let inside = false;
                      for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                        let xi = vs[i][0], yi = vs[i][1];
                        let xj = vs[j][0], yj = vs[j][1];
                        let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                        if (intersect) inside = !inside;
                      }
                      return inside;
                    };

                    const zoneStats = activeZones.map(zone => {
                      // Note: polygon expects [lat, lng], so we pass [d.latitude, d.longitude] to check
                      const devicesInZone = devices.filter(d => 
                        d.latitude && d.longitude && zone.boundary && 
                        isPointInPolygon([d.latitude, d.longitude], zone.boundary as [number, number][])
                      );
                      
                      let avgFill = devicesInZone.length > 0
                        ? Math.round(devicesInZone.reduce((sum, d) => sum + (d.fill_level || 0), 0) / devicesInZone.length)
                        : 0;
                      
                      let level = 'Low';
                      if (avgFill > 75) level = 'High';
                      else if (avgFill > 50) level = 'Medium';

                      return { zone: zone.name, level, pct: avgFill, color: zone.color || '#00FF9C' };
                    });

                    // Sort by highest pct first
                    zoneStats.sort((a, b) => b.pct - a.pct);

                    return zoneStats.map((z) => (
                      <div key={z.zone} className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1.5">
                            <span className="text-sm font-medium text-white">{z.zone}</span>
                            <span className="text-xs" style={{ color: z.color }}>
                              {z.level} ({z.pct}%)
                            </span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${z.pct}%`, backgroundColor: z.color }} />
                          </div>
                        </div>
                      </div>
                    ));
                  } else {
                    // Fallback dummy data if no zones exist
                    return [
                      { zone: 'Food Court', level: 'High', pct: 84, color: '#FF3B5C' },
                      { zone: 'Stage Area', level: 'Medium', pct: 56, color: '#FFC857' },
                      { zone: 'Entrance', level: 'Low', pct: 23, color: '#00FF9C' },
                    ].map((z) => (
                      <div key={z.zone} className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1.5">
                            <span className="text-sm font-medium text-white">{z.zone}</span>
                            <span className="text-xs" style={{ color: z.color }}>{z.level}</span>
                          </div>
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${z.pct}%`, backgroundColor: z.color }} />
                          </div>
                        </div>
                      </div>
                    ));
                  }
                })()}
              </div>
            </div>
          </div>

          {/* Right: Alerts + Performance */}
          <div className="space-y-6">

            {/* Alerts */}
            <div className="rounded-xl border border-white/8 bg-[#0D1117] p-5">
              <SectionHeading
                title="Critical Alerts"
                action={
                  criticalAlerts > 0
                    ? <span className="inline-flex items-center gap-1 text-xs text-red-400">{criticalAlerts} active</span>
                    : null
                }
              />
              <div className="space-y-2">
                {criticalAlerts === 0 ? (
                  <div className="py-6 text-center text-sm text-white/25">No active alerts</div>
                ) : (
                  <p className="text-sm text-white/40">Alerts loaded from devices</p>
                )}
              </div>
            </div>

            {/* Performance */}
            <div className="rounded-xl border border-white/8 bg-[#0D1117] p-5">
              <SectionHeading title="Event Performance" />
              <div className="space-y-2">
                {[
                  { label: 'Collection Efficiency', value: '91%' },
                  { label: 'Average Fill Rate', value: '63%' },
                  { label: 'Response Time', value: '6 min' },
                  { label: 'Cleaning Cycles', value: '148' },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all"
                  >
                    <span className="text-xs text-white/50">{m.label}</span>
                    <span className="text-sm font-semibold text-white">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resource Deployment */}
            <div className="rounded-xl border border-white/8 bg-[#0D1117] p-5">
              <SectionHeading title="Resource Deployment" />
              <div className="space-y-4">
                {[
                  { label: 'Bins Deployed', current: 84, total: 96 },
                  { label: 'Staff Deployed', current: 22, total: 26 },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-white/40">{r.label}</span>
                      <span className="text-white font-medium">{r.current}<span className="text-white/30"> / {r.total}</span></span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00FF9C] rounded-full transition-all duration-700"
                        style={{ width: `${(r.current / r.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Activity */}
            {staff.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-[#0D1117] p-5">
                <SectionHeading title="Staff Activity" />
                <div className="space-y-2">
                  {staff.slice(0, 5).map((s, i) => (
                    <Link 
                      key={i} 
                      href={`/dashboard/hr/staff/${s.id}`}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-[#00FF9C]/30 hover:bg-white/[0.05] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#00FF9C]/30 transition-colors overflow-hidden">
                           {s.photo_url ? (
                             <img src={s.photo_url} alt="" className="w-full h-full object-cover" />
                           ) : (
                             <Users className="w-4 h-4 text-white/20" />
                           )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white group-hover:text-[#00FF9C] transition-colors">{`${s.first_name} ${s.last_name}`.trim()}</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest">{s.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                          s.status === 'Active'
                            ? 'text-[#00FF9C] border-[#00FF9C]/30 bg-[#00FF9C]/10'
                            : 'text-white/30 border-white/10 bg-white/5'
                        }`}>
                          {s.status}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-[#00FF9C] transition-all transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  ))}
                  {staff.length > 5 && (
                    <Link href="/dashboard/hr/staff" className="block text-center pt-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF9C] hover:underline">View All Units</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
