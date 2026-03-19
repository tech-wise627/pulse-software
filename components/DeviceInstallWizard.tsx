'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Plus, Check, ArrowLeft } from 'lucide-react';
import { createDevice } from '@/lib/hooks';

interface DeviceInstallWizardProps {
  locationId: string;
  locationName: string;
  onDeviceAdded?: (device: any) => void;
}

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function DeviceInstallWizard({
  locationId,
  locationName,
  onDeviceAdded,
}: DeviceInstallWizardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'location' | 'details'>('location');
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
  const [formData, setFormData] = useState({
    device_id: '',
    name: '',
    latitude: 0,
    longitude: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMapSelect = (coords: [number, number]) => {
    setSelectedCoords(coords);
    setFormData((prev) => ({
      ...prev,
      latitude: coords[0],
      longitude: coords[1],
    }));
    setStep('details');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newDevice = await createDevice({
        device_id: formData.device_id,
        name: formData.name,
        location_id: locationId,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });

      onDeviceAdded?.(newDevice);
      setIsOpen(false);
      setStep('location');
      setFormData({ device_id: '', name: '', latitude: 0, longitude: 0 });
      setSelectedCoords(null);
    } catch (error) {
      console.error('Failed to create device:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        Install Device
      </Button>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Install New Device</DialogTitle>
          <DialogDescription>
            Step {step === 'location' ? '1' : '2'} of 2: {step === 'location' ? 'Select Location' : 'Device Details'}
          </DialogDescription>
        </DialogHeader>

        {step === 'location' ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click on the map to select the location where you want to install the bin. You can zoom in/out to get a
              more precise location.
            </p>

            <div className="h-80 rounded-lg border border-border overflow-hidden">
              <MapPicker onLocationSelect={handleMapSelect} />
            </div>

            {selectedCoords && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location Selected
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Lat: {selectedCoords[0].toFixed(4)}, Lon: {selectedCoords[1].toFixed(4)}
                    </p>
                  </div>
                  <Badge variant="default" className="gap-1">
                    <Check className="w-3 h-3" />
                    Ready
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="device_id">Device ID / Serial Number</Label>
              <Input
                id="device_id"
                name="device_id"
                placeholder="e.g., BIN-001"
                value={formData.device_id}
                onChange={handleInputChange}
                required
              />
              <p className="text-xs text-muted-foreground">The unique identifier from the IoT device</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Bin Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Main Street Entrance"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <p className="text-xs text-muted-foreground">A descriptive name for this bin location</p>
            </div>

            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-4">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Lat: {formData.latitude.toFixed(4)}, Lon: {formData.longitude.toFixed(4)}
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => {
                  setStep('location');
                  setSelectedCoords(null);
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Installing...' : 'Install Device'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
