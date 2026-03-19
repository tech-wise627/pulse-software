'use client';

import { useEffect, useRef, useState } from 'react';
import { IoTDevice, EventLocation } from '@/lib/types';

interface StaffMapProps {
  userLocation: [number, number] | null;
  assignedDevices: IoTDevice[];
  selectedDeviceId?: string;
  staffLocation?: EventLocation;
  onOutOfZone?: (isOutside: boolean) => void;
  isOutOfZone?: boolean;
  geofenceStatus?: any;
}

// Helper function to check if point is within polygon boundary
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

export default function StaffMap({
  userLocation,
  assignedDevices,
  selectedDeviceId,
  staffLocation,
  onOutOfZone,
  isOutOfZone,
  geofenceStatus,
}: StaffMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const mapInitializedRef = useRef(false);
  const binMarkersRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if user is within boundary
  useEffect(() => {
    if (userLocation && staffLocation?.boundary) {
      const [lat, lon] = userLocation;
      const isInside = isPointInBoundary(lat, lon, staffLocation.boundary);
      onOutOfZone?.(!isInside);
    }
  }, [userLocation, staffLocation?.boundary, onOutOfZone]);

  // Find next bin (highest fill level or closest)
  const getNextBin = (): IoTDevice | null => {
    if (!assignedDevices.length || !userLocation) return null;
    
    return assignedDevices.reduce((next, device) => {
      if (!device.latitude || !device.longitude) return next;
      
      const deviceFill = device.fill_level || 0;
      const nextFill = next?.fill_level || 0;
      
      // Prioritize by fill level first
      if (deviceFill !== nextFill) {
        return deviceFill > nextFill ? device : next;
      }
      
      // Then by distance
      const dx1 = device.latitude - userLocation[0];
      const dy1 = device.longitude - userLocation[1];
      const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      
      const dx2 = (next?.latitude || 0) - userLocation[0];
      const dy2 = (next?.longitude || 0) - userLocation[1];
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      
      return dist1 < dist2 ? device : next;
    });
  };

  useEffect(() => {
    if (!isClient || !mapContainer.current || !staffLocation || mapInitializedRef.current) {
      return;
    }

    mapInitializedRef.current = true;

    try {
      import('leaflet').then((L) => {
        import('leaflet/dist/leaflet.css');

        if (!mapContainer.current) return;

        // Create map with dark styling and restrictions
        const map = L.map(mapContainer.current, {
          minZoom: 15,
          maxZoom: 20,
          dragging: true,
          scrollWheelZoom: true,
        }).setView(
          [staffLocation.latitude, staffLocation.longitude],
          17
        );

        mapRef.current = map;

        // Use dark tile layer (Carto)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; CARTO',
          maxZoom: 19,
        }).addTo(map);

        // Draw boundary polygon
        if (
          staffLocation.boundary &&
          Array.isArray(staffLocation.boundary) &&
          staffLocation.boundary.length >= 3
        ) {
          const boundaryPolygon = L.polygon(staffLocation.boundary, {
            color: isOutOfZone ? '#EF4444' : '#00FF9C',
            weight: isOutOfZone ? 4 : 3,
            opacity: isOutOfZone ? 1 : 1,
            fillColor: isOutOfZone ? '#EF4444' : '#00FF9C',
            fillOpacity: isOutOfZone ? 0.15 : 0.08,
            dashArray: isOutOfZone ? '0' : '8, 4',
          }).addTo(map);

          // Get boundary bounds
          const bounds = boundaryPolygon.getBounds();

          // Fit map to boundary with padding
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });

          // Set max bounds to boundary to prevent panning outside
          map.setMaxBounds(bounds.pad(0.01));

          // Restrict zoom levels and enforce boundary on zoom
          map.on('zoom', () => {
            const currentBounds = map.getBounds();
            if (currentBounds.getNorth() > bounds.getNorth() ||
                currentBounds.getSouth() < bounds.getSouth() ||
                currentBounds.getEast() > bounds.getEast() ||
                currentBounds.getWest() < bounds.getWest()) {
              map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
            }
          });
        }

        // Add bin markers (only assigned bins)
        assignedDevices.forEach((device) => {
          if (device.latitude && device.longitude) {
            const fillLevel = device.fill_level || 0;
            let color = '#22C55E';
            let borderColor = '#16A34A';
            
            if (fillLevel > 80) {
              color = '#EF4444';
              borderColor = '#DC2626';
            } else if (fillLevel > 50) {
              color = '#FACC15';
              borderColor = '#EAB308';
            }

            const binIcon = L.divIcon({
              html: `<div style="width: 44px; height: 44px; background-color: ${color}; border: 3px solid ${borderColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px; box-shadow: 0 0 10px ${color}99;">${fillLevel}%</div>`,
              className: `bin-marker`,
              iconSize: [44, 44],
              popupAnchor: [0, -22],
            });

            const marker = L.marker([device.latitude, device.longitude], { icon: binIcon })
              .bindPopup(
                `<div style="font-family: sans-serif;"><div style="font-weight: bold; margin-bottom: 4px;">${device.name}</div><div style="font-size: 12px;"><div>Fill: ${fillLevel}%</div><div>Battery: ${device.battery_level}%</div><div>ID: ${device.device_id}</div></div></div>`
              )
              .addTo(map);
            
            binMarkersRef.current.set(device.id, marker);
          }
        });

        setTimeout(() => map.invalidateSize(), 100);
      });
    } catch (error) {
      console.error('[v0] Error loading map:', error);
    }
  }, [isClient, staffLocation]);

  // Separate effect for updating user location marker in real-time
  useEffect(() => {
    if (!mapRef.current || !isClient) return;

    const map = mapRef.current;

    if (userLocation) {
      // Update or create user marker
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(userLocation);
        
        // Update marker color based on geofence status
        if (isOutOfZone) {
          userMarkerRef.current.setIcon(
            L.divIcon({
              html: `<div style="width: 36px; height: 36px; background-color: #EF4444; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px #EF4444, inset 0 0 6px rgba(255,255,255,0.3);"><div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div></div>`,
              className: 'staff-location-marker-alert',
              iconSize: [36, 36],
              popupAnchor: [0, -20],
            })
          );
        }
      } else {
        import('leaflet').then((L) => {
          const userIcon = L.divIcon({
            html: `<div style="width: 32px; height: 32px; background-color: #2F8CFF; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px #2F8CFF, inset 0 0 6px rgba(255,255,255,0.3);"><div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div></div>`,
            className: 'staff-location-marker',
            iconSize: [32, 32],
            popupAnchor: [0, -20],
          });

          userMarkerRef.current = L.marker(userLocation, { icon: userIcon })
            .bindPopup('Your Location')
            .addTo(map);
        });
      }

      // Draw route to next bin
      if (!mapInitializedRef.current) return;
      
      const nextBin = assignedDevices.find(d => {
        if (!d.latitude || !d.longitude) return false;
        const dx = d.latitude - userLocation[0];
        const dy = d.longitude - userLocation[1];
        return Math.sqrt(dx * dx + dy * dy) < 0.01; // Very close
      });

      if (nextBin && nextBin.latitude && nextBin.longitude) {
        import('leaflet').then((L) => {
          if (routeLineRef.current) {
            map.removeLayer(routeLineRef.current);
          }

          routeLineRef.current = L.polyline(
            [userLocation, [nextBin.latitude, nextBin.longitude]],
            {
              color: '#00FF9C',
              weight: 3,
              opacity: 0.7,
              dashArray: '10, 5',
              lineCap: 'round',
              lineJoin: 'round',
            }
          ).addTo(map);
        });
      }
    }
  }, [userLocation, isClient, assignedDevices]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
        position: 'relative',
      }}
    >
      {!isClient && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#999',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Loading map...
        </div>
      )}
    </div>
  );
}
