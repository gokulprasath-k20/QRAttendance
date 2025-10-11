'use client';

// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, X, CheckCircle, AlertCircle, Hash } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface OTPInputProps {
  onSubmitSuccess: (otp: string) => void;
  onSubmitError: (error: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function OTPInput({ onSubmitSuccess, onSubmitError, isOpen, onClose }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<'success' | 'error' | null>(null);
  const [resultMessage, setResultMessage] = useState('');
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Focus first input when modal opens
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } else {
      // Reset state when modal closes
      setOtp(['', '', '', '', '', '']);
      setSubmitResult(null);
      setResultMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length === 6) {
      const newOtp = digits.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      onSubmitError('Please enter a complete 6-digit OTP');
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Show success animation
      setSubmitResult('success');
      setResultMessage('OTP submitted successfully!');
      
      // Call success callback after animation
      setTimeout(() => {
        onSubmitSuccess(otpString);
        onClose();
      }, 1500);

    } catch (error: any) {
      setSubmitResult('error');
      setResultMessage(error.message || 'Invalid OTP');
      
      // Reset form after error
      setTimeout(() => {
        setSubmitResult(null);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setIsSubmitting(false);
      }, 2000);
    }
  };

  const clearOTP = () => {
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
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
                <Key className="w-5 h-5" />
                Enter OTP Code
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
              <div className="relative">
                {/* OTP Input Fields */}
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Enter the 6-digit OTP code displayed by your instructor
                    </p>
                    
                    <div className="flex justify-center gap-2 mb-6">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { inputRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={index === 0 ? handlePaste : undefined}
                          className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none transition-colors"
                          disabled={isSubmitting || submitResult !== null}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || otp.join('').length !== 6 || submitResult !== null}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit OTP'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={clearOTP}
                      disabled={isSubmitting || submitResult !== null}
                    >
                      Clear
                    </Button>
                  </div>

                  {/* Instructions */}
                  <div className="text-center text-xs text-gray-500">
                    <p>Tip: You can paste a 6-digit code directly</p>
                  </div>
                </div>

                {/* Result Overlay */}
                <AnimatePresence>
                  {submitResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center rounded-lg"
                    >
                      <div className="text-center">
                        {submitResult === 'success' ? (
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
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
