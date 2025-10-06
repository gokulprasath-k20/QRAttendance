'use client';

// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  QrCode, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  Scan
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { QRScanner } from '../../components/QRScanner';
import { useAuth, withAuth } from '../../lib/auth';
import { Student, QRSession, Attendance } from '../../types';
import { formatDate, calculateAttendancePercentage, getAttendanceStatusColor } from '../../lib/utils';

function StudentDashboard() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<QRSession[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const student = user as Student;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, attendanceRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/attendance')
      ]);

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.sessions);
      }

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        setAttendance(attendanceData.attendance);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = async (qrToken: string) => {
    setScanning(true);
    setScanMessage('');

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken })
      });

      const data = await response.json();

      if (response.ok) {
        setScanMessage('✅ Attendance marked successfully!');
        // Close scanner on success
        setScannerOpen(false);
        // Refresh data with a small delay to ensure backend is updated
        setTimeout(() => {
          fetchData();
        }, 500);
      } else {
        setScanMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setScanMessage('❌ Failed to mark attendance');
    } finally {
      setScanning(false);
      setTimeout(() => setScanMessage(''), 3000);
    }
  };

  const handleScanError = (error: string) => {
    setScanMessage(`❌ ${error}`);
    setTimeout(() => setScanMessage(''), 3000);
  };

  const getAttendanceStats = () => {
    const totalSessions = sessions.filter(s => !s.is_active).length;
    const attendedSessions = attendance.length;
    const percentage = calculateAttendancePercentage(attendedSessions, totalSessions);
    
    return { totalSessions, attendedSessions, percentage };
  };

  const getRecentSessions = () => {
    return sessions
      .filter(session => {
        const hasAttended = attendance.some(a => a.session_id === session.id);
        return !session.is_active && !hasAttended;
      })
      .slice(0, 5);
  };

  const getActiveSessions = () => {
    return sessions.filter(s => s.is_active);
  };

  const stats = getAttendanceStats();
  const recentMissedSessions = getRecentSessions();
  const activeSessions = getActiveSessions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-center items-center py-4 border-b">
            <Image
              src="/logo (1).png"
              alt="College Logo"
              width={800}
              height={200}
              className="h-auto max-h-16 w-auto"
              priority
            />
          </div>
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 font-playfair">Student Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600 font-rubik">
                Welcome back, {student.name} • {student.reg_no}
              </p>
            </div>
            <Button variant="ghost" onClick={logout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Scan Message */}
        {scanMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg ${
              scanMessage.includes('✅') 
                ? 'bg-success-50 border border-success-200 text-success-700'
                : 'bg-error-50 border border-error-200 text-error-700'
            }`}
          >
            {scanMessage}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - QR Scanner and Active Sessions */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* QR Scanner */}
            <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-primary-700">
                  <QrCode className="w-6 h-6" />
                  Scan QR Code
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Scan the QR code displayed by your instructor to mark attendance
                </p>
              </CardHeader>
              <CardContent className="text-center">
                <Button
                  onClick={() => setScannerOpen(true)}
                  disabled={scanning}
                  size="lg"
                  className="w-full sm:w-auto flex items-center gap-2"
                >
                  <Scan className="w-5 h-5" />
                  {scanning ? 'Processing...' : 'Open Scanner'}
                </Button>
                
                {activeSessions.length > 0 && (
                  <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg">
                    <p className="text-sm text-success-700">
                      🟢 {activeSessions.length} active session{activeSessions.length > 1 ? 's' : ''} available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Sessions */}
            {activeSessions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-success-600" />
                    Active Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeSessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-success-50 border border-success-200 rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold text-success-800">
                            {session.subject}
                          </h3>
                          <p className="text-sm text-success-600">
                            {session.staff?.name} • Started {formatDate(session.start_time)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                            🟢 Live
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Attendance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Recent Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendance.slice(0, 10).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{record.session?.subject}</p>
                        <p className="text-sm text-gray-500">
                          {record.session?.staff?.name} • {formatDate(record.session?.date || '')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success-600" />
                        <span className="text-sm text-success-600">Present</span>
                      </div>
                    </div>
                  ))}
                  
                  {attendance.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No attendance records yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats and Info */}
          <div className="space-y-6">
            {/* Attendance Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Attendance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${getAttendanceStatusColor(stats.percentage)}`}>
                      {stats.percentage}%
                    </div>
                    <p className="text-sm text-gray-600">Overall Attendance</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-success-50 rounded-lg">
                      <div className="text-2xl font-bold text-success-600">
                        {stats.attendedSessions}
                      </div>
                      <p className="text-xs text-success-600">Attended</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {stats.totalSessions}
                      </div>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        stats.percentage >= 80 
                          ? 'bg-success-600' 
                          : stats.percentage >= 60 
                          ? 'bg-warning-600' 
                          : 'bg-error-600'
                      }`}
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Academic Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registration No.</span>
                    <span className="font-medium">{student.reg_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Year</span>
                    <span className="font-medium">{student.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Semester</span>
                    <span className="font-medium">{student.semester}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium text-sm">{student.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Missed Sessions Alert */}
            {recentMissedSessions.length > 0 && (
              <Card className="border-warning-200 bg-warning-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-warning-700">
                    <XCircle className="w-5 h-5" />
                    Missed Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentMissedSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-2 bg-white rounded border"
                      >
                        <div>
                          <p className="text-sm font-medium">{session.subject}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(session.date)}
                          </p>
                        </div>
                        <XCircle className="w-4 h-4 text-warning-600" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />
    </div>
  );
}

export default withAuth(StudentDashboard, ['student']);
