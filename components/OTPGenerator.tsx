'use client';

// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Clock, Users, Key } from 'lucide-react';
import { encryptOTPToken, generateOTPToken } from '../lib/crypto';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface OTPGeneratorProps {
  sessionId: string;
  subject: string;
  year: number;
  semester: number;
  isActive: boolean;
  onTokenUpdate?: (token: string) => void;
}

export function OTPGenerator({
  sessionId,
  subject,
  year,
  semester,
  isActive,
  onTokenUpdate
}: OTPGeneratorProps) {
  const [currentOTP, setCurrentOTP] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(8);
  const [rotationCount, setRotationCount] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Single interval ref to control everything
  const masterIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Single function to handle OTP generation and countdown
  const handleOTPCycle = useCallback(() => {
    if (!isActive || isGenerating) return;
    
    setIsGenerating(true);
    console.log(`🔄 OTP Rotation #${rotationCount} - Generated at ${new Date().toLocaleTimeString()} - Next in 8s`);
    
    // Generate new OTP
    const token = generateOTPToken(sessionId, subject, year, semester);
    const encryptedToken = encryptOTPToken(token);
    setCurrentOTP(token.otp);
    setRotationCount(prev => prev + 1);
    
    if (onTokenUpdate) {
      onTokenUpdate(encryptedToken);
    }
    
    // Reset countdown to 8 seconds
    setTimeLeft(8);
    setIsGenerating(false);
  }, [sessionId, subject, year, semester, isActive, onTokenUpdate, isGenerating, rotationCount]);

  // Single useEffect to manage everything
  useEffect(() => {
    // Clear any existing interval
    if (masterIntervalRef.current) {
      clearInterval(masterIntervalRef.current);
      masterIntervalRef.current = null;
    }

    if (!isActive) {
      setCurrentOTP('');
      setTimeLeft(8);
      setRotationCount(1);
      return;
    }

    // Generate initial OTP immediately
    handleOTPCycle();

    // Set up master interval that handles both OTP rotation and countdown
    let countdownTimer = 8;
    masterIntervalRef.current = setInterval(() => {
      countdownTimer--;
      setTimeLeft(countdownTimer);
      
      // When countdown reaches 0, generate new OTP and reset
      if (countdownTimer <= 0) {
        handleOTPCycle();
        countdownTimer = 8;
      }
    }, 1000);

    // Cleanup function
    return () => {
      if (masterIntervalRef.current) {
        clearInterval(masterIntervalRef.current);
        masterIntervalRef.current = null;
      }
    };
  }, [isActive, sessionId, subject, year, semester]); // Removed handleOTPCycle from deps to prevent recreation

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (masterIntervalRef.current) {
        clearInterval(masterIntervalRef.current);
        masterIntervalRef.current = null;
      }
    };
  }, []);

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
            Start a session to generate OTP codes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-primary-700">
          <Key className="w-5 h-5" />
          Attendance OTP Code
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
            className="otp-container mb-6"
          >
            {/* OTP Display */}
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-primary-200">
              <div className="text-6xl font-bold text-primary-600 tracking-widest font-mono">
                {currentOTP}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                6-Digit OTP Code (8s rotation)
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Generated: {new Date().toLocaleTimeString()}
              </div>
            </div>
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

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-700">
            🔒 This OTP code rotates every <strong>8 seconds</strong> for maximum security
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-yellow-600">
              ⏱️ Next rotation in: <strong>{timeLeft}s</strong>
            </p>
            <p className="text-xs font-semibold text-primary-600">
              Rotation #{rotationCount}
            </p>
          </div>
          {isGenerating && (
            <p className="text-xs text-green-600 mt-1 font-medium">
              🔄 Generating new OTP...
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Session: {sessionId.slice(-4)} | {subject}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
