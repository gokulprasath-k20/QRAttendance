import CryptoJS from 'crypto-js';
import { OTPToken } from '@/types';

const SECRET_KEY = process.env.NEXT_PUBLIC_OTP_SECRET || 'default-secret-key-change-in-production';

/**
 * Encrypts OTP token data using AES encryption
 */
export function encryptOTPToken(token: OTPToken): string {
  try {
    const jsonString = JSON.stringify(token);
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt OTP token');
  }
}

/**
 * Decrypts OTP token data
 */
export function decryptOTPToken(encryptedData: string): OTPToken {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!jsonString) {
      throw new Error('Invalid encrypted data');
    }
    
    const token = JSON.parse(jsonString) as OTPToken;
    
    // Validate token structure
    if (!token.sessionId || !token.timestamp || !token.subject || !token.year || !token.semester || !token.otp) {
      throw new Error('Invalid token structure');
    }
    
    return token;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt OTP token');
  }
}

/**
 * Validates if OTP token is still valid (within 15 seconds)
 */
export function isOTPTokenValid(token: OTPToken): boolean {
  const currentTime = Date.now();
  const tokenTime = token.timestamp;
  const timeDifference = Math.abs(currentTime - tokenTime);
  
  // Token is valid for 15 seconds (15000ms)
  return timeDifference <= 15000;
}

/**
 * Generates a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generates a new OTP token with current timestamp and OTP
 */
export function generateOTPToken(sessionId: string, subject: string, year: number, semester: number): OTPToken {
  return {
    sessionId,
    timestamp: Date.now(),
    subject,
    year,
    semester,
    otp: generateOTP()
  };
}

/**
 * Hash password using bcrypt-like algorithm
 */
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password + SECRET_KEY).toString();
}

/**
 * Verify password against hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  const passwordHash = hashPassword(password);
  return passwordHash === hash;
}
