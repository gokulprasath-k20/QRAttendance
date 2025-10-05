'use client';

// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  QrCode, 
  Users, 
  Clock, 
  BookOpen, 
  Calendar,
  Play,
  Square,
  Eye,
  LogOut
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { QRGenerator } from '../../components/QRGenerator';
import { AttendanceHistory } from '../../components/AttendanceHistory';
import { useAuth, withAuth } from '../../lib/auth';
import { QRSession, Staff } from '../../types';
import { getSubjectsForYearSem, formatDate } from '../../lib/utils';

function StaffDashboard() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<QRSession[]>([]);
  const [activeSession, setActiveSession] = useState<QRSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const [newSession, setNewSession] = useState({
    subject: '',
    year: '',
    semester: ''
  });

  const staff = user as Staff;

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSession) {
      fetchAttendance(activeSession.id);
      // Set up real-time attendance updates
      const interval = setInterval(() => {
        fetchAttendance(activeSession.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeSession]);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
        
        // Find active session
        const active = data.sessions.find((s: QRSession) => s.is_active);
        setActiveSession(active || null);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/attendance?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.attendance);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  };

  const createSession = async () => {
    if (!newSession.subject || !newSession.year || !newSession.semester) {
      alert('Please fill all fields');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSession.subject,
          year: parseInt(newSession.year),
          semester: parseInt(newSession.semester)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveSession(data.session);
        setSessions((prev: QRSession[]) => [data.session, ...prev]);
        setShowCreateForm(false);
        setNewSession({ subject: '', year: '', semester: '' });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const endSession = async () => {
    if (!activeSession) return;

    try {
      const response = await fetch(`/api/sessions/${activeSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false })
      });

      if (response.ok) {
        setActiveSession(null);
        fetchSessions();
      }
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const getYearOptions = () => [
    { value: '', label: 'Select Year' },
    { value: '1', label: '1st Year' },
    { value: '2', label: '2nd Year' },
    { value: '3', label: '3rd Year' },
    { value: '4', label: '4th Year' }
  ];

  const getSemesterOptions = () => {
    const year = parseInt(newSession.year);
    if (!year) return [{ value: '', label: 'Select Semester' }];
    
    const startSem = (year - 1) * 2 + 1;
    const endSem = year * 2;
    
    return [
      { value: '', label: 'Select Semester' },
      { value: startSem.toString(), label: `${startSem}${startSem === 1 ? 'st' : startSem === 2 ? 'nd' : startSem === 3 ? 'rd' : 'th'} Semester` },
      { value: endSem.toString(), label: `${endSem}${endSem === 2 ? 'nd' : endSem === 4 ? 'th' : endSem === 6 ? 'th' : 'th'} Semester` }
    ];
  };

  const getSubjectOptions = () => {
    const year = parseInt(newSession.year);
    const semester = parseInt(newSession.semester);
    
    if (!year || !semester) return [{ value: '', label: 'Select Subject' }];
    
    const availableSubjects = getSubjectsForYearSem(year, semester);
    const staffSubjects = staff.subjects.filter(subject => 
      availableSubjects.includes(subject)
    );
    
    return [
      { value: '', label: 'Select Subject' },
      ...staffSubjects.map(subject => ({ value: subject, label: subject }))
    ];
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
              <p className="text-gray-600">Welcome back, {staff.name}</p>
            </div>
            <Button variant="ghost" onClick={logout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - QR Code and Session Control */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Session */}
            {activeSession ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-5 h-5 text-success-600" />
                      Active Session
                    </CardTitle>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={endSession}
                      className="flex items-center gap-2"
                    >
                      <Square className="w-4 h-4" />
                      End Session
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Subject</p>
                        <p className="font-semibold">{activeSession.subject}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Year</p>
                        <p className="font-semibold">{activeSession.year}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Semester</p>
                        <p className="font-semibold">{activeSession.semester}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Started</p>
                        <p className="font-semibold text-sm">
                          {formatDate(activeSession.start_time)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* QR Code Generator */}
                <QRGenerator
                  sessionId={activeSession.id}
                  subject={activeSession.subject}
                  year={activeSession.year}
                  semester={activeSession.semester}
                  isActive={activeSession.is_active}
                />
              </div>
            ) : (
              /* Create Session */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Create New Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!showCreateForm ? (
                    <div className="text-center py-8">
                      <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Active Session
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Start a new attendance session to generate QR codes
                      </p>
                      <Button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Start New Session
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label="Year"
                          value={newSession.year}
                          onChange={(e) => setNewSession(prev => ({ 
                            ...prev, 
                            year: e.target.value,
                            semester: '',
                            subject: ''
                          }))}
                          options={getYearOptions()}
                        />
                        <Select
                          label="Semester"
                          value={newSession.semester}
                          onChange={(e) => setNewSession(prev => ({ 
                            ...prev, 
                            semester: e.target.value,
                            subject: ''
                          }))}
                          options={getSemesterOptions()}
                          disabled={!newSession.year}
                        />
                      </div>
                      <Select
                        label="Subject"
                        value={newSession.subject}
                        onChange={(e) => setNewSession(prev => ({ 
                          ...prev, 
                          subject: e.target.value
                        }))}
                        options={getSubjectOptions()}
                        disabled={!newSession.semester}
                      />
                      <div className="flex gap-3">
                        <Button
                          onClick={createSession}
                          loading={creating}
                          className="flex-1"
                        >
                          Create Session
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCreateForm(false);
                            setNewSession({ subject: '', year: '', semester: '' });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Live Attendance */}
          <div className="space-y-6">
            {/* Live Attendance */}
            {activeSession && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Live Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-primary-50 rounded-lg">
                      <span className="text-sm font-medium">Present</span>
                      <span className="text-lg font-bold text-primary-600">
                        {attendanceData.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Total Students</span>
                      <span className="text-lg font-bold text-gray-600">
                        {activeSession.total_students}
                      </span>
                    </div>
                    
                    {attendanceData.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        <h4 className="text-sm font-medium text-gray-700">Recent Check-ins</h4>
                        {attendanceData.slice(0, 10).map((attendance: any) => (
                          <motion.div
                            key={attendance.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-2 bg-white rounded border"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {attendance.student?.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {attendance.student?.reg_no}
                              </p>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(attendance.marked_at)}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{session.subject}</p>
                        <p className="text-xs text-gray-500">
                          Year {session.year} • Sem {session.semester}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(session.start_time)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          session.is_active 
                            ? 'bg-success-100 text-success-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {session.is_active ? 'Active' : 'Ended'}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {sessions.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      No sessions yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Attendance History Section */}
        <div className="mt-8">
          <AttendanceHistory staffId={staff.id} />
        </div>
      </div>
    </div>
  );
}

export default withAuth(StaffDashboard, ['staff']);
