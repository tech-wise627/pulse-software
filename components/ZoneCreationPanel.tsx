'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Zap, Navigation } from 'lucide-react';
import { EventLocation, Zone } from '@/lib/types';

const ZoneDrawingMap = dynamic(() => import('@/components/ZoneDrawingMap'), { ssr: false });

export type { Zone };

interface ZoneCreationPanelProps {
  zones: Zone[];
  event: EventLocation | undefined;
  onZoneAdded?: (zone: Zone) => void;
  onZoneRemoved?: (zoneId: string) => void;
}

export default function ZoneCreationPanel({ zones, event, onZoneAdded, onZoneRemoved }: ZoneCreationPanelProps) {
  const [showDrawing, setShowDrawing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleZoneComplete = async (zoneData: { name: string; boundary: Array<[number, number]>; color: string }) => {
    if (!event) return;
    setIsDrawing(true); // Re-use drawing state for loading

    try {
      const response = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: zoneData.name,
          color: zoneData.color,
          boundary: zoneData.boundary,
          location_id: event.id
        })
      });

      if (response.ok) {
        const newZone = await response.json();
        if (onZoneAdded) {
          onZoneAdded(newZone);
        }
        setShowDrawing(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to create zone: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating zone:', error);
      alert('Error creating zone. Please check your connection.');
    } finally {
      setIsDrawing(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      const response = await fetch(`/api/zones/${zoneId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (onZoneRemoved) {
          onZoneRemoved(zoneId);
        }
      } else {
        alert('Failed to delete zone');
      }
    } catch (error) {
      console.error('Error deleting zone:', error);
      alert('Error deleting zone');
    }
  };

  return (
    <div className="relative group bg-white/[0.03] border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-md shadow-2xl transition-all hover:border-blue-500/30 h-full flex flex-col">
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Sector Control</h3>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Delineation Management</p>
          </div>
        </div>
      </div>
      <div className="p-8 space-y-8 flex-1">
        <div className="space-y-6">
          {/* Drawing Mode */}
          {showDrawing && event ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div 
                className="rounded-[1.5rem] border border-white/10 bg-black/40 overflow-hidden relative shadow-inner"
                style={{ height: '400px', width: '100%' }}
              >
                <ZoneDrawingMap
                  event={event}
                  onZoneComplete={handleZoneComplete}
                  onDrawingModeChange={setIsDrawing}
                />
              </div>
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Navigation className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase mb-4">Tactical Delineation</p>
                <div className="space-y-3">
                   {[
                     "Designate corner points for sector volume",
                     "Close vector path at point alpha to commit",
                     "Contained within operational perimeter (Neon Green)",
                     "Assign callsign and thermal profile to archive"
                   ].map((tip, idx) => (
                     <div key={idx} className="flex items-start gap-3">
                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic leading-normal">{tip}</span>
                     </div>
                   ))}
                </div>
              </div>
              <Button 
                onClick={() => setShowDrawing(false)}
                variant="ghost" 
                className="w-full h-12 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white"
                disabled={isDrawing}
              >
                Abort Sector Definition
              </Button>
            </div>
          ) : (
            <>
              {/* Create Zone Button */}
              <Button 
                onClick={() => setShowDrawing(true)}
                className="w-full h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Interface New Sector
              </Button>

              {/* Zones List */}
              {zones.length > 0 ? (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Active Jurisdictions</p>
                    <span className="text-[10px] font-black text-white/60 bg-white/5 px-2 py-0.5 rounded-full">{zones.length} Units</span>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {zones.map((zone) => (
                      <div 
                        key={zone.id} 
                        className="group/zone p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div 
                            className="w-4 h-4 rounded-lg relative"
                            style={{ 
                              backgroundColor: zone.color,
                              boxShadow: `0 0 15px ${zone.color}60`
                            }} 
                          >
                             <div className="absolute inset-0 rounded-lg animate-ping opacity-20" style={{ backgroundColor: zone.color }} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">{zone.name}</p>
                            <p className="text-[8px] font-bold text-white/20 uppercase tracking-tighter mt-0.5">{zone.boundary.length} Coordinate Nodes</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDeleteZone(zone.id)}
                          size="icon"
                          variant="ghost"
                          className="w-10 h-10 rounded-xl text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-10 border border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-center opacity-20">
                  <div className="w-12 h-12 rounded-full border border-white/20 mb-4 flex items-center justify-center">
                    <Zap className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest">No Sectors Defined</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
