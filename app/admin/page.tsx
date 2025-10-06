'use client';

// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
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
import StudentHistoryTable from '../../components/StudentHistoryTable';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
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

      let activeSessions = 0;
      let todayAttendance = 0;

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        activeSessions = sessionsData.sessions.filter((s: QRSession) => s.is_active).length;
      }

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        
        // Calculate today's attendance
        const today = new Date().toISOString().split('T')[0];
        todayAttendance = attendanceData.attendance.filter((a: Attendance) => 
          a.marked_at.startsWith(today)
        ).length;
      }

      // Set all stats at once
      setStats({
        activeSessions,
        todayAttendance,
        totalStudents: 150,
        totalStaff: 25,
        weeklyAttendance: [45, 52, 48, 61, 55, 67, 58],
        monthlyAttendance: [420, 380, 445, 502, 478, 523, 467, 489, 445, 512, 478, 534]
      });

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
          <div className="flex justify-center items-center py-4 border-b">
            <Image
              src="https://avsec-it.vercel.app/_next/image?url=%2Flogo.png&w=828&q=75"
              alt="College Logo"
              width={800}
              height={200}
              className="h-auto max-h-16 w-auto"
              priority
            />
          </div>
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

        {/* Student History Table */}
        <StudentHistoryTable className="mt-8" />
      </div>
    </div>
  );
}

export default withAuth(AdminDashboard, ['admin']);
