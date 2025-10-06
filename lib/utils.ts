import { type ClassValue, clsx } from 'clsx';
// @ts-ignore
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert date to Indian Standard Time (IST)
 */
function toIST(date: Date): Date {
  // IST is UTC+5:30
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  return new Date(utc + istOffset);
}

/**
 * Format date for display in Indian Standard Time
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const istDate = toIST(dateObj);
  
  if (isToday(istDate)) {
    return `Today, ${format(istDate, 'HH:mm')} IST`;
  }
  
  if (isYesterday(istDate)) {
    return `Yesterday, ${format(istDate, 'HH:mm')} IST`;
  }
  
  return format(istDate, 'MMM dd, yyyy HH:mm') + ' IST';
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Calculate attendance percentage
 */
export function calculateAttendancePercentage(attended: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
}

/**
 * Get attendance status color
 */
export function getAttendanceStatusColor(percentage: number): string {
  if (percentage >= 80) return 'text-success-600 bg-success-100';
  if (percentage >= 60) return 'text-warning-600 bg-warning-100';
  return 'text-error-600 bg-error-100';
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate registration number format
 */
export function isValidRegNo(regNo: string): boolean {
  // Registration number should only contain numerical values
  const regNoRegex = /^\d+$/;
  return regNoRegex.test(regNo) && regNo.length >= 3 && regNo.length <= 15;
}

/**
 * Get subjects for year and semester
 */
export function getSubjectsForYearSem(year: number, semester: number): string[] {
  const subjects = {
    1: {
      1: ["Mathematics I", "Physics", "Chemistry", "Engineering Graphics", "Basic Electrical Engineering", "Programming in C"],
      2: ["Mathematics II", "Engineering Mechanics", "Basic Electronics", "Environmental Science", "Workshop Technology", "Communication Skills"]
    },
    2: {
      3: ["DM", "DSA", "OOPS", "FDS", "DPCO"],
      4: ["TOC", "AI&ML", "DBMS", "WE", "IOS", "ESS"]
    },
    3: {
      5: ["Computer Network", "FSWD", "Cloud Computing", "Distributed Computing", "STA"],
      6: ["Software Engineering", "Mobile App Development", "Information Security", "HCI", "Project Management", "Elective I"]
    },
    4: {
      7: ["Machine Learning", "Blockchain Technology", "Advanced Database Systems", "Cyber Security", "Elective II", "Major Project I"],
      8: ["Advanced AI", "IoT and Embedded Systems", "Advanced Software Engineering", "Industry Internship", "Elective III", "Major Project II"]
    }
  };

  const yearData = subjects[year as keyof typeof subjects];
  if (!yearData) return [];
  return yearData[semester as keyof typeof yearData] || [];
}

/**
 * Get all subjects for staff selection
 */
export function getAllSubjects(): string[] {
  const allSubjects = new Set<string>();
  
  for (let year = 1; year <= 4; year++) {
    for (let sem = 1; sem <= 2; sem++) {
      const subjects = getSubjectsForYearSem(year, year === 1 ? sem : year === 2 ? sem + 2 : year === 3 ? sem + 4 : sem + 6);
      subjects.forEach(subject => allSubjects.add(subject));
    }
  }
  
  return Array.from(allSubjects).sort();
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      textArea.remove();
      return result;
    }
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
}
