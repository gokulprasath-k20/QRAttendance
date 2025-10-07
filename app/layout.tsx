import type { Metadata } from 'next';
import { Rubik, Playfair_Display } from 'next/font/google';
import { AuthProvider } from '../lib/auth';
import './globals.css';

const rubik = Rubik({ 
  subsets: ['latin'],
  variable: '--font-rubik',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'QR Attendance Management System',
  description: 'Modern, secure QR-based attendance management for educational institutions',
  manifest: '/manifest.json',
  themeColor: '#8B5CF6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'QR Attendance',
  },
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8B5CF6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="QR Attendance" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${rubik.variable} ${playfairDisplay.variable} font-sans`}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
