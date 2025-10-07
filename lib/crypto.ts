import CryptoJS from 'crypto-js';
import { QRToken } from '@/types';

const SECRET_KEY = process.env.NEXT_PUBLIC_QR_SECRET || 'default-secret-key-change-in-production';

/**
 * Encrypts QR token data using AES encryption
 */
export function encryptQRToken(token: QRToken): string {
  try {
    const jsonString = JSON.stringify(token);
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt QR token');
  }
}

/**
 * Decrypts QR token data
 */
export function decryptQRToken(encryptedData: string): QRToken {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!jsonString) {
      throw new Error('Invalid encrypted data');
    }
    
    const token = JSON.parse(jsonString) as QRToken;
    
    // Validate token structure
    if (!token.sessionId || !token.timestamp || !token.subject || !token.year || !token.semester) {
      throw new Error('Invalid token structure');
    }
    
    return token;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt QR token');
  }
}

/**
 * Validates if QR token is still valid (within 5 seconds)
 */
export function isQRTokenValid(token: QRToken): boolean {
  const currentTime = Date.now();
  const tokenTime = token.timestamp;
  const timeDifference = Math.abs(currentTime - tokenTime);
  
  // Token is valid for 5 seconds (5000ms)
  return timeDifference <= 5000;
}

/**
 * Generates a new QR token with current timestamp
 */
export function generateQRToken(sessionId: string, subject: string, year: number, semester: number): QRToken {
  return {
    sessionId,
    timestamp: Date.now(),
    subject,
    year,
    semester
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
