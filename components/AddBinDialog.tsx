'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, MapPin, Loader, CheckCircle2 } from 'lucide-react';
import { getCurrentLocation, formatCoordinates, GeolocationError } from '@/lib/geolocation';

interface AddBinDialogProps {
  locationId: string;
  boundary: [number, number][];
  onBinAdded: (binData: {
    device_id: string;
    name: string;
    location_id: string;
    latitude: number;
    longitude: number;
  }) => void;
  isSubmitting?: boolean;
}

// Helper function to check if point is within bounding box
function isPointInBoundary(lat: number, lon: number, boundary: [number, number][]): boolean {
  if (!boundary || boundary.length < 2) return true; // If no boundary defined, accept any location
  
  const lats = boundary.map(b => b[0]);
  const lons = boundary.map(b => b[1]);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  
  return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
}

export default function AddBinDialog({ locationId, boundary, onBinAdded, isSubmitting }: AddBinDialogProps) {
  const [step, setStep] = useState<'location' | 'binid'>('location');
  const [binId, setBinId] = useState('');
  const [binName, setBinName] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLocationValid, setIsLocationValid] = useState(false);

  // Auto-capture location on component mount
  useEffect(() => {
    captureLocation();
  }, []);

  const captureLocation = async () => {
    setIsLoadingLocation(true);
    setError(null);
    setIsLocationValid(false);
    try {
      const location = await getCurrentLocation();
      console.log('[v0] Location captured:', { lat: location.latitude, lon: location.longitude });
      
      // Check if location is within boundary
      const withinBoundary = isPointInBoundary(location.latitude, location.longitude, boundary);
      console.log('[v0] Location within boundary:', withinBoundary);
      
      if (!withinBoundary) {
        setError('Location is outside the event boundary. Please move to the event area.');
        setLatitude(null);
        setLongitude(null);
        return;
      }
      
      setLatitude(location.latitude);
      setLongitude(location.longitude);
      setAccuracy(location.accuracy);
      setIsLocationValid(true);
      setStep('binid'); // Auto-progress to bin ID step
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to get location';
      setError(errorMsg);
      console.log('[v0] Geolocation error:', err);
      setIsLocationValid(false);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleAddBin = () => {
    if (!binId.trim()) {
      setError('Please enter a Bin ID');
      return;
    }

    if (latitude === null || longitude === null) {
      setError('Location not captured. Please try again.');
      return;
    }

    const newBin = {
      device_id: binId.trim(),
      name: binName.trim() || `Bin - ${binId.trim()}`,
      location_id: locationId,
      latitude,
      longitude,
    };

    console.log('[v0] Adding bin:', newBin);
    onBinAdded(newBin);
    setSuccess(true);
    setBinId('');
    setBinName('');
    setStep('location');
    setLatitude(null);
    setLongitude(null);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Card className="border-primary/20 bg-card">
      <CardContent className="pt-6 space-y-4">
        {/* Step 1: Location Detection */}
        <div className={`p-4 rounded-lg border-2 transition-all ${
          step === 'location' 
            ? isLocationValid 
              ? 'border-green-500/30 bg-green-500/10' 
              : 'border-yellow-500/30 bg-yellow-500/10'
            : 'border-slate-300/30 bg-slate-100/5'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            {step === 'location' && isLocationValid && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            {step === 'location' && !isLocationValid && isLoadingLocation && <Loader className="w-5 h-5 animate-spin text-yellow-500" />}
            {step !== 'location' && <CheckCircle2 className="w-5 h-5 text-slate-400" />}
            <span className={`font-semibold ${step === 'location' ? 'text-foreground' : 'text-slate-500'}`}>
              Step 1: Location Detection
            </span>
          </div>

          {latitude && longitude && isLocationValid && (
            <div className="text-sm text-foreground space-y-1 ml-8">
              <p className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-green-500" />
                <span className="font-medium">Location captured:</span>
              </p>
              <p className="text-muted-foreground">Coordinates: {formatCoordinates(latitude, longitude)}</p>
              <p className="text-muted-foreground">Accuracy: {accuracy?.toFixed(0)}m</p>
              <p className="text-xs text-green-600 font-medium">✓ Within event boundary</p>
            </div>
          )}

          {isLoadingLocation && (
            <div className="flex items-center gap-2 text-sm text-foreground ml-8">
              <Loader className="w-4 h-4 animate-spin" />
              Detecting your location and validating...
            </div>
          )}

          {step === 'location' && !isLoadingLocation && !isLocationValid && (
            <Button
              onClick={captureLocation}
              variant="outline"
              className="mt-3 ml-8 border-primary/20 text-primary hover:bg-primary/10 gap-2 w-fit"
            >
              <MapPin className="w-4 h-4" />
              Try Again
            </Button>
          )}
        </div>

        {/* Step 2: Bin ID Input */}
        {step === 'binid' && isLocationValid && (
          <div className="p-4 rounded-lg border-2 border-blue-500/30 bg-blue-500/10 space-y-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center text-xs font-bold text-blue-500">
                2
              </div>
              <span className="font-semibold text-foreground">Step 2: Enter Bin Details</span>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Bin Number / ID <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={binId}
                onChange={(e) => setBinId(e.target.value)}
                placeholder="e.g., BIN-001, MUM-001"
                className="w-full px-3 py-2 bg-input border border-primary/20 rounded text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Bin Name (Optional)
              </label>
              <input
                type="text"
                value={binName}
                onChange={(e) => setBinName(e.target.value)}
                placeholder="e.g., Main Entrance, Food Court"
                className="w-full px-3 py-2 bg-input border border-primary/20 rounded text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  setStep('location');
                  setLatitude(null);
                  setLongitude(null);
                  setIsLocationValid(false);
                  setBinId('');
                  setBinName('');
                }}
                variant="outline"
                className="flex-1 border-primary/20 text-primary hover:bg-primary/10"
              >
                Change Location
              </Button>
              <Button
                onClick={handleAddBin}
                disabled={!binId.trim() || isSubmitting}
                className="flex-1 bg-primary hover:bg-primary/90 gap-2"
              >
                {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : null}
                {isSubmitting ? 'Registering...' : 'Add Bin'}
              </Button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive text-sm ml-2">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-600 text-sm ml-2">
              Bin added successfully!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
