'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reverseGeocode } from '@/lib/geocoding';
import { Loader2, MapPin } from 'lucide-react';

interface LocationDetails {
  address: string;
  city: string;
  country: string;
}

interface MapPickerProps {
  onLocationSelect: (coords: [number, number], details?: LocationDetails) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export default function MapPicker({
  onLocationSelect,
  initialCenter = [20.5937, 78.9629],
  initialZoom = 5,
}: MapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const hasSelectedInitial = useRef(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string>('');

  const selectLocation = async (lat: number, lng: number, locationDetails: LocationDetails) => {
    if (!map.current) return;
    
    setIsLoading(true);

    if (markerRef.current) {
      map.current.removeLayer(markerRef.current);
    }

    const confirmIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMEM1LjkgMCAxIDUuOSAxIDEyYzAgNy4wMiAxMSAxMiAxMSAxMnMxMS00Ljk4IDExLTEyYzAtNi4xLTUuOS0xMi0xMi0xMnptMCA5YzEuNjU3IDAgMyAxLjM0MyAzIDN1LTEuMzQzIDMtMyAzLTMtMS4zNDMtMyAzIDEuMzQzLTMgMyAzeiIgZmlsbD0iIzIyYzU1ZSIvPjwvc3ZnPg==',
      shadowUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMEM1LjkgMCA5IDUuOSA5IDEyYzAgNy4wMiAxMSAxMiAxMSAxMnMxMS00Ljk4IDExLTEyYzAtNi4xLTUuOS0xMi0xMi0xMnptMCA5YzEuNjU3IDAgMyAxLjM0MyAzIDN1LTEuMzQzIDMtMyAzLTMtMS4zNDMtMyAzIDEuMzQzLTMgMyAzeiIgZmlsbD0iIzAwMDAwMCIgb3BhY2l0eT0iMC4yIi8+PC9zdmc+',
      iconSize: [25, 41],
      shadowSize: [41, 41],
      iconAnchor: [12, 41],
      shadowAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    const popupContent = `
      <div style="font-size: 12px; line-height: 1.4;">
        <div style="font-weight: bold; margin-bottom: 4px;">✓ Location Selected</div>
        <div><strong>City:</strong> ${locationDetails.city || 'N/A'}</div>
        <div><strong>Address:</strong> ${locationDetails.address || 'N/A'}</div>
        <div style="margin-top: 4px; color: #22c55e;">Lat: ${lat.toFixed(4)}<br/>Lon: ${lng.toFixed(4)}</div>
      </div>
    `;

    markerRef.current = L.marker([lat, lng], { icon: confirmIcon }).addTo(map.current);
    markerRef.current.bindPopup(popupContent).openPopup();

    setIsLoading(false);
    onLocationSelect([lat, lng], locationDetails);
  };

  // Map Initialization
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current).setView(initialCenter, initialZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const details = await reverseGeocode(lat, lng);
      // Mark as manually selected to prevent initial-sync from overriding
      hasSelectedInitial.current = true;
      selectLocation(lat, lng, details);
    };

    map.current.on('click', handleMapClick);

    return () => {
      map.current?.off('click', handleMapClick);
    };
  }, []);

  // One-time Initial Center/GPS Sync
  useEffect(() => {
    if (!map.current || hasSelectedInitial.current) return;

    // Default India coords check
    const isDefault = initialCenter[0] === 20.5937 && initialCenter[1] === 78.9629;
    
    if (!isDefault) {
      hasSelectedInitial.current = true;
      map.current.setView(initialCenter, initialZoom);
      
      const autoSelect = async () => {
        const details = await reverseGeocode(initialCenter[0], initialCenter[1]);
        selectLocation(initialCenter[0], initialCenter[1], details);
      };
      autoSelect();
    }
  }, [initialCenter[0], initialCenter[1], initialZoom]);

  const requestDeviceLocation = async () => {
    setGpsLoading(true);
    setGpsError('');

    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (map.current) {
          map.current.setView([latitude, longitude], 15);
          const locationDetails = await reverseGeocode(latitude, longitude);
          hasSelectedInitial.current = true;
          selectLocation(latitude, longitude, locationDetails);
        }
        setGpsLoading(false);
      },
      (error) => {
        setGpsError('Unable to get location');
        setGpsLoading(false);
      }
    );
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      <button
        onClick={requestDeviceLocation}
        disabled={gpsLoading}
        className="absolute top-3 right-3 bg-white hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded p-2 z-[1000] shadow-sm flex items-center gap-2 text-xs font-bold text-slate-800"
      >
        {gpsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
        {gpsLoading ? 'Locating...' : 'My Location'}
      </button>

      {isLoading && (
        <div className="absolute inset-0 z-[1001] bg-black/5 flex items-center justify-center pointer-events-none">
          <div className="bg-white px-3 py-1.5 rounded-full shadow-lg text-[10px] font-bold text-slate-600 animate-pulse border border-slate-200">
            Fetching Address...
          </div>
        </div>
      )}
    </div>
  );
}
