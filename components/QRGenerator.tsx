'use client';

// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, Clock, Users } from 'lucide-react';
import { encryptQRToken, generateQRToken } from '../lib/crypto';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface QRGeneratorProps {
  sessionId: string;
  subject: string;
  year: number;
  semester: number;
  isActive: boolean;
  onTokenUpdate?: (token: string) => void;
}

export function QRGenerator({
  sessionId,
  subject,
  year,
  semester,
  isActive,
  onTokenUpdate
}: QRGeneratorProps) {
  const [currentToken, setCurrentToken] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(8);
  const [rotationCount, setRotationCount] = useState<number>(0);

  const generateNewToken = useCallback(() => {
    if (!isActive) return;

    const token = generateQRToken(sessionId, subject, year, semester);
    const encryptedToken = encryptQRToken(token);
    setCurrentToken(encryptedToken);
    setTimeLeft(8);
    setRotationCount(prev => prev + 1);
    
    if (onTokenUpdate) {
      onTokenUpdate(encryptedToken);
    }
  }, [sessionId, subject, year, semester, isActive, onTokenUpdate]);

  useEffect(() => {
    if (!isActive) return;

    // Generate initial token
    generateNewToken();

    // Set up rotation timer
    const rotationInterval = setInterval(generateNewToken, 8000);

    return () => {
      clearInterval(rotationInterval);
    };
  }, [generateNewToken, isActive]);

  useEffect(() => {
    if (!isActive) return;

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 8; // Reset to 8 when it reaches 0
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, [isActive]);

  if (!isActive) {
    return (
      <Card className="text-center">
        <CardContent className="py-12">
          <div className="text-gray-400 mb-4">
            <RefreshCw className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Session Inactive
          </h3>
          <p className="text-gray-500">
            Start a session to generate QR codes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-primary-700">
          <Users className="w-5 h-5" />
          Attendance QR Code
        </CardTitle>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
          <span className="bg-white px-3 py-1 rounded-full">
            {subject}
          </span>
          <span className="bg-white px-3 py-1 rounded-full">
            Year {year} • Sem {semester}
          </span>
        </div>
      </CardHeader>

      <CardContent className="text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={rotationCount}
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
            transition={{ duration: 0.3 }}
            className="qr-container mb-6"
          >
            <QRCodeSVG
              value={currentToken}
              size={200}
              level="H"
              includeMargin={true}
              className="mx-auto"
            />
          </motion.div>
        </AnimatePresence>

        {/* Countdown Timer */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-medium text-primary-600">
            Refreshes in {timeLeft}s
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <motion.div
            className="bg-primary-600 h-2 rounded-full"
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / 8) * 100}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>

        {/* Rotation Counter */}
        <div className="text-xs text-gray-500">
          Rotation #{rotationCount}
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-700">
            🔒 This QR code rotates every 8 seconds for maximum security
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
