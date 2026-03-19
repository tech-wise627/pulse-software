'use client';

import { AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { predictOverflow, calculateFillRate } from '@/lib/operations-intelligence';

interface OverflowPredictionPanelProps {
  devices: any[];
}

export default function OverflowPredictionPanel({ devices }: OverflowPredictionPanelProps) {
  // Calculate predictions for devices with high fill levels
  const predictions = devices
    .filter(d => d.fill_level > 50)
    .map(device => {
      // Simulate fill rate (in real app, use historical data)
      const fillRate = calculateFillRate(device.fill_level - 10, device.fill_level, 5);
      return predictOverflow(device.id, device.fill_level, fillRate);
    })
    .filter(p => p.minutesUntilOverflow > 0)
    .sort((a, b) => a.minutesUntilOverflow - b.minutesUntilOverflow);

  const criticalPredictions = predictions.filter(p => p.isAlertable);
  const deviceMap = new Map(devices.map(d => [d.id, d]));

  return (
    <Card className="bg-[#11181F] border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-[#00FF9C]" />
            Overflow Predictions
          </CardTitle>
          <Badge className="bg-[#00FF9C]/20 text-[#00FF9C] border-[#00FF9C]/50">
            {predictions.length} At Risk
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {criticalPredictions.length > 0 && (
          <Alert className="border-l-4 border-l-red-500 bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 ml-3 font-semibold text-sm">
              ⚠ {criticalPredictions.length} bin(s) may overflow within 15 minutes!
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {predictions.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No overflow predictions</p>
          ) : (
            predictions.map(pred => {
              const device = deviceMap.get(pred.binId);
              const isUrgent = pred.minutesUntilOverflow <= 15;

              return (
                <div
                  key={pred.binId}
                  className={`p-3 rounded-lg border transition-all ${
                    isUrgent
                      ? 'border-red-500/50 bg-red-500/5'
                      : 'border-slate-600 bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white text-sm">{device?.device_id}</p>
                      <p className="text-xs text-slate-400">{device?.name}</p>
                    </div>
                    {isUrgent && (
                      <Badge className="bg-red-500 text-white text-xs">URGENT</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-700/50 rounded p-2">
                      <p className="text-slate-400 mb-1">Fill Level</p>
                      <p className="text-white font-bold">{pred.currentFill}%</p>
                    </div>
                    <div className="bg-slate-700/50 rounded p-2">
                      <p className="text-slate-400 mb-1">Fill Rate</p>
                      <p className="text-white font-bold">{pred.fillRate.toFixed(1)}%/min</p>
                    </div>
                    <div className={`rounded p-2 ${isUrgent ? 'bg-red-500/20' : 'bg-slate-700/50'}`}>
                      <p className="text-slate-400 mb-1">Overflow In</p>
                      <div className="flex items-center gap-1">
                        <Clock className={`w-3 h-3 ${isUrgent ? 'text-red-500' : 'text-slate-400'}`} />
                        <p className={`font-bold ${isUrgent ? 'text-red-500' : 'text-white'}`}>
                          {pred.minutesUntilOverflow}m
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
