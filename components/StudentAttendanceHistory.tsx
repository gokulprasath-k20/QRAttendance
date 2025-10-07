'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Filter, 
  Download, 
  Search,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { formatDate } from '../lib/utils';

interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  marked_at: string;
  session: {
    id: string;
    subject: string;
    date: string;
    start_time: string;
    end_time: string;
    staff: {
      name: string;
    };
  };
}

interface StudentAttendanceHistoryProps {
  studentId: string;
}

export default function StudentAttendanceHistory({ studentId }: StudentAttendanceHistoryProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subject: '',
    dateFrom: '',
    dateTo: '',
    status: '', // 'present', 'absent', or ''
    search: ''
  });

  useEffect(() => {
    fetchData();
  }, [studentId]);

  useEffect(() => {
    applyFilters();
  }, [attendance, allSessions, filters]);

  const fetchData = async () => {
    try {
      const [attendanceRes, sessionsRes] = await Promise.all([
        fetch('/api/attendance'),
        fetch('/api/sessions')
      ]);

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        setAttendance(attendanceData.attendance || []);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setAllSessions(sessionsData.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Create a comprehensive list of all sessions with attendance status
    const sessionMap = new Map();
    
    // Add all sessions to the map
    allSessions.forEach(session => {
      if (!session.is_active) { // Only include completed sessions
        sessionMap.set(session.id, {
          ...session,
          status: 'absent',
          marked_at: null
        });
      }
    });

    // Update with actual attendance records
    attendance.forEach(record => {
      if (sessionMap.has(record.session_id)) {
        sessionMap.set(record.session_id, {
          ...sessionMap.get(record.session_id),
          status: 'present',
          marked_at: record.marked_at
        });
      }
    });

    let filtered = Array.from(sessionMap.values());

    // Apply filters
    if (filters.subject) {
      filtered = filtered.filter(item => 
        item.subject.toLowerCase().includes(filters.subject.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(item => 
        new Date(item.date) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(item => 
        new Date(item.date) <= new Date(filters.dateTo)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.search) {
      filtered = filtered.filter(item =>
        item.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.staff?.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredData(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
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

  const exportData = () => {
    // Simple CSV export
    const headers = ['Date', 'Subject', 'Staff', 'Status', 'Marked At'];
    const csvData = filteredData.map(item => [
      formatDate(item.date),
      item.subject,
      item.staff?.name || 'N/A',
      item.status === 'present' ? 'Present' : 'Absent',
      item.marked_at ? formatDate(item.marked_at) : 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-attendance-history.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getSubjectOptions = () => {
    const subjectSet = new Set(allSessions.map(s => s.subject));
    const subjects = Array.from(subjectSet);
    return [
      { value: '', label: 'All Subjects' },
      ...subjects.map(subject => ({ value: subject, label: subject }))
    ];
  };

  const getStats = () => {
    const total = filteredData.length;
    const present = filteredData.filter(item => item.status === 'present').length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, percentage };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search subject or staff..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              options={getSubjectOptions()}
            />

            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'present', label: 'Present' },
                { value: 'absent', label: 'Absent' }
              ]}
            />

            <Input
              type="date"
              placeholder="From Date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />

            <Input
              type="date"
              placeholder="To Date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex-1"
              >
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={exportData}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-sm text-gray-600">Total Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success-600">{stats.present}</div>
            <p className="text-sm text-gray-600">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-error-600">{stats.absent}</div>
            <p className="text-sm text-gray-600">Absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${
              stats.percentage >= 80 ? 'text-success-600' : 
              stats.percentage >= 60 ? 'text-warning-600' : 'text-error-600'
            }`}>
              {stats.percentage}%
            </div>
            <p className="text-sm text-gray-600">Attendance</p>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Attendance History ({filteredData.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No attendance records found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredData.map((record, index) => (
                <motion.div
                  key={record.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    record.status === 'present' 
                      ? 'bg-success-50 border-success-200' 
                      : 'bg-error-50 border-error-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {record.status === 'present' ? (
                        <CheckCircle className="w-5 h-5 text-success-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-error-600" />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {record.subject}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {record.staff?.name} • {formatDate(record.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      record.status === 'present'
                        ? 'bg-success-100 text-success-800'
                        : 'bg-error-100 text-error-800'
                    }`}>
                      {record.status === 'present' ? 'Present' : 'Absent'}
                    </span>
                    {record.marked_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDate(record.marked_at)}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
