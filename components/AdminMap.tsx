'use client';

import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EventLocation, IoTDevice, Zone } from '@/lib/types';

interface AdminMapProps {
  locations: EventLocation[];
  devices: IoTDevice[];
  zones?: Zone[];
  selectedEventId?: string;
  onEventSelect?: (eventId: string) => void;
}

export default function AdminMap({
  locations,
  devices,
  zones = [],
  selectedEventId,
  onEventSelect,
}: AdminMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const polygonsRef = useRef<Map<string, any>>(new Map());
  const zonePolygonsRef = useRef<Map<string, any>>(new Map());
  const eventMarkersRef = useRef<Map<string, any>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    if (!map.current) {
      try {
        console.log('[v0] Initializing AdminMap...');
        // Default center (Pune/Mumbai area) or first location
        const defaultCenter: [number, number] = [19.0760, 72.8777];
        const center: [number, number] = locations.length > 0 
          ? [locations[0].latitude, locations[0].longitude] 
          : defaultCenter;
        
        map.current = L.map(mapContainer.current, {
          dragging: true,
          touchZoom: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
        }).setView(center, locations.length > 0 ? 13 : 5);

        // Use Carto Light for dark theme compat
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; CARTO',
          maxZoom: 19,
        }).addTo(map.current);

        setMapReady(true);
        console.log('[v0] AdminMap initialized successfully');
      } catch (error) {
        console.error('[v0] Error initializing admin map:', error);
        return;
      }
    }
  }, [locations.length > 0]); // Re-init center logic if first location arrives

  // Handle markers and polygons
  useEffect(() => {
    if (!map.current || !mapReady) return;

    try {
      console.log('[v0] Updating AdminMap features:', { locationsCount: locations.length, devicesCount: devices.length });

      // Clean up markers/polygons that are no longer in the arrays
      const currentLocIds = new Set(locations.map(l => l.id));
      const currentDevIds = new Set(devices.map(d => d.id));

      eventMarkersRef.current.forEach((marker, id) => {
        if (!currentLocIds.has(id)) {
          map.current?.removeLayer(marker);
          eventMarkersRef.current.delete(id);
        }
      });

      polygonsRef.current.forEach((polygon, id) => {
        if (!currentLocIds.has(id)) {
          map.current?.removeLayer(polygon);
          polygonsRef.current.delete(id);
        }
      });

      markersRef.current.forEach((marker, id) => {
        if (!currentDevIds.has(id)) {
          map.current?.removeLayer(marker);
          markersRef.current.delete(id);
        }
      });

      const currentZoneIds = new Set(zones.map(z => z.id));
      zonePolygonsRef.current.forEach((polygon, id) => {
        if (!currentZoneIds.has(id)) {
          map.current?.removeLayer(polygon);
          zonePolygonsRef.current.delete(id);
        }
      });

      // 1. Add/Update Event Markers and Boundaries
      locations.forEach((location) => {
        if (!location.latitude || !location.longitude) {
          console.warn('[v0] Location missing coordinates:', location.name);
          return;
        }

        console.log('[v0] Processing location:', location.name, { lat: location.latitude, lng: location.longitude });
        
        // ... (event icon code) ...
        const eventIcon = L.divIcon({
          html: `
            <div class="flex items-center justify-center rounded-full border-2 border-white text-white text-xs font-bold bg-blue-600 shadow-xl" 
                 style="width: 28px; height: 28px; box-shadow: 0 0 12px rgba(37, 99, 235, 0.4);">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          `,
          className: 'event-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        let eventMarker = eventMarkersRef.current.get(location.id);
        if (!eventMarker) {
          console.log('[v0] Creating marker for location:', location.name);
          eventMarker = L.marker([location.latitude, location.longitude], { icon: eventIcon }).addTo(map.current!);
          eventMarker.bindPopup(`<div class="p-1 font-sans"><div class="font-bold text-sm mb-1">${location.name}</div><div class="text-xs text-slate-500">${location.address || ''}</div></div>`);
          eventMarker.on('click', () => onEventSelect?.(location.id));
          eventMarkersRef.current.set(location.id, eventMarker);
        } else {
          eventMarker.setLatLng([location.latitude, location.longitude]).setIcon(eventIcon);
        }

        // Event Boundary
        if (location.boundary && location.boundary.length > 0) {
          console.log('[v0] Processing boundary for:', location.name, 'points:', location.boundary.length);
          let polygon = polygonsRef.current.get(location.id);
          if (!polygon) {
            console.log('[v0] Creating polygon for location:', location.name);
            polygon = L.polygon(location.boundary as [number, number][], {
              color: '#3B82F6',
              weight: 2,
              opacity: 0.8,
              fillColor: '#3B82F6',
              fillOpacity: 0.15,
              dashArray: '5, 5',
            }).addTo(map.current!);
            polygonsRef.current.set(location.id, polygon);
          } else {
            polygon.setLatLngs(location.boundary as [number, number][]);
          }
        }
      });

      // 1.5 Add/Update Zones
      zones.forEach(zone => {
        if (zone.boundary && zone.boundary.length > 0) {
          // If specific event is selected, only show zones for that event
          if (selectedEventId && zone.location_id !== selectedEventId) {
            const existingPolygon = zonePolygonsRef.current.get(zone.id);
            if (existingPolygon) {
              map.current?.removeLayer(existingPolygon);
              zonePolygonsRef.current.delete(zone.id);
            }
            return;
          }

          let polygon = zonePolygonsRef.current.get(zone.id);
          if (!polygon) {
            polygon = L.polygon(zone.boundary as [number, number][], {
              color: zone.color || '#3B82F6',
              weight: 2,
              opacity: 0.9,
              fillColor: zone.color || '#3B82F6',
              fillOpacity: 0.2,
            }).addTo(map.current!);
            polygon.bindPopup(`<div class="font-bold text-sm">${zone.name}</div>`);
            zonePolygonsRef.current.set(zone.id, polygon);
          } else {
            polygon.setLatLngs(zone.boundary as [number, number][]);
            polygon.setStyle({
              color: zone.color || '#3B82F6',
              fillColor: zone.color || '#3B82F6',
            });
          }
        }
      });

      // 2. Add/Update Device Markers
      devices.forEach((device) => {
        if (device.latitude && device.longitude) {
          const fillLevel = device.fill_level || 0;
          let color = '#22C55E'; // Green
          if (fillLevel > 80) color = '#EF4444'; // Red
          else if (fillLevel > 50) color = '#FACC15'; // Yellow

          const icon = L.divIcon({
            html: `
              <div class="flex items-center justify-center rounded-full border-2 border-white text-white text-xs font-bold" 
                   style="width: 32px; height: 32px; background-color: ${color}; box-shadow: 0 0 10px ${color}80; transition: all 0.3s ease;">
                ${fillLevel}%
              </div>
            `,
            className: 'device-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
          });

          let marker = markersRef.current.get(device.id);
          if (!marker) {
            marker = L.marker([device.latitude, device.longitude], { icon }).addTo(map.current!);
            marker.bindPopup(`<div class="text-sm font-sans"><div class="font-bold">${device.name}</div><div class="text-xs mt-1 text-slate-500">Device: ${device.device_id}</div><div class="text-xs mt-1 font-medium" style="color: ${color}">${fillLevel}% Full</div></div>`);
            markersRef.current.set(device.id, marker);
          } else {
            marker.setIcon(icon).setLatLng([device.latitude, device.longitude]);
          }
        }
      });

      // 3. Handle Centering / Fitting Bounds
      if (selectedEventId) {
        const selectedEvent = locations.find(l => l.id === selectedEventId);
        if (selectedEvent) {
          console.log('[v0] Centering on selected event:', selectedEvent.name);
          const boundary = polygonsRef.current.get(selectedEventId);
          if (boundary) {
            map.current.fitBounds(boundary.getBounds(), { padding: [50, 50], animate: true });
          } else {
            map.current.setView([selectedEvent.latitude, selectedEvent.longitude], 15, { animate: true });
          }
        }
      } else if (eventMarkersRef.current.size > 0) {
        // Prioritize fitting all REAL events
        console.log('[v0] Fitting bounds to all events');
        const eventPoints = locations
          .filter(l => l.latitude && l.longitude)
          .map(l => [l.latitude, l.longitude] as any);
        
        if (eventPoints.length > 0) {
          const bounds = L.latLngBounds(eventPoints);
          map.current.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
        }
      } else if (markersRef.current.size > 0) {
        // Fallback to fitting devices
        console.log('[v0] No events found, fitting bounds to devices');
        const devicePoints = devices
          .filter(d => d.latitude && d.longitude)
          .map(d => [d.latitude, d.longitude] as any);
        
        if (devicePoints.length > 0) {
          const bounds = L.latLngBounds(devicePoints);
          map.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      }

      setTimeout(() => {
        if (map.current) {
          map.current.invalidateSize();
          console.log('[v0] Map size invalidated');
        }
      }, 200);
    } catch (error) {
      console.error('[v0] Error updating map features:', error);
    }
  }, [locations, devices, zones, selectedEventId, mapReady]);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-b-lg overflow-hidden">
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10 backdrop-blur-sm">
          <div className="text-slate-400 animate-pulse font-medium">Initializing Map...</div>
        </div>
      )}
      <div 
        ref={mapContainer} 
        style={{ width: '100%', height: '100%' }} 
        className="z-0"
      />
    </div>
  );
}
