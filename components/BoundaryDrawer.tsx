'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Polygon, getPolygonCentroid } from '@/lib/polygon-utils';

interface BoundaryDrawerProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  onBoundarySaved?: (boundary: Polygon) => void;
}

export default function BoundaryDrawer({
  initialCenter = [20.5937, 78.9629],
  initialZoom = 5,
  onBoundarySaved,
}: BoundaryDrawerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [points, setPoints] = useState<Array<[number, number]>>([]);
  const markersRef = useRef<L.Marker[]>([]);
  const polygonRef = useRef<L.Polygon | null>(null);
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const hasSyncedCenter = useRef(false);

  // Map Initialization (once)
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current).setView(initialCenter, initialZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);

    // Initial Center Marker (Target)
    centerMarkerRef.current = L.marker(initialCenter, {
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #ff4d4d; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      })
    })
    .addTo(map.current)
    .bindPopup('Event Grounds Center (from Step 1)');

    map.current.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      const newPoint: [number, number] = [lat, lng];
      
      const marker = L.circleMarker([lat, lng], {
        radius: 6,
        fillColor: '#00FF9C',
        color: '#e4ff4d',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(map.current!);
      
      markersRef.current.push(marker);
      setPoints((prev) => [...prev, newPoint]);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Sync with initialCenter when it changes (mostly after auto-GPS)
  useEffect(() => {
    if (!map.current || hasSyncedCenter.current || points.length > 0) return;
    
    // Only sync if it's not the default India view
    const isDefault = initialCenter[0] === 20.5937 && initialCenter[1] === 78.9629;
    if (!isDefault) {
      hasSyncedCenter.current = true;
      map.current.setView(initialCenter, 16);
    }
  }, [initialCenter[0], initialCenter[1]]);

  // Manage Polygon and Save
  useEffect(() => {
    if (!map.current) return;

    if (points.length >= 3) {
      if (polygonRef.current) map.current.removeLayer(polygonRef.current);
      
      polygonRef.current = L.polygon(points, {
        color: '#00FF9C',
        weight: 2,
        opacity: 0.8,
        fillColor: '#00FF9C',
        fillOpacity: 0.1,
      }).addTo(map.current);
      
      // Notify parent
      onBoundarySaved?.(points);
    }
  }, [points, onBoundarySaved]);

  const handleUndo = () => {
    if (points.length === 0) return;
    const newPoints = points.slice(0, -1);
    setPoints(newPoints);
    const lastMarker = markersRef.current.pop();
    if (lastMarker && map.current) map.current.removeLayer(lastMarker);
  };

  const handleClear = () => {
    setPoints([]);
    markersRef.current.forEach((marker) => map.current?.removeLayer(marker));
    markersRef.current = [];
    if (polygonRef.current && map.current) {
      map.current.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }
  };

  const handleCenterOnPin = () => {
    if (points.length < 3) return;

    const currentCentroid = getPolygonCentroid(points);
    const latOffset = initialCenter[0] - currentCentroid[0];
    const lngOffset = initialCenter[1] - currentCentroid[1];

    if (Math.abs(latOffset) < 0.000001 && Math.abs(lngOffset) < 0.000001) {
      console.log('Already centered!');
      return;
    }

    const newPoints = points.map(([lat, lng]) => [
      lat + latOffset,
      lng + lngOffset
    ] as [number, number]);

    // Update markers on map
    markersRef.current.forEach((marker, i) => {
      marker.setLatLng(newPoints[i]);
    });

    setPoints(newPoints);
    console.log('[v0] Boundary auto-centered on pin');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 text-[10px] uppercase tracking-wider font-bold">
        <span className="text-slate-400">Section 2: Boundary <span className="text-accent ml-2">Points: {points.length}</span></span>
        <div className="flex gap-2">
            <button type="button" onClick={handleCenterOnPin} disabled={points.length < 3} className="text-accent hover:text-accent/80 disabled:opacity-30">Center on Pin</button>
            <button type="button" onClick={handleUndo} disabled={points.length === 0} className="hover:text-white disabled:opacity-30">Undo</button>
            <button type="button" onClick={handleClear} disabled={points.length === 0} className="hover:text-red-400 disabled:opacity-30 text-red-500">Clear</button>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 relative">
        <div ref={mapContainer} className="absolute inset-0 z-0" />
      </div>

      {points.length > 0 && points.length < 3 && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-[10px] px-2 py-1 rounded-full text-white z-10 border border-white/10">
          Click {3 - points.length} more points
        </div>
      )}
    </div>
  );
}
