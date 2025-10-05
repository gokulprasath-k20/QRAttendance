'use client';

// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, CheckCircle, AlertCircle, Scan } from 'lucide-react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { decryptQRToken, isQRTokenValid } from '@/lib/crypto';

interface QRScannerProps {
  onScanSuccess: (token: string) => void;
  onScanError: (error: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function QRScanner({ onScanSuccess, onScanError, isOpen, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [resultMessage, setResultMessage] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        startScanning();
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setHasPermission(false);
      onScanError('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setIsScanning(false);
    setScanResult(null);
  };

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    scanIntervalRef.current = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          handleQRDetected(code.data);
        }
      }
    }, 100);
  };

  const handleQRDetected = async (data: string) => {
    try {
      // Stop scanning temporarily
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }

      // Decrypt and validate token
      const token = decryptQRToken(data);
      
      if (!isQRTokenValid(token)) {
        throw new Error('QR code has expired. Please scan a fresh code.');
      }

      // Show success animation
      setScanResult('success');
      setResultMessage('QR Code scanned successfully!');
      
      // Call success callback after animation
      setTimeout(() => {
        onScanSuccess(data);
        onClose();
      }, 1500);

    } catch (error: any) {
      setScanResult('error');
      setResultMessage(error.message || 'Invalid QR code');
      
      // Resume scanning after error
      setTimeout(() => {
        setScanResult(null);
        if (isScanning) {
          startScanning();
        }
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Scan className="w-5 h-5" />
                Scan QR Code
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1"
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>

            <CardContent>
              {hasPermission === false ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 text-error-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Camera Access Required
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Please allow camera access to scan QR codes
                  </p>
                  <Button onClick={startCamera}>
                    Try Again
                  </Button>
                </div>
              ) : hasPermission === null ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Requesting camera access...</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Video Stream */}
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover"
                      playsInline
                      muted
                    />
                    
                    {/* Scanning Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="w-48 h-48 border-2 border-white rounded-lg">
                          {/* Corner indicators */}
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-400"></div>
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-400"></div>
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-400"></div>
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-400"></div>
                        </div>
                        
                        {/* Scanning line animation */}
                        {isScanning && !scanResult && (
                          <motion.div
                            className="absolute left-0 right-0 h-0.5 bg-primary-400"
                            animate={{ y: [0, 192, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Result Overlay */}
                    <AnimatePresence>
                      {scanResult && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center"
                        >
                          <div className="text-center text-white">
                            {scanResult === 'success' ? (
                              <CheckCircle className="w-16 h-16 text-success-400 mx-auto mb-4" />
                            ) : (
                              <AlertCircle className="w-16 h-16 text-error-400 mx-auto mb-4" />
                            )}
                            <p className="text-lg font-semibold">{resultMessage}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Hidden canvas for image processing */}
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />

                  {/* Instructions */}
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Position the QR code within the frame to scan
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
