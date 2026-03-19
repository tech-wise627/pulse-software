'use client';

import { useState, useEffect } from 'react';
import { useTranslation, type Language } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Droplet, MapPin, Globe, Navigation, ChevronRight, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import StaffPanicButton from './StaffPanicButton';

const BinMap = dynamic(() => import('@/components/BinMap'), { ssr: false });

interface StaffDashboardMinimalProps {
  workerName: string;
  currentBin: any;
  nextBin: any;
  zone: string;
  userLocation?: [number, number];
  onMarkCleaned: () => void;
  completedCount: number;
  allBins?: any[];
  completedAssignmentIds?: string[];
  staffAssignments?: any[];
}

export default function StaffDashboardMinimal({
  workerName,
  currentBin,
  nextBin,
  zone,
  userLocation,
  onMarkCleaned,
  completedCount,
  allBins = [],
  completedAssignmentIds = [],
  staffAssignments = [],
}: StaffDashboardMinimalProps) {
  const [language, setLanguage] = useState<Language>('en');
  const t = useTranslation(language);
  const [isClient, setIsClient] = useState(false);
  const [showPanicButton, setShowPanicButton] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Map completed assignment IDs to bin device IDs
  const completedBinDeviceIds = completedAssignmentIds
    .map((assignmentId) => {
      const assignment = staffAssignments.find((a) => a.id === assignmentId);
      return assignment?.device_id;
    })
    .filter(Boolean);

  // Sort bins by fill level (fullest first), but filter out already completed ones
  const incompleteBins = allBins.filter((bin) => !completedBinDeviceIds.includes(bin.id));
  const sortedBins = [...incompleteBins].sort((a, b) => (b.fill_level || 0) - (a.fill_level || 0));
  const mostFilledBin = sortedBins[0]; // Most filled is the priority
  const displayBin = mostFilledBin || currentBin; // Show most filled as current

  console.log('[v0] Dashboard Render:', {
    allBinsCount: allBins.length,
    completedAssignmentCount: completedAssignmentIds.length,
    completedBinDeviceIds,
    incompleteBinsCount: incompleteBins.length,
    sortedBinsCount: sortedBins.length,
    displayBinId: displayBin?.device_id,
    displayBinFill: displayBin?.fill_level,
  });

  const handleMarkCleaned = () => {
    console.log('[v0] Mark cleaned clicked for bin:', displayBin?.device_id, displayBin?.id);
    onMarkCleaned();
  };

  const fillPercentage = displayBin?.fill_level || 0;
  const fillStatus = fillPercentage >= 80 ? 'critical' : fillPercentage >= 50 ? 'warning' : 'ok';
  const fillColor = fillStatus === 'critical' ? 'bg-red-500' : fillStatus === 'warning' ? 'bg-yellow-500' : 'bg-green-500';

  // Calculate distance between two points
  const calculateDistance = (from: [number, number], to: [number, number]) => {
    const R = 6371000;
    const lat1 = (from[0] * Math.PI) / 180;
    const lat2 = (to[0] * Math.PI) / 180;
    const deltaLat = ((to[0] - from[0]) * Math.PI) / 180;
    const deltaLng = ((to[1] - from[1]) * Math.PI) / 180;
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 p-4 flex flex-col max-w-md mx-auto">
      {/* Header: Language + Worker Info */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-slate-500">{zone}</p>
          <h1 className="text-2xl font-bold text-slate-900">{workerName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-slate-500" />
          <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
            <SelectTrigger className="w-24 h-9 bg-slate-100 border-slate-300 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="hi">HI</SelectItem>
              <SelectItem value="mr">MR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Task: Current Bin (Most Filled - Large, Prominent) */}
      {displayBin && (
        <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200 mb-6 shadow-md overflow-hidden">
          <CardContent className="pt-6 pb-6">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-2">{t.currentBin}</p>
              <h2 className="text-4xl font-bold text-slate-900 mb-2">{displayBin?.device_id}</h2>
              <p className="text-slate-600 text-sm">{displayBin?.name}</p>
            </div>

            {/* Large Fill Circle */}
            <div className="flex flex-col items-center gap-6 my-8">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" className="fill-none stroke-slate-200" strokeWidth="12" />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    className={`fill-none stroke-current ${fillColor} transition-all duration-300`}
                    strokeWidth="12"
                    strokeDasharray={`${(fillPercentage / 100) * 439.82} 439.82`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-5xl font-bold text-slate-900">{fillPercentage}%</div>
                  <div className="text-slate-500 text-sm">{t.fillLevel}</div>
                </div>
              </div>

              {/* Status Badge */}
              <Badge
                className={`${
                  fillStatus === 'critical'
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : fillStatus === 'warning'
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      : 'bg-green-100 text-green-700 border border-green-300'
                } px-4 py-2 text-base font-semibold`}
              >
                {fillStatus === 'critical' ? 'CRITICAL' : fillStatus === 'warning' ? 'WARNING' : 'OK'}
              </Badge>
            </div>

            {/* Mark Cleaned Button */}
            <Button
              onClick={handleMarkCleaned}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 h-12 text-base shadow-md active:scale-95 transition-transform"
            >
              ✓ {t.markCleaned}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Map with Bounding Box (Like Manager Dashboard) */}
      {isClient && allBins.length > 0 && userLocation && (
        <Card className="mb-6 border-slate-200 shadow-md overflow-hidden">
          <CardContent className="p-0">
            <div style={{ height: '280px', width: '100%', position: 'relative' }}>
              <BinMap
                devices={allBins}
                center={userLocation}
                zoom={16}
                autoFitBounds={true}
                eventBoundary={undefined}
                restrictToBoundary={false}
              />
              {/* Geotag Display */}
              <div className="absolute bottom-3 left-3 bg-white px-3 py-1 rounded text-xs text-slate-700 font-semibold shadow-md border border-slate-200">
                <MapPin className="inline h-3 w-3 mr-1" />
                {userLocation && `${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Plan: Next Bins Prioritized by Fill Level */}
      {sortedBins.length > 1 && (
        <Card className="mb-6 border-slate-200 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="mb-3">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Route Priority</p>
              <h3 className="text-lg font-bold text-slate-900">{t.nextBin}</h3>
            </div>

            {/* Route Items - Top 3 Priority Bins */}
            <div className="space-y-2">
              {sortedBins.slice(0, 3).map((bin, idx) => {
                const isCurrent = bin.id === displayBin?.id;
                const distance = userLocation && bin.latitude && bin.longitude 
                  ? calculateDistance(userLocation, [bin.latitude, bin.longitude])
                  : 0;
                const distanceKm = (distance / 1000).toFixed(1);

                return (
                  <div
                    key={bin.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isCurrent
                        ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-200 text-slate-700 min-w-6 text-center">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-sm text-slate-900">{bin.device_id}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            bin.fill_level >= 80 ? 'bg-red-100 text-red-700' :
                            bin.fill_level >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {bin.fill_level}%
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <Navigation className="h-3 w-3" />
                          {distanceKm}m away
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Count */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
        <p className="text-sm text-blue-700 font-semibold">{t.binsCleaned}: {completedCount}</p>
      </div>

      {/* Emergency Alert Button - Using StaffPanicButton Component */}
      {isClient && (
        <StaffPanicButton
          workerName={workerName}
          workerPhone=""
          zone={zone}
          currentBin={displayBin?.device_id}
          userLocation={userLocation}
        />
      )}

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-500 pb-4">
        <p>{t.zone}: {zone}</p>
        <p>{t.status}: Active</p>
      </div>
    </div>
  );
}
