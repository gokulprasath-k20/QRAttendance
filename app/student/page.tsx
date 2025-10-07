'use client';

// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  QrCode, 
  Calendar, 
  CheckCircle,
  LogOut,
  Scan,
  History
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { QRScanner } from '../../components/QRScanner';
import StudentAttendanceHistory from '../../components/StudentAttendanceHistory';
import { useAuth, withAuth } from '../../lib/auth';
import { Student, QRSession, Attendance } from '../../types';
import { formatDate } from '../../lib/utils';

function StudentDashboard() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<QRSession[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

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

  const getActiveSessions = () => {
    return sessions.filter(s => s.is_active);
  };

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

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <QrCode className="w-4 h-4 inline mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <History className="w-4 h-4 inline mr-2" />
                History
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6">
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
          )}

          {activeTab === 'history' && (
            <StudentAttendanceHistory studentId={student.id} />
          )}
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
