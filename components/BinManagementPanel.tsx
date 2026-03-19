'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, AlertCircle, CheckCircle, Droplet, Navigation } from 'lucide-react';
import { getCurrentLocation, formatCoordinates, isAccurateLocation } from '@/lib/geolocation-utils';
import { isPointInsidePolygon } from '@/lib/polygon-utils';
import type { EventLocation, IoTDevice } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface BinManagementPanelProps {
  event: EventLocation | null;
  onBinAdded?: (bin: IoTDevice) => void;
}

export default function BinManagementPanel({ event, onBinAdded }: BinManagementPanelProps) {
  const [deviceId, setDeviceId] = useState('');
  const [binName, setBinName] = useState('');
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  const handleDetectLocation = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const coords = await getCurrentLocation();
      
      if (!isAccurateLocation(coords.accuracy)) {
        setError(`Location accuracy is ${coords.accuracy.toFixed(0)}m. Please move to an area with better GPS signal.`);
        setIsLoading(false);
        return;
      }

      // Check if location is inside event boundary
      if (event?.boundary && event.boundary.length >= 3) {
        const isInside = isPointInsidePolygon([coords.latitude, coords.longitude], event.boundary);
        
        if (!isInside) {
          setError('Current location is outside the event boundary. Please move into the event area.');
          setIsLoading(false);
          return;
        }
      }

      setCurrentLocation(coords);
      setSuccess(`Location detected: ${formatCoordinates(coords.latitude, coords.longitude)}`);
    } catch (err: any) {
      setError(err.message || 'Failed to detect location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBin = async () => {
    setError('');
    setSuccess('');

    if (!deviceId.trim()) {
      setError('Please enter a bin number/ID');
      return;
    }

    if (!currentLocation) {
      setError('Please detect location first');
      return;
    }

    if (!event) {
      setError('Internal Error: No event context');
      return;
    }

    setIsRegistering(true);
    try {
      const supabase = createClient();
      const binData = {
        device_id: deviceId.trim(),
        name: binName.trim() || `Bin - ${deviceId.trim()}`,
        location_id: event.id,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        installed_at: new Date().toISOString(),
      };

      console.log('[v0] Registering node via panel:', binData);

      const { data: newDevice, error: insertError } = await supabase
        .from('iot_devices')
        .insert([binData])
        .select()
        .single();

      if (insertError) throw insertError;

      if (newDevice) {
        setSuccess('NODE PROVISIONED SUCCESSFULLY');
        
        // Notify parent to update global state
        if (onBinAdded) {
          onBinAdded(newDevice as IoTDevice);
        }

        // Reset and close after delay
        setTimeout(() => {
          setDeviceId('');
          setBinName('');
          setCurrentLocation(null);
          setSuccess('');
          setShowDialog(false);
        }, 1500);
      }
    } catch (err: any) {
      console.error('[v0] Precision registration failed:', err);
      setError(err.message || 'Deployment Registration Failed');
    } finally {
      setIsRegistering(false);
    }
  };

  if (!event) {
    return (
      <Card className="border-primary/20 bg-card">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-foreground">No event selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative group bg-white/[0.03] border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-md shadow-2xl transition-all hover:border-[#00FF9C]/30 h-full flex flex-col">
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#00FF9C]/10 border border-[#00FF9C]/20 flex items-center justify-center">
            <Droplet className="w-5 h-5 text-[#00FF9C]" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Node Deployment</h3>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Physical Installation</p>
          </div>
        </div>
      </div>
      <div className="p-8 space-y-8 flex-1">
        <div className="space-y-6">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="w-full h-14 rounded-2xl bg-[#00FF9C] hover:bg-[#00FF9C]/90 text-black font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_#00FF9C40] transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Initialize New Node
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0D1117] border-white/10 rounded-[2.5rem] p-0 overflow-hidden max-w-md shadow-[0_0_100px_rgba(0,0,0,0.8)]">
              <div className="p-8 border-b border-white/5">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black tracking-tighter text-white">NODE PROVISIONING</DialogTitle>
                </DialogHeader>
              </div>
              <div className="p-10 space-y-8">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-shake">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-[#00FF9C]/10 border border-[#00FF9C]/20 rounded-2xl flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-[#00FF9C]" />
                    <p className="text-[#00FF9C] text-[10px] font-black uppercase tracking-widest">{success}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Spatial Telemetry</label>
                  {currentLocation ? (
                    <div className="p-6 bg-[#00FF9C]/5 border border-[#00FF9C]/20 rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-[#00FF9C] uppercase tracking-[0.2em]">Coordinates Locked</p>
                        <Navigation className="w-4 h-4 text-[#00FF9C] animate-pulse" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-bold text-white/20 uppercase mb-1">Latitude</p>
                          <p className="text-sm font-bold font-mono text-white">{currentLocation.latitude.toFixed(6)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-white/20 uppercase mb-1">Longitude</p>
                          <p className="text-sm font-bold font-mono text-white">{currentLocation.longitude.toFixed(6)}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                         <span className="text-[9px] font-bold text-white/20 uppercase">Confidence</span>
                         <span className="text-[10px] font-black text-white">{currentLocation.accuracy.toFixed(1)}m</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-4">Awaiting Signal Synchronization</p>
                      <Button 
                        onClick={handleDetectLocation} 
                        disabled={isLoading}
                        variant="ghost"
                        className="w-full h-12 rounded-xl border border-white/5 hover:bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest"
                      >
                        <Navigation className="w-3 h-3 mr-2" />
                        {isLoading ? 'Syncing...' : 'Lock GPS Vector'}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Asset Designation</label>
                  <input
                    type="text"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    placeholder="e.g. NODE-X44"
                    className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-white font-bold placeholder:text-white/10 focus:outline-none focus:border-[#00FF9C]/50 transition-all mb-4"
                  />
                  <input
                    type="text"
                    value={binName}
                    onChange={(e) => setBinName(e.target.value)}
                    placeholder="Location Name (Optional)"
                    className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-white font-bold placeholder:text-white/10 focus:outline-none focus:border-[#00FF9C]/50 transition-all"
                  />
                </div>

                <Button 
                   onClick={handleAddBin}
                   disabled={!currentLocation || !deviceId.trim() || isRegistering}
                   className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#00FF9C] hover:shadow-[0_0_30px_#00FF9C60] transition-all disabled:opacity-20 disabled:grayscale"
                 >
                   {isRegistering ? 'Provisioning...' : 'Confirm Deployment'}
                 </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[1.5rem] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#00FF9C]/30" />
            <p className="text-[10px] font-black text-white tracking-[0.2em] uppercase mb-4 opacity-50">Standard Protocol</p>
            <div className="space-y-4">
               {[
                 { step: "01", text: "Physical Site Placement" },
                 { step: "02", text: "Vector Signal Locking" },
                 { step: "03", text: "Registry Identification" },
                 { step: "04", text: "Network Integration" }
               ].map((item, idx) => (
                 <div key={idx} className="flex items-center gap-4 group/step">
                    <span className="text-[9px] font-black text-[#00FF9C] group-hover/step:translate-x-1 transition-transform">{item.step}</span>
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest group-hover/step:text-white/60 transition-colors">{item.text}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
