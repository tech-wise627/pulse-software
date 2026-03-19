'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, AlertCircle, Phone, Shield } from 'lucide-react';

interface StaffPanicButtonProps {
  workerName: string;
  workerPhone?: string;
  zone: string;
  currentBin?: string;
  userLocation?: [number, number];
  onAlertSent?: () => void;
}

export default function StaffPanicButton({
  workerName,
  workerPhone,
  zone,
  currentBin,
  userLocation,
  onAlertSent,
}: StaffPanicButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  const sendPanicAlert = () => {
    setIsConfirming(true);

    // Send voice message to managers/admins
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const alertMessage = new SpeechSynthesisUtterance(
        `URGENT ALERT! Worker ${workerName} in zone ${zone} has reported an emergency. Please respond immediately. Location: ${zone}${currentBin ? `, Bin ${currentBin}` : ''}.`
      );
      alertMessage.rate = 0.95;
      alertMessage.pitch = 1.2;
      alertMessage.volume = 1;
      alertMessage.lang = 'en-US';
      speechSynthesis.speak(alertMessage);
    }

    // Vibration alert pattern
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    // Simulate sending alert to backend/managers
    console.log('[v0] Panic alert sent:', {
      workerName,
      zone,
      currentBin,
      userLocation,
      timestamp: new Date().toISOString(),
    });

    setAlertSent(true);
    setTimeout(() => {
      setIsConfirming(false);
      setAlertSent(false);
      setIsOpen(false);
      onAlertSent?.();
    }, 3000);
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-500 shadow-lg overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="h-12 w-12 text-red-600" />
            <div className="text-center">
              <h3 className="font-bold text-lg text-red-900">Emergency Alert</h3>
              <p className="text-sm text-red-700 mt-1">Press the button below if you need immediate help</p>
            </div>
            <Button
              onClick={() => {
                console.log('[v0] Panic alert button clicked');
                setIsOpen(true);
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 h-16 text-xl rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
            >
              🚨 PANIC ALERT
            </Button>
            <p className="text-xs text-red-600 text-center">
              Only press if you have an emergency. This will alert managers and admins immediately.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-white border-2 border-red-500">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              Confirm Emergency Alert
            </DialogTitle>
            <DialogDescription className="text-base text-gray-700 mt-4">
              <div className="space-y-3">
                <p>You are about to send an URGENT alert to all managers and admins.</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                  <p className="font-semibold text-gray-900">Alert Details:</p>
                  <div className="text-sm space-y-1 text-gray-700">
                    <p><span className="font-medium">Worker:</span> {workerName}</p>
                    <p><span className="font-medium">Zone:</span> {zone}</p>
                    {currentBin && <p><span className="font-medium">Current Bin:</span> {currentBin}</p>}
                    {workerPhone && <p><span className="font-medium">Contact:</span> {workerPhone}</p>}
                  </div>
                </div>
                <p className="text-red-600 font-semibold">This action cannot be undone.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-gray-300"
              disabled={isConfirming}
            >
              Cancel
            </Button>
            <Button
              onClick={sendPanicAlert}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  {alertSent ? (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Alert Sent!
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2 animate-pulse" />
                      Sending...
                    </>
                  )}
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Send Emergency Alert
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
