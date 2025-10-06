'use client';

// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  QrCode, 
  Calendar, 
  BookOpen, 
  LogOut,
  Scan,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  History
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { QRScanner } from '../../components/QRScanner';
import { useAuth, withAuth } from '../../lib/auth';
import { Student, QRSession, Attendance } from '../../types';
import { formatDate } from '../../lib/utils';

function StudentDashboard() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<QRSession[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    subject: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    search: ''
  });

  const student = user as Student;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [attendance, filters]);

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

  const applyFilters = () => {
    let filtered = [...attendance];

    // Filter by subject
    if (filters.subject) {
      filtered = filtered.filter(record => 
        record.session?.subject?.toLowerCase().includes(filters.subject.toLowerCase())
      );
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.marked_at);
        const fromDate = new Date(filters.dateFrom);
        return recordDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.marked_at);
        const toDate = new Date(filters.dateTo);
        return recordDate <= toDate;
      });
    }

    // Filter by search term
    if (filters.search) {
      filtered = filtered.filter(record => 
        record.session?.subject?.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.session?.staff?.name?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredAttendance(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      subject: '',
      dateFrom: '',
      dateTo: '',
      status: '',
      search: ''
    });
  };

  const getActiveSessions = () => {
    return sessions.filter(s => s.is_active);
  };

  const activeSessions = getActiveSessions();
  const uniqueSubjects = Array.from(new Set(attendance.map(a => a.session?.subject).filter(Boolean)));

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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - QR Scanner */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
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
                  className="w-full flex items-center gap-2"
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
          </div>

          {/* Right Column - Attendance History */}
          <div className="lg:col-span-3 space-y-6">
            {/* Attendance History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Attendance History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-4 h-4 text-gray-600" />
                    <h3 className="font-medium text-gray-700">Filters</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="ml-auto"
                    >
                      Clear All
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Subject Filter */}
                    <Select
                      value={filters.subject}
                      onChange={(e) => handleFilterChange('subject', e.target.value)}
                      options={[
                        { value: '', label: 'All Subjects' },
                        ...uniqueSubjects.map(subject => ({ value: subject, label: subject }))
                      ]}
                    />

                    {/* Date From */}
                    <Input
                      type="date"
                      placeholder="From Date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    />

                    {/* Date To */}
                    <Input
                      type="date"
                      placeholder="To Date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    />
                  </div>
                </div>

                {/* Attendance Records */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-600">
                      Showing {filteredAttendance.length} of {attendance.length} records
                    </p>
                  </div>
                  
                  {filteredAttendance.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredAttendance.map((record) => (
                        <motion.div
                          key={record.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-5 h-5 text-success-600" />
                              <div>
                                <p className="font-medium text-gray-900">{record.session?.subject}</p>
                                <p className="text-sm text-gray-500">
                                  {record.session?.staff?.name} • {formatDate(record.marked_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                              Present
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No attendance records found</p>
                      <p className="text-sm text-gray-400">
                        {attendance.length === 0 
                          ? "You haven't marked any attendance yet" 
                          : "Try adjusting your filters"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
