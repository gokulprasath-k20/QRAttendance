'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  Users,
  TrendingUp,
  BookOpen,
  ChevronDown,
  X,
  BarChart3
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { StudentHistoryRecord, StudentHistoryFilters, SUBJECTS_BY_YEAR_SEM } from '../types';
import { formatDate } from '../lib/utils';

interface StudentHistoryProps {
  className?: string;
}

export default function StudentHistory({ className }: StudentHistoryProps) {
  const [students, setStudents] = useState<StudentHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentHistoryRecord | null>(null);
  const [filters, setFilters] = useState<StudentHistoryFilters>({
    attendanceRange: { min: 0, max: 100 }
  });

  useEffect(() => {
    fetchStudentHistory();
  }, [filters]);

  const fetchStudentHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.year) params.append('year', filters.year.toString());
      if (filters.semester) params.append('semester', filters.semester.toString());
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.search) params.append('search', filters.search);
      if (filters.attendanceRange?.min !== undefined) params.append('minAttendance', filters.attendanceRange.min.toString());
      if (filters.attendanceRange?.max !== undefined) params.append('maxAttendance', filters.attendanceRange.max.toString());
      if (filters.dateRange?.start) params.append('startDate', filters.dateRange.start);
      if (filters.dateRange?.end) params.append('endDate', filters.dateRange.end);

      const response = await fetch(`/api/students/history?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Failed to fetch student history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof StudentHistoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ attendanceRange: { min: 0, max: 100 } });
  };

  const exportData = async (format: 'excel' | 'pdf') => {
    try {
      const params = new URLSearchParams();
      params.append('type', format);
      params.append('data', 'student-history');
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            Object.entries(value).forEach(([subKey, subValue]) => {
              if (subValue !== undefined && subValue !== null) {
                params.append(`${key}.${subKey}`, subValue.toString());
              }
            });
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/export?${params.toString()}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student-history.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSubjectsForYear = (year: number, semester: number) => {
    return SUBJECTS_BY_YEAR_SEM[year as keyof typeof SUBJECTS_BY_YEAR_SEM]?.[semester as keyof typeof SUBJECTS_BY_YEAR_SEM[1]] || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student History</h2>
          <p className="text-gray-600">Comprehensive attendance records and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportData('excel')}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => exportData('pdf')}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Filters</CardTitle>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Name, Reg No, Email..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <select
                    value={filters.year || ''}
                    onChange={(e) => handleFilterChange('year', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={filters.semester || ''}
                    onChange={(e) => handleFilterChange('semester', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={filters.subject || ''}
                    onChange={(e) => handleFilterChange('subject', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Subjects</option>
                    {filters.year && filters.semester && getSubjectsForYear(filters.year, filters.semester).map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                {/* Attendance Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Attendance %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.attendanceRange?.min || 0}
                    onChange={(e) => handleFilterChange('attendanceRange', {
                      ...filters.attendanceRange,
                      min: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Attendance %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.attendanceRange?.max || 100}
                    onChange={(e) => handleFilterChange('attendanceRange', {
                      ...filters.attendanceRange,
                      max: parseInt(e.target.value) || 100
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange?.start || ''}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      start: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateRange?.end || ''}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      end: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Attendance</p>
                <p className="text-2xl font-bold">
                  {students.length > 0 
                    ? Math.round(students.reduce((sum, s) => sum + s.attendancePercentage, 0) / students.length)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Performers</p>
                <p className="text-2xl font-bold">
                  {students.filter(s => s.attendancePercentage >= 80).length}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">At Risk</p>
                <p className="text-2xl font-bold">
                  {students.filter(s => s.attendancePercentage < 60).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Records ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Student</th>
                  <th className="text-left py-3 px-4 font-semibold">Year/Sem</th>
                  <th className="text-left py-3 px-4 font-semibold">Sessions</th>
                  <th className="text-left py-3 px-4 font-semibold">Attendance</th>
                  <th className="text-left py-3 px-4 font-semibold">Last Attended</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-semibold">{student.name}</div>
                        <div className="text-sm text-gray-600">{student.reg_no}</div>
                        <div className="text-xs text-gray-500">{student.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Year {student.year} Sem {student.semester}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div>{student.attendedSessions} / {student.totalSessions}</div>
                        <div className="text-gray-500">attended</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAttendanceColor(student.attendancePercentage)}`}>
                        {student.attendancePercentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">
                        {student.lastAttendance ? formatDate(student.lastAttendance) : 'Never'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStudent(student)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {students.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No students found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold">{selectedStudent.name}</h3>
                  <p className="text-gray-600">{selectedStudent.reg_no} • {selectedStudent.email}</p>
                  <p className="text-sm text-gray-500">Year {selectedStudent.year} Semester {selectedStudent.semester}</p>
                </div>
                <Button variant="ghost" onClick={() => setSelectedStudent(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedStudent.totalSessions}</div>
                    <div className="text-sm text-gray-600">Total Sessions</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedStudent.attendedSessions}</div>
                    <div className="text-sm text-gray-600">Attended</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className={`text-2xl font-bold ${selectedStudent.attendancePercentage >= 80 ? 'text-green-600' : selectedStudent.attendancePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {selectedStudent.attendancePercentage}%
                    </div>
                    <div className="text-sm text-gray-600">Attendance Rate</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedStudent.recentAttendance.map((record) => (
                      <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{record.session?.subject}</div>
                          <div className="text-sm text-gray-600">
                            {formatDate(record.marked_at)}
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Present
                        </span>
                      </div>
                    ))}
                    {selectedStudent.recentAttendance.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No attendance records found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
