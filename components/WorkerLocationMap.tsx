'use client';

import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, MapPin, Radio, Droplet, Battery, Clock } from 'lucide-react';
import { Zone, IoTDevice } from '@/lib/types';
import { getBinStatus } from '@/lib/bin-colors';

interface WorkerLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'idle' | 'offline';
  isOutOfBounds: boolean;
  lastUpdated: string;
}

interface WorkerLocationMapProps {
  workers: WorkerLocation[];
  eventBoundary?: [number, number][];
  zones?: Zone[];
  bins?: IoTDevice[];
  centerLocation?: [number, number];
  onBinClick?: (id: string) => void;
}

// Helper function to check if point is within polygon
function isPointInBoundary(lat: number, lon: number, boundary: [number, number][]): boolean {
  if (!boundary || boundary.length < 3) return true;
  
  let inside = false;
  for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
    const [lat1, lon1] = boundary[i];
    const [lat2, lon2] = boundary[j];
    
    if (
      lon > Math.min(lon1, lon2) &&
      lon <= Math.max(lon1, lon2) &&
      lat <= Math.max(lat1, lat2) &&
      lat > Math.min(lat1, lat2)
    ) {
      if (lon1 !== lon2) {
        const intersectLat = ((lon - lon1) * (lat2 - lat1)) / (lon2 - lon1) + lat1;
        if (lat < intersectLat) inside = !inside;
      }
    }
  }
  return inside;
}

export default function WorkerLocationMap({
  workers,
  eventBoundary,
  zones = [],
  bins = [],
  centerLocation = [20.5937, 78.9629],
  onBinClick,
}: WorkerLocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const binsRef = useRef<Map<string, any>>(new Map());
  const boundaryRef = useRef<any>(null);
  const zonesRef = useRef<any[]>([]);
  const [outOfBoundsWorkers, setOutOfBoundsWorkers] = useState<WorkerLocation[]>([]);
  const [showBins, setShowBins] = useState(true);
  const [showZones, setShowZones] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map only once
    if (!map.current) {
      map.current = L.map(mapContainer.current, {
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: false,
        zoomControl: true,
      }).setView(centerLocation, 16);

      // Use Carto Dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO',
        maxZoom: 19,
      }).addTo(map.current);
    }

    // Draw event boundary if provided
    if (eventBoundary && eventBoundary.length >= 3) {
      if (boundaryRef.current) {
        map.current!.removeLayer(boundaryRef.current);
      }

      boundaryRef.current = L.polygon(eventBoundary, {
        color: '#00FF9C',
        weight: 2,
        opacity: 0.8,
        fillColor: '#00FF9C',
        fillOpacity: 0.05,
        dashArray: '8, 4',
      }).addTo(map.current!);

      // Fit map to boundary
      const bounds = boundaryRef.current.getBounds();
      map.current!.fitBounds(bounds, { padding: [60, 60] });
    }

    // Draw zones
    zonesRef.current.forEach(z => map.current?.removeLayer(z));
    zonesRef.current = [];

    if (showZones) {
      zones.forEach(zone => {
        if (zone.boundary && zone.boundary.length >= 3) {
          const polygon = L.polygon(zone.boundary, {
            color: zone.color,
            weight: 1.5,
            opacity: 0.4,
            fillColor: zone.color,
            fillOpacity: 0.1,
          }).addTo(map.current!);

          polygon.bindTooltip(zone.name, {
            permanent: true,
            direction: 'center',
            className: 'zone-tactical-label'
          });

          zonesRef.current.push(polygon);
        }
      });
    }

    // Update Bin markers
    binsRef.current.forEach((marker) => map.current?.removeLayer(marker));
    binsRef.current.clear();

    if (showBins) {
      bins?.forEach((device) => {
        const binStatus = getBinStatus(device.fill_level ?? 0, device.is_connected);
        const iconColor = binStatus.color;

        const binHtml = `
          <div class="relative flex items-center justify-center w-8 h-8 group">
            <div class="absolute inset-0 rounded-full blur-[6px] opacity-20 group-hover:opacity-50 transition-all duration-300" 
                 style="background-color: ${iconColor};"></div>
            <div class="relative w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-[0_0_3px_rgba(0,0,0,0.5)]">
                <path d="M5 8L6.5 20C6.6 20.8 7.3 21.5 8.2 21.5H15.8C16.7 21.5 17.4 20.8 17.5 20L19 8H5Z" 
                      fill="${iconColor}" fill-opacity="0.9" stroke="white" stroke-width="0.5" />
                <path d="M4 6C4 5.4 4.4 5 5 5H19C19.6 5 20 5.4 20 6V8H4V6Z" 
                      fill="${iconColor}" stroke="white" stroke-width="0.5" />
                <path d="M10 5V3.5C10 3.2 10.2 3 10.5 3H13.5C13.8 3 14 3.2 14 3.5V5" 
                      stroke="white" stroke-width="0.4" stroke-linecap="round" />
                <rect x="7" y="10" width="10" height="9" rx="1" fill="white" fill-opacity="0.1" />
                <rect x="7" y="${19.5 - ((device.fill_level ?? 0) / 100) * 10}" width="10" height="${((device.fill_level ?? 0) / 100) * 10}" rx="1" fill="white" fill-opacity="0.3" />
              </svg>
            </div>
            <div class="absolute -top-5 left-1/2 -translate-x-1/2 bg-black/90 text-[#00FF9C] text-[8px] font-black px-1.5 py-0.5 rounded-full border border-[#00FF9C]/20 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-xl">
              ${device.fill_level ?? 0}% FULL
            </div>
          </div>
        `;

        const binIcon = L.divIcon({
          html: binHtml,
          className: 'bin-marker-compact',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -10],
        });

        const binMarker = L.marker([device.latitude, device.longitude], { icon: binIcon }).addTo(map.current!);
        
        const popupContent = `
          <div class="tactical-node-badge">
            <div class="badge-header">${device.name}</div>
            <div class="badge-stats">
              <span class="stat-label">LOAD</span>
              <span class="stat-value" style="color: ${iconColor}">${device.fill_level ?? 0}%</span>
            </div>
          </div>
        `;

        binMarker.bindPopup(popupContent, {
          className: 'bin-tactical-popup',
          closeButton: false,
        });

        binMarker.on('click', () => {
          if (onBinClick) onBinClick(device.id);
        });

        binsRef.current.set(device.id, binMarker);
      });
    }

    // Update worker markers

    // Update worker markers
    const workersOutOfBounds: WorkerLocation[] = [];

    workers.forEach((worker) => {
      const isOutOfBounds = eventBoundary
        ? !isPointInBoundary(worker.latitude, worker.longitude, eventBoundary)
        : false;

      if (isOutOfBounds) {
        workersOutOfBounds.push(worker);
      }

      // Determine marker color based on status and boundary
      let markerColor = '#00FF9C'; // Emerald for active
      if (isOutOfBounds) {
        markerColor = '#FF3B5C'; // Neon red for out of bounds
      } else if (worker.status === 'idle') {
        markerColor = '#FFC857'; // Amber for idle
      } else if (worker.status === 'offline') {
        markerColor = '#5A5F66'; // Muted for offline
      }

      // Create or update marker
      let marker = markersRef.current.get(worker.id);
      if (!marker) {
        const icon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center w-10 h-10 group">
              <div class="absolute inset-0 rounded-full blur-[8px] opacity-40 group-hover:opacity-70 transition-opacity animate-pulse" 
                   style="background-color: ${markerColor}"></div>
              <div class="relative w-7 h-7 rounded-full border-[1.5px] border-white/40 flex items-center justify-center overflow-hidden" 
                   style="background: radial-gradient(circle at 30% 30%, ${markerColor} 0%, ${markerColor}90 100%);">
                <div class="w-2 h-2 rounded-full bg-white shadow-lg"></div>
              </div>
            </div>
          `,
          className: 'worker-marker-premium',
          iconSize: [40, 40],
          popupAnchor: [0, -20],
        });

        marker = L.marker([worker.latitude, worker.longitude], { icon }).addTo(
          map.current!
        );

        const popupContent = `
          <div class="p-4 bg-[#0D1117] border border-white/10 rounded-2xl shadow-2xl min-w-[200px] backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Personnel Stream</span>
              <div class="w-1.5 h-1.5 rounded-full animate-ping" style="background-color: ${markerColor}"></div>
            </div>
            <div class="space-y-4">
              <div>
                <div class="text-[11px] font-black uppercase tracking-widest text-[#00FF9C] mb-0.5">${worker.name}</div>
                <div class="text-[9px] font-medium text-white/20 tracking-tighter italic">ID: ${worker.id}</div>
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-white/5 rounded-lg p-2 border border-white/5">
                  <div class="text-[8px] font-black uppercase text-white/20 mb-1">Status</div>
                  <div class="text-[9px] font-black text-white uppercase tracking-widest" style="color: ${markerColor}">${worker.status}</div>
                </div>
                <div class="bg-white/5 rounded-lg p-2 border border-white/5">
                  <div class="text-[8px] font-black uppercase text-white/20 mb-1">Vector</div>
                  <div class="text-[9px] font-black text-white uppercase">${isOutOfBounds ? 'Breached' : 'Secured'}</div>
                </div>
              </div>
              
              <div class="flex items-center gap-2 text-[9px] font-bold text-white/40 italic">
                <div class="w-1 h-1 rounded-full bg-white/20"></div>
                Sync Level: 98% • ${new Date(worker.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          className: 'custom-premium-popup',
          closeButton: false,
        });
        markersRef.current.set(worker.id, marker);
      } else {
        // Update marker position and appearance
        marker.setLatLng([worker.latitude, worker.longitude]);
        const icon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center w-10 h-10 group">
              <div class="absolute inset-0 rounded-full blur-[8px] opacity-40 group-hover:opacity-70 transition-opacity animate-pulse" 
                   style="background-color: ${markerColor}"></div>
              <div class="relative w-7 h-7 rounded-full border-[1.5px] border-white/40 flex items-center justify-center overflow-hidden" 
                   style="background: radial-gradient(circle at 30% 30%, ${markerColor} 0%, ${markerColor}90 100%);">
                <div class="w-2 h-2 rounded-full bg-white shadow-lg"></div>
              </div>
            </div>
          `,
          className: 'worker-marker-premium',
          iconSize: [40, 40],
          popupAnchor: [0, -20],
        });
        marker.setIcon(icon);
      }
    });

    setOutOfBoundsWorkers(workersOutOfBounds);
  }, [workers, eventBoundary, zones, bins, centerLocation, onBinClick, showBins, showZones]);

  const activeWorkers = workers.filter((w) => w.status === 'active').length;
  const offlineWorkers = workers.filter((w) => w.status === 'offline').length;
  const [isPersonnelListExpanded, setIsPersonnelListExpanded] = useState(false);

  return (
    <div className="relative group bg-white/[0.03] border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-md shadow-2xl transition-all">
      <div className="p-5 lg:p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.01]">
        <div className="flex items-center gap-4 lg:gap-5">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-[#00FF9C]/10 border border-[#00FF9C]/20 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 lg:w-6 lg:h-6 text-[#00FF9C]" />
          </div>
          <div>
            <h3 className="text-xs lg:text-sm font-black uppercase tracking-[0.2em] text-white">Personnel Telemetry</h3>
            <p className="text-[9px] lg:text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5 whitespace-nowrap">Real-time vector tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl bg-[#00FF9C]/5 border border-[#00FF9C]/10 flex items-center gap-2 lg:gap-3">
             <div className="w-1 lg:w-1.5 h-1 lg:h-1.5 rounded-full bg-[#00FF9C] animate-ping" />
             <span className="text-[9px] lg:text-[10px] font-black text-[#00FF9C] uppercase tracking-widest leading-none">{activeWorkers} Active</span>
          </div>
          {offlineWorkers > 0 && (
            <div className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 lg:gap-3">
               <div className="w-1 lg:w-1.5 h-1 lg:h-1.5 rounded-full bg-white/20" />
               <span className="text-[9px] lg:text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">{offlineWorkers} Silent</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <div
          ref={mapContainer}
          className="rounded-b-[1.5rem] lg:rounded-b-[2rem]"
          style={{
            width: '100%',
            height: '100%',
            minHeight: '400px',
            backgroundColor: '#080C10',
          }}
        />

        <div className="absolute top-4 right-4 lg:top-6 lg:right-6 z-[1000] flex flex-col gap-2">
           <button 
             onClick={() => setShowZones(!showZones)}
             className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl backdrop-blur-xl border transition-all flex items-center gap-2 lg:gap-3 ${
               showZones ? 'bg-[#00FF9C]/10 border-[#00FF9C]/30 text-[#00FF9C]' : 'bg-white/5 border-white/10 text-white/30'
             }`}
           >
              <div className={`w-1 lg:w-1.5 h-1 lg:h-1.5 rounded-full ${showZones ? 'bg-[#00FF9C] shadow-[0_0_8px_#00FF9C]' : 'bg-white/20'}`} />
              <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest">Zone Overlay</span>
           </button>
           <button 
             onClick={() => setShowBins(!showBins)}
             className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl backdrop-blur-xl border transition-all flex items-center gap-2 lg:gap-3 ${
               showBins ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/10 text-white/30'
             }`}
           >
              <div className={`w-1 lg:w-1.5 h-1 lg:h-1.5 rounded-full ${showBins ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-white/20'}`} />
              <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest">Asset Layer</span>
           </button>
        </div>

        {/* Tactical Worker Overlay - now collapsible */}
        <div className={`absolute bottom-4 right-4 lg:bottom-6 lg:right-6 z-[1000] sm:w-64 bg-[#0D1117]/85 backdrop-blur-2xl border border-white/10 rounded-[1.2rem] lg:rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isPersonnelListExpanded ? 'w-[calc(100%-2rem)] max-h-[250px] lg:max-h-[350px]' : 'w-auto max-h-[50px] lg:max-h-[60px]'
        }`}>
           <div 
             className="p-3 lg:p-4 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group/header"
             onClick={() => setIsPersonnelListExpanded(!isPersonnelListExpanded)}
           >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Radio className={`w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#00FF9C] ${activeWorkers > 0 ? 'animate-pulse' : ''}`} />
                  {!isPersonnelListExpanded && activeWorkers > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#00FF9C] rounded-full border border-[#0D1117] shadow-[0_0_5px_#00FF9C]" />
                  )}
                </div>
                <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-white">Personnel ({workers.length})</span>
              </div>
              <div className="flex items-center gap-2">
                 {!isPersonnelListExpanded && outOfBoundsWorkers.length > 0 && (
                   <div className="px-1.5 py-0.5 bg-[#FF3B5C]/20 border border-[#FF3B5C]/40 rounded text-[6px] font-black text-[#FF3B5C] animate-pulse">
                     {outOfBoundsWorkers.length} ALERT
                   </div>
                 )}
                 <button className="text-white/40 group-hover/header:text-[#00FF9C] transition-colors text-xs font-black">
                   {isPersonnelListExpanded ? '−' : '+'}
                 </button>
              </div>
           </div>
           
           {isPersonnelListExpanded && (
             <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
               {workers.length === 0 ? (
                 <div className="py-6 text-center opacity-20">
                    <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest italic">No Active Signals</p>
                 </div>
               ) : (
                 workers.map((worker) => (
                   <div
                     key={worker.id}
                     className={`p-3 rounded-xl border transition-all duration-300 ${
                       worker.isOutOfBounds
                         ? 'bg-[#FF3B5C]/10 border-[#FF3B5C]/30'
                         : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                     }`}
                   >
                     <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                           <div className="w-1.5 h-1.5 rounded-full shrink-0" 
                                style={{ 
                                  backgroundColor: worker.isOutOfBounds ? '#FF3B5C' : 
                                                  worker.status === 'active' ? '#00FF9C' : 
                                                  worker.status === 'idle' ? '#FFC857' : '#5A5F66',
                                  boxShadow: `0 0 10px ${worker.isOutOfBounds ? '#FF3B5C' : worker.status === 'active' ? '#00FF9C' : 'transparent'}`
                                }} />
                           <div className="truncate">
                             <p className="text-[9px] lg:text-[10px] font-black text-white uppercase tracking-widest leading-none truncate">{worker.name}</p>
                             <p className="text-[7px] lg:text-[8px] font-bold text-white/20 uppercase tracking-tighter mt-1">{worker.status}</p>
                           </div>
                        </div>
                        {worker.isOutOfBounds && (
                          <div className="px-1.5 py-0.5 bg-[#FF3B5C] rounded-md text-[6px] font-black text-white uppercase tracking-widest shrink-0">BREACH</div>
                        )}
                     </div>
                   </div>
                 ))
               )}
             </div>
           )}
        </div>
      </div>
      <style jsx global>{`
        .zone-tactical-label {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: rgba(255, 255, 255, 0.4) !important;
          font-size: 8px !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.25em !important;
          padding: 0 !important;
          backdrop-filter: none !important;
          text-shadow: 0 0 10px rgba(0,0,0,0.8), 0 0 5px rgba(255,255,255,0.05) !important;
          white-space: nowrap !important;
          pointer-events: none !important;
        }
        .zone-tactical-label::before {
          display: none !important;
        }
        .leaflet-tooltip-top.zone-tactical-label::before,
        .leaflet-tooltip-bottom.zone-tactical-label::before,
        .leaflet-tooltip-left.zone-tactical-label::before,
        .leaflet-tooltip-right.zone-tactical-label::before {
          border: none !important;
        }

        /* Minimal Tactical Popups */
        .leaflet-popup.bin-tactical-popup .leaflet-popup-content-wrapper,
        .leaflet-popup.bin-tactical-popup .leaflet-popup-tip {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
        }
        .leaflet-popup.bin-tactical-popup .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }
        
        .tactical-node-badge {
          background: rgba(13, 17, 23, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 8px 12px;
          min-width: 120px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }
        .badge-header {
          font-size: 10px;
          font-weight: 900;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 4px;
        }
        .badge-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .stat-label {
          font-size: 8px;
          font-weight: 700;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.2em;
        }
        .stat-value {
          font-size: 10px;
          font-weight: 900;
        }
      `}</style>
    </div>
  );
}
