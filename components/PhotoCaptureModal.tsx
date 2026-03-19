'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Upload, X } from 'lucide-react';

interface PhotoCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotoCapture: (photoData: string) => void;
}

export default function PhotoCaptureModal({ open, onOpenChange, onPhotoCapture }: PhotoCaptureModalProps) {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [mode, setMode] = useState<'capture' | 'upload'>('capture');
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera when dialog opens and mode is capture
  useEffect(() => {
    if (open && mode === 'capture' && !cameraActive) {
      startCamera();
    }
    return () => {
      if (!open) {
        stopCamera();
      }
    };
  }, [open, mode]);

  const startCamera = async () => {
    try {
      setError(null);
      console.log('[v0] Requesting camera access...');
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log('[v0] Camera stream loaded');
          videoRef.current?.play().catch(err => {
            console.error('[v0] Error playing video:', err);
          });
        };
        setCameraActive(true);
        console.log('[v0] Camera started successfully');
      }
    } catch (error) {
      console.error('[v0] Camera access error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unable to access camera';
      setError(`Camera Error: ${errorMsg}. Please check your permissions.`);
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      try {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0);
          const photoData = canvasRef.current.toDataURL('image/jpeg', 0.95);
          setCapturedPhoto(photoData);
          console.log('[v0] Photo captured successfully');
          stopCamera();
        }
      } catch (err) {
        console.error('[v0] Error capturing photo:', err);
        setError('Failed to capture photo. Please try again.');
      }
    }
  };

  const stopCamera = () => {
    console.log('[v0] Stopping camera');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[v0] Camera track stopped');
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          const photoData = event.target?.result as string;
          setCapturedPhoto(photoData);
          console.log('[v0] File uploaded successfully');
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('[v0] Error uploading file:', err);
        setError('Failed to upload photo. Please try again.');
      }
    }
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoCapture(capturedPhoto);
      setCapturedPhoto(null);
      setMode('capture');
      onOpenChange(false);
    }
  };

  const discardPhoto = () => {
    setCapturedPhoto(null);
  };

  const handleClose = () => {
    stopCamera();
    setCapturedPhoto(null);
    setMode('capture');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Capture Staff Photo</DialogTitle>
        </DialogHeader>

        {!capturedPhoto ? (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}
            
            {mode === 'capture' ? (
              <div className="space-y-4">
                <div className="relative bg-slate-900 rounded-lg overflow-hidden w-full aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!cameraActive && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80">
                      <Camera className="h-12 w-12 text-slate-500 mb-2" />
                      <p className="text-slate-400 text-sm">Initializing camera...</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={capturePhoto}
                    disabled={!cameraActive}
                    className="flex-1 bg-accent hover:bg-accent/90 text-black font-medium disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Capture Photo
                  </Button>
                  <Button
                    onClick={() => { stopCamera(); setMode('upload'); }}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-200 hover:bg-slate-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-accent hover:bg-accent/90 text-black font-medium"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select Photo from Device
                </Button>
                <Button
                  onClick={() => { setMode('capture'); startCamera(); }}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-200 hover:bg-slate-700"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Back to Camera
                </Button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : (
          <div className="space-y-4">
            <img src={capturedPhoto} alt="Captured photo" className="w-full rounded-lg border-2 border-accent" />
            <div className="flex gap-2">
              <Button
                onClick={confirmPhoto}
                className="flex-1 bg-accent hover:bg-accent/90 text-black font-medium"
              >
                Use Photo
              </Button>
              <Button
                onClick={discardPhoto}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-200 hover:bg-slate-700"
              >
                Retake
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
