'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { pointInPolygon } from '@/lib/polygon-utils';
import { EventLocation } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Trash2 } from 'lucide-react';

interface ZoneDrawingMapProps {
  event: EventLocation | undefined;
  onZoneComplete?: (zone: {
    name: string;
    boundary: Array<[number, number]>;
    color: string;
  }) => void;
  onDrawingModeChange?: (isDrawing: boolean) => void;
}

const ZONE_COLORS = [
  { name: 'Orange', value: '#FF9F1C' },
  { name: 'Blue', value: '#4A90E2' },
  { name: 'Purple', value: '#9B59B6' },
  { name: 'Green', value: '#27AE60' },
  { name: 'Pink', value: '#E74C3C' },
  { name: 'Cyan', value: '#1ABC9C' },
  { name: 'Gold', value: '#F1C40F' },
];

export default function ZoneDrawingMap({ event, onZoneComplete, onDrawingModeChange }: ZoneDrawingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [points, setPoints] = useState<Array<[number, number]>>([]);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [selectedColor, setSelectedColor] = useState(ZONE_COLORS[0].value);
  const [boundaryValidationError, setBoundaryValidationError] = useState('');
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Effect for map initialization
  useEffect(() => {
    if (!mapContainer.current || !event) return;

    if (!map.current) {
      try {
        map.current = L.map(mapContainer.current).setView([event.latitude, event.longitude], 16);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; CARTO',
          maxZoom: 19,
          minZoom: 10,
        }).addTo(map.current);

        console.log('[v0] Zone drawing map base initialized');
      } catch (error) {
        console.error('[v0] Map initialization error:', error);
      }
    }

    return () => {
      // Don't destroy map between minor renders, but could if needed
    };
  }, [event.id]); // Only re-init if location changes

  // Effect for dynamic layers and handlers (event boundary, clicks)
  useEffect(() => {
    if (!map.current || !event) return;

    // Clear old layers
    const currentMap = map.current;
    const boundaryLayer = L.polygon(event.boundary || [], {
      color: '#00FF9C',
      weight: 3,
      opacity: 0.9,
      fillColor: '#00FF9C',
      fillOpacity: 0.05,
      interactive: false,
    }).addTo(currentMap);

    // Map click handler - re-attached whenever event boundary changes
    const onClick = (e: L.LeafletMouseEvent) => {
      const latlng = e.latlng;
      const point: [number, number] = [latlng.lat, latlng.lng];

      // Validate point is inside boundary
      if (event.boundary && event.boundary.length >= 3) {
        if (!pointInPolygon(point, event.boundary)) {
          setBoundaryValidationError('Point must be inside event boundary');
          setTimeout(() => setBoundaryValidationError(''), 3000);
          return;
        }
      }

      setBoundaryValidationError('');
      setPoints((prev) => [...prev, point]);
    };

    const onDblClick = (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e as any);
      if (points.length >= 3) {
        setShowNameDialog(true);
        onDrawingModeChange?.(false);
      }
    };

    currentMap.on('click', onClick);
    currentMap.on('dblclick', onDblClick);

    return () => {
      currentMap.off('click', onClick);
      currentMap.off('dblclick', onDblClick);
      currentMap.removeLayer(boundaryLayer);
    };
  }, [event, event.boundary, points.length]);

  // Update markers and polyline when points change
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => map.current?.removeLayer(m));
    markersRef.current = [];

    // Clear old polyline
    if (polylineRef.current) {
      map.current.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (points.length === 0) return;

    // Add markers for each point
    points.forEach((point, idx) => {
      const marker = L.circleMarker([point[0], point[1]], {
        radius: 6,
        fillColor: selectedColor,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      })
        .addTo(map.current!)
        .bindPopup(`Point ${idx + 1}<br><a href="#">Remove</a>`);

      marker.on('popupopen', () => {
        const removeLink = document.querySelector('a');
        if (removeLink) {
          removeLink.onclick = (e) => {
            e.preventDefault();
            setPoints((prev) => prev.filter((_, i) => i !== idx));
          };
        }
      });

      markersRef.current.push(marker);
    });

    // Draw polyline between points
    if (points.length >= 2) {
      polylineRef.current = L.polyline(points, {
        color: selectedColor,
        weight: 2,
        opacity: 0.7,
        dashArray: '5, 5',
      }).addTo(map.current);
    }

    // If closed (first point clicked twice), create polygon
    if (points.length >= 3) {
      const lastPoint = points[points.length - 1];
      const firstPoint = points[0];
      const dist = Math.sqrt(
        Math.pow(lastPoint[0] - firstPoint[0], 2) + Math.pow(lastPoint[1] - firstPoint[1], 2)
      );
      
      // If points are very close (within ~0.0003 degrees), consider it closed
      if (dist < 0.0003) {
        console.log('[v0] Zone boundary closed by clicking start');
        setShowNameDialog(true);
        onDrawingModeChange?.(false);
      }
    }
  }, [points, selectedColor]);

  const handleFinishZone = () => {
    if (points.length < 3) {
      alert('Please draw at least 3 points');
      return;
    }

    if (!zoneName.trim()) {
      alert('Please enter a zone name');
      return;
    }

    // Remove the last point if it's a duplicate (from double-click)
    const boundary =
      points.length > 3 &&
      Math.abs(points[0][0] - points[points.length - 1][0]) < 0.0001 &&
      Math.abs(points[0][1] - points[points.length - 1][1]) < 0.0001
        ? points.slice(0, -1)
        : points;

    onZoneComplete?.({
      name: zoneName,
      boundary,
      color: selectedColor,
    });

    // Reset
    setPoints([]);
    setZoneName('');
    setSelectedColor(ZONE_COLORS[0].value);
    setShowNameDialog(false);
  };

  return (
    <>
      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'auto',
        }}
      />

      {/* Drawing Instructions Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '50px',
          background: 'rgba(26, 26, 26, 0.9)',
          border: '1px solid #00FF9C40',
          borderRadius: '8px',
          padding: '10px 15px',
          zIndex: 400,
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            color: '#00FF9C',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          Points: {points.length}
        </div>
        <div style={{ color: '#888', fontSize: '11px', marginTop: '4px' }}>
          Click to add points • {points.length >= 3 ? 'Click start point to close' : 'Need 3+ points'}
        </div>
        {points.length >= 3 && (
          <Button 
            size="sm" 
            className="mt-2 w-full bg-accent text-black hover:bg-accent/80 font-bold h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setShowNameDialog(true);
              onDrawingModeChange?.(false);
            }}
          >
            Finish Boundary
          </Button>
        )}
      </div>

      {/* Validation Error */}
      {boundaryValidationError && (
        <div
          style={{
            position: 'absolute',
            top: '100px',
            left: '50px',
            background: 'rgba(239, 68, 68, 0.9)',
            border: '1px solid #ff4444',
            borderRadius: '4px',
            padding: '8px 12px',
            zIndex: 400,
            color: '#fff',
            fontSize: '12px',
          }}
        >
          {boundaryValidationError}
        </div>
      )}

      {/* Zone Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-accent">Zone Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Zone Name</label>
              <Input
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="e.g., Food Court, Entrance, Stage"
                className="bg-input border-primary/20"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Zone Color</label>
              <div className="grid grid-cols-4 gap-2">
                {ZONE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`h-10 rounded border-2 transition-all ${
                      selectedColor === color.value ? 'border-white scale-105' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="p-3 bg-primary/10 border border-primary/20 rounded text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Zone Summary:</p>
              <p>{points.length} points • {zoneName || '(no name)'}</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowNameDialog(false);
                  setPoints([]);
                }}
                variant="outline"
                className="flex-1 border-primary/20"
              >
                Cancel
              </Button>
              <Button onClick={handleFinishZone} className="flex-1 bg-primary hover:bg-primary/90">
                Create Zone
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
