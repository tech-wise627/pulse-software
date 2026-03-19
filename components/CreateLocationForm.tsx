'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2, MapPin, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Polygon } from '@/lib/polygon-utils';
import { getCurrentLocation } from '@/lib/geolocation';

// Dynamic imports for map components (client-side only)
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });
const BoundaryDrawer = dynamic(() => import('@/components/BoundaryDrawer'), { ssr: false });

interface CreateLocationFormProps {
  onSuccess?: (newLocationId: string) => void;
}

export default function CreateLocationForm({ onSuccess }: CreateLocationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'map' | 'boundary' | 'details'>('map');
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    eventDate: '',
    latitude: 20.5937,
    longitude: 78.9629,
    boundary: null as Polygon | null,
  });

  // Automatically detect GPS location on mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        console.log('[v0] Auto-detecting GPS location...');
        const location = await getCurrentLocation();
        setFormData(prev => ({
          ...prev,
          latitude: location.latitude,
          longitude: location.longitude,
        }));
        console.log('[v0] GPS location detected:', { lat: location.latitude, lng: location.longitude });
        setIsDetectingLocation(false);
      } catch (err: any) {
        console.log('[v0] GPS detection failed:', err.message);
        setError(`Location detection failed: ${err.message}. Please select manually.`);
        setIsDetectingLocation(false);
      }
    };

    detectLocation();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationSelected = useCallback((coords: [number, number], details?: any) => {
    console.log('[v0] Location selected:', { coords, details });
    
    setFormData(prev => ({
      ...prev,
      latitude: coords[0],
      longitude: coords[1],
      address: details?.address || '',
      city: details?.city || '',
    }));
    setStep('boundary');
  }, []);

  const handleBoundarySaved = useCallback((boundary: Polygon) => {
    console.log('[v0] Event boundary saved:', boundary);
    setFormData(prev => ({
      ...prev,
      boundary,
    }));
    setStep('details');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name) {
        throw new Error('Event name is required');
      }

      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          event_date: formData.eventDate,
          latitude: formData.latitude,
          longitude: formData.longitude,
          boundary: formData.boundary, // Send boundary to API
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data?.details ? `${data.error}: ${data.details}` : (data?.error || `Error: ${response.status}`);
        throw new Error(errorMsg);
      }

      const newLocation = await response.json();
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.(newLocation.id);
        // Reset form
        setFormData({
          name: '',
          address: '',
          city: '',
          eventDate: '',
          latitude: 20.5937,
          longitude: 78.9629,
          boundary: null,
        });
        setStep('map');
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error('[v0] Error creating location:', err);
      // Try to extract details if it's a JSON response from our own API
      const errorMessage = err.message || 'Failed to create location';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      eventDate: '',
      latitude: 20.5937,
      longitude: 78.9629,
      boundary: null,
    });
    setStep('map');
    setError(null);
    setSuccess(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-6">
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Location created successfully!
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Location Selection */}
      <div className="space-y-3">
        <Label className="text-base font-bold flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-black text-xs">1</span>
          Select Event Grounds
        </Label>
        <div className="h-64 rounded-lg overflow-hidden border-2 border-slate-700 shadow-inner group">
          <MapPicker 
            onLocationSelect={handleLocationSelected}
            initialCenter={[formData.latitude, formData.longitude]}
            initialZoom={formData.latitude !== 20.5937 ? 15 : 5}
          />
        </div>
        <p className="text-xs text-slate-400 italic">Click on the map or use GPS to pick the center of your event.</p>
      </div>

      {/* Step 2: Boundary Drawing */}
      <div className="space-y-3">
        <Label className="text-base font-bold flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-black text-xs">2</span>
          Define Area Boundary
        </Label>
        <div className="h-64 rounded-lg overflow-hidden border-2 border-slate-700 shadow-inner">
          <BoundaryDrawer
            initialCenter={[formData.latitude, formData.longitude]}
            initialZoom={16}
            onBoundarySaved={handleBoundarySaved}
          />
        </div>
        <p className="text-xs text-slate-400 italic">Click multiple points on the map above to draw the "fence" around your event.</p>
      </div>

      {/* Step 3: Event Details */}
      <div className="space-y-4 pt-4 border-t border-slate-700">
        <Label className="text-base font-bold flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-black text-xs">3</span>
          Event Details
        </Label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="bg-slate-900 border-slate-700"
              placeholder="e.g., Summer Music Fest"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventDate">Event Date</Label>
            <Input
              id="eventDate"
              name="eventDate"
              type="date"
              className="bg-slate-900 border-slate-700"
              value={formData.eventDate}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 space-y-2 text-sm">
          <p className="font-medium text-accent">📍 Selected Coordinates</p>
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div><strong>City:</strong> {formData.city || 'Not detected'}</div>
            <div><strong>Address:</strong> {formData.address || 'Not detected'}</div>
            <div className="col-span-2 font-mono text-xs">
              <strong>GPS:</strong> {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 pt-6 pb-2 bg-slate-800 border-t border-slate-700 flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="flex-1 bg-transparent border-slate-600 text-slate-400 hover:text-white"
          disabled={loading || success}
        >
          Reset Form
        </Button>
        <Button
          type="submit"
          disabled={loading || success || !formData.name}
          className="flex-[2] bg-accent hover:bg-accent/90 text-black font-bold"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Creating...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Created!
            </>
          ) : (
            <>
              Create Location
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
