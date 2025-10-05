'use client';

// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  Download,
  Eye,
  LogOut,
  Activity
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth, withAuth } from '../../lib/auth';
import { QRSession, Attendance, DashboardStats } from '../../types';
import { formatDate, calculateAttendancePercentage } from '../../lib/utils';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<QRSession[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [sessionsRes, attendanceRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/attendance')
      ]);

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setRecentSessions(sessionsData.sessions.slice(0, 10));
        
        // Calculate stats from sessions data
        const activeSessions = sessionsData.sessions.filter((s: QRSession) => s.is_active).length;
        setStats(prev => ({ ...prev, activeSessions } as DashboardStats));
      }

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        setRecentAttendance(attendanceData.attendance.slice(0, 10));
        
        // Calculate today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendanceData.attendance.filter((a: Attendance) => 
          a.marked_at.startsWith(today)
        ).length;
        
        setStats(prev => ({ ...prev, todayAttendance } as DashboardStats));
      }

      // Mock additional stats (in real app, create API endpoint)
      setStats(prev => ({
        ...prev,
        totalStudents: 150,
        totalStaff: 25,
        weeklyAttendance: [45, 52, 48, 61, 55, 67, 58],
        monthlyAttendance: [420, 380, 445, 502, 478, 523, 467, 489, 445, 512, 478, 534]
      } as DashboardStats));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: 'excel' | 'pdf') => {
    try {
      const response = await fetch(`/api/export?type=${type}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-report.${type === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">System overview and management</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => exportData('excel')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                onClick={() => exportData('pdf')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
              <Button variant="ghost" onClick={logout} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Students</p>
                    <p className="text-3xl font-bold">{stats?.totalStudents || 0}</p>
                  </div>
                  <GraduationCap className="w-12 h-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Total Staff</p>
                    <p className="text-3xl font-bold">{stats?.totalStaff || 0}</p>
                  </div>
                  <Users className="w-12 h-12 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Active Sessions</p>
                    <p className="text-3xl font-bold">{stats?.activeSessions || 0}</p>
                  </div>
                  <Activity className="w-12 h-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Today's Attendance</p>
                    <p className="text-3xl font-bold">{stats?.todayAttendance || 0}</p>
                  </div>
                  <Calendar className="w-12 h-12 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{session.subject}</h3>
                      <p className="text-sm text-gray-600">
                        {session.staff?.name} • Year {session.year} Sem {session.semester}
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
                      <p className="text-xs text-gray-500 mt-1">
                        {session.total_students} students
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {recentSessions.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No sessions yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAttendance.map((attendance) => (
                  <motion.div
                    key={attendance.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{attendance.student?.name}</h3>
                      <p className="text-sm text-gray-600">
                        {attendance.student?.reg_no} • {attendance.session?.subject}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(attendance.marked_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                        Present
                      </span>
                    </div>
                  </motion.div>
                ))}
                
                {recentAttendance.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No attendance records yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="flex items-center gap-2 h-12"
                onClick={() => window.open('/admin/users', '_blank')}
              >
                <Users className="w-5 h-5" />
                Manage Users
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 h-12"
                onClick={() => window.open('/admin/sessions', '_blank')}
              >
                <BookOpen className="w-5 h-5" />
                View All Sessions
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 h-12"
                onClick={() => window.open('/admin/reports', '_blank')}
              >
                <TrendingUp className="w-5 h-5" />
                Generate Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withAuth(AdminDashboard, ['admin']);
