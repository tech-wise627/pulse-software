'use client';

import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IoTDevice } from '@/lib/types';

export interface Zone {
  id: string;
  name: string;
  color: string;
  boundary: Array<[number, number]>;
}

interface BinMapProps {
  devices: IoTDevice[];
  selectedDevice?: string;
  onDeviceClick?: (device: IoTDevice) => void;
  onMapMove?: (center: [number, number], zoom: number) => void;
  center?: [number, number];
  zoom?: number;
  autoFitBounds?: boolean;
  eventBoundary?: Array<[number, number]>; // Polygon boundary coordinates
  zones?: Zone[]; // Optional zones for subdivision
  restrictToBoundary?: boolean; // If true, lock map to event boundary only (manager mode)
}

// Updated color scheme matching PULSE branding
const ICON_COLORS: Record<string, string> = {
  healthy: '#00FF9C',     // Green - healthy
  medium: '#FFC857',      // Yellow - medium fill
  critical: '#FF3B5C',    // Red - critical
  offline: '#5A5F66',     // Gray - offline
};

const getDeviceColor = (device: IoTDevice) => {
  if (!device.is_connected) return 'offline';
  const fillLevel = device.fill_level ?? 0;
  if (device.battery_level < 20) return 'critical';
  if (device.is_tilted) return 'critical';
  if (fillLevel > 80) return 'critical';
  if (fillLevel > 50) return 'medium';
  return 'healthy';
};

export default function BinMap({
  devices,
  selectedDevice,
  onDeviceClick,
  center = [20.5937, 78.9629],
  zoom = 5,
  autoFitBounds = true,
  eventBoundary,
  zones = [],
  restrictToBoundary = false,
}: BinMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const boundaryRef = useRef<any>(null);
  const zonesRef = useRef<Map<string, any>>(new Map());
  const maskLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    if (!map.current) {
      map.current = L.map(mapContainer.current, {
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: false,
      }).setView(center, zoom);

      // Use Carto Dark tile layer for minimal operational map style
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }).addTo(map.current);
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      map.current?.removeLayer(marker);
    });
    markersRef.current.clear();

    // Draw event boundary if provided
    if (eventBoundary && eventBoundary.length >= 3) {
      // Remove old boundary
      if (boundaryRef.current && map.current) {
        map.current.removeLayer(boundaryRef.current);
      }

      // Draw new boundary polygon
      boundaryRef.current = L.polygon(eventBoundary, {
        color: '#00FF9C',
        weight: 3,
        opacity: 0.8,
        fillColor: '#00FF9C',
        fillOpacity: 0.1,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '5, 5',
      }).addTo(map.current!);

      // Add glow effect
      boundaryRef.current.setStyle({
        className: 'event-boundary',
      });

      console.log('[v0] Event boundary rendered:', eventBoundary);

      // If restrictToBoundary is enabled, lock the map to this area
      if (restrictToBoundary && map.current) {
        const bounds = L.latLngBounds(eventBoundary);
        
        // Set max bounds to restrict panning
        map.current.setMaxBounds(bounds);
        
        // Create mask effect - dark overlay outside boundary
        const mapBounds = map.current.getBounds();
        const sw = mapBounds.getSouthWest();
        const ne = mapBounds.getNorthEast();
        
        // Create a rectangle that covers the whole map
        const outerBounds: [number, number][] = [
          [sw.lat - 1, sw.lng - 1],
          [sw.lat - 1, ne.lng + 1],
          [ne.lat + 1, ne.lng + 1],
          [ne.lat + 1, sw.lng - 1],
        ];
        
        // Combine outer bounds with inverted boundary (creates the mask)
        const maskPolygon = [...outerBounds, ...eventBoundary.reverse()];
        
        if (maskLayerRef.current && map.current) {
          map.current.removeLayer(maskLayerRef.current);
        }
        
        maskLayerRef.current = L.polygon(maskPolygon, {
          color: '#000000',
          weight: 0,
          opacity: 0,
          fillColor: '#0B0F14',
          fillOpacity: 0.85,
          interactive: false,
        }).addTo(map.current);
        
        // Send mask layer to back
        maskLayerRef.current.bringToBack();
        
        // Restrict zoom levels
        map.current.setMinZoom(13);
        map.current.setMaxZoom(18);
        
        console.log('[v0] Boundary restriction enabled - map locked to event area');
      }
    }

    // Draw zones if provided
    if (zones && zones.length > 0) {
      // Clear old zones
      zonesRef.current.forEach((zone) => {
        map.current?.removeLayer(zone);
      });
      zonesRef.current.clear();

      // Draw each zone
      zones.forEach((zone) => {
        if (zone.boundary && zone.boundary.length >= 3) {
          const zonePolygon = L.polygon(zone.boundary, {
            color: zone.color,
            weight: 2,
            opacity: 0.6,
            fillColor: zone.color,
            fillOpacity: 0.1,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map.current!);

          // Add zone label
          const bounds = L.latLngBounds(zone.boundary);
          const center = bounds.getCenter();

          L.marker(center, {
            icon: L.divIcon({
              html: `<div class="text-xs font-bold text-white bg-black/60 px-2 py-1 rounded pointer-events-none">${zone.name}</div>`,
              className: 'zone-label',
              iconSize: [50, 20],
              iconAnchor: [25, 10],
            }),
          }).addTo(map.current!);

          zonesRef.current.set(zone.id, zonePolygon);
        }
      });

      console.log('[v0] Zones rendered:', zones.length);
    }

    // Add markers for devices
    devices.forEach((device) => {
      if (device.latitude && device.longitude) {
        const color = getDeviceColor(device);
        const iconColor = ICON_COLORS[color];

        // Create premium bin icon with SVG
        const icon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center w-10 h-10 group">
              <!-- Strategic Glow Background -->
              <div class="absolute inset-0 rounded-full blur-[10px] opacity-20 group-hover:opacity-50 transition-all duration-500" 
                   style="background-color: ${iconColor};"></div>
              
              <!-- Premium Bin SVG -->
              <div class="relative w-7 h-7 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]">
                  <!-- Bin Body -->
                  <path d="M5 8L6.5 20C6.6 20.8 7.3 21.5 8.2 21.5H15.8C16.7 21.5 17.4 20.8 17.5 20L19 8H5Z" 
                        fill="${iconColor}" fill-opacity="0.9" stroke="white" stroke-width="0.5" />
                  <!-- Bin Lid -->
                  <path d="M4 6C4 5.4 4.4 5 5 5H19C19.6 5 20 5.4 20 6V8H4V6Z" 
                        fill="${iconColor}" stroke="white" stroke-width="0.5" />
                  <!-- Handle -->
                  <path d="M10 5V3.5C10 3.2 10.2 3 10.5 3H13.5C13.8 3 14 3.2 14 3.5V5" 
                        stroke="white" stroke-width="0.5" stroke-linecap="round" />
                  <!-- Fill Level Indicator (Simulated) -->
                  <rect x="7" y="10" width="10" height="9" rx="1" fill="white" fill-opacity="0.1" />
                  <rect x="7" y="${19 - (device.fill_level || 0) / 10}" width="10" height="${(device.fill_level || 0) / 10}" rx="1" fill="white" fill-opacity="0.3" />
                </svg>
              </div>
              
              <!-- Quick-View Telemetry Label -->
              <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/90 text-[#00FF9C] text-[9px] font-black px-2 py-0.5 rounded-full border border-[#00FF9C]/20 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-[0_0_15px_#00FF9C40]">
                ${Math.round(device.fill_level || 0)}% SATURATION
              </div>
            </div>
          `,
          className: 'bin-marker-premium',
          iconSize: [40, 40],
          popupAnchor: [0, -15],
        });

        const marker = L.marker([device.latitude, device.longitude], { icon }).addTo(
          map.current!
        );

        const statusText = !device.is_connected ? 'Offline' : 'Connected';

        marker.bindPopup(`
          <div class="p-4 bg-[#0D1117] border border-white/10 rounded-2xl shadow-2xl min-w-[180px] backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Node Telemetry</span>
              <div class="w-1.5 h-1.5 rounded-full" style="background-color: ${iconColor}; box-shadow: 0 0 10px ${iconColor}"></div>
            </div>
            <div class="space-y-3">
              <div>
                <div class="text-[10px] font-black uppercase tracking-widest text-[#00FF9C] mb-0.5">${device.name}</div>
                <div class="text-[9px] font-medium text-white/20 tracking-tighter">${device.device_id}</div>
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-white/5 rounded-lg p-2 border border-white/5">
                  <div class="text-[8px] font-black uppercase text-white/20 mb-1">Saturation</div>
                  <div class="text-sm font-black text-white" style="color: ${iconColor}">${device.fill_level}%</div>
                </div>
                <div class="bg-white/5 rounded-lg p-2 border border-white/5">
                  <div class="text-[8px] font-black uppercase text-white/20 mb-1">Power</div>
                  <div class="text-sm font-black text-white">${device.battery_level}%</div>
                </div>
              </div>
              
              <div class="flex items-center gap-2 text-[9px] font-bold text-white/40 italic">
                <div class="w-1 h-1 rounded-full bg-white/20"></div>
                Last Sync: ${device.last_sync ? new Date(device.last_sync).toLocaleTimeString() : 'N/A'}
              </div>
            </div>
          </div>
        `, {
          className: 'custom-premium-popup',
          closeButton: false,
        });

        marker.on('click', () => {
          onDeviceClick?.(device);
          marker.openPopup();
        });

        if (device.id === selectedDevice) {
          marker.openPopup();
        }

        markersRef.current.set(device.id, marker);
      }
    });

    // Auto-fit bounds if enabled and devices exist
    if (autoFitBounds && (devices.length > 0 || (eventBoundary && eventBoundary.length > 0))) {
      let bounds: any;

      if (eventBoundary && eventBoundary.length > 0) {
        // Fit to boundary first
        bounds = L.latLngBounds(eventBoundary);
      } else {
        // Otherwise fit to devices
        bounds = L.latLngBounds(
          devices
            .filter((d) => d.latitude && d.longitude)
            .map((d) => [d.latitude as number, d.longitude as number])
        );
      }

      if (bounds.isValid()) {
        map.current?.fitBounds(bounds, { 
          padding: [50, 50],
          maxZoom: 17,
          animate: true,
          duration: 0.5,
        });
      }
    }
  }, [devices, selectedDevice, center, zoom, onDeviceClick, autoFitBounds, eventBoundary, zones, restrictToBoundary]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg border border-primary/20 overflow-hidden"
      style={{ minHeight: '400px', backgroundColor: '#0B0F14' }}
    />
  );
}
