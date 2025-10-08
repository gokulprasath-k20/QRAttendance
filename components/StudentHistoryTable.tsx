'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronDown,
  X,
  Users,
  TrendingUp,
  BarChart3,
  Calendar,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { StudentHistoryRecord, StudentHistoryFilters, SUBJECTS_BY_YEAR_SEM } from '../types';

interface StudentHistoryTableProps {
  className?: string;
}

type SortField = 'name' | 'reg_no' | 'year' | 'semester' | 'attendancePercentage' | 'totalSessions' | 'attendedSessions';
type SortDirection = 'asc' | 'desc';

export default function StudentHistoryTable({ className }: StudentHistoryTableProps) {
  const [students, setStudents] = useState<StudentHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('reg_no');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<StudentHistoryFilters>({
    attendanceRange: { min: 0, max: 100 }
  });
  const [appliedFilters, setAppliedFilters] = useState<StudentHistoryFilters>({
    attendanceRange: { min: 0, max: 100 }
  });

  useEffect(() => {
    fetchStudentHistory();
  }, [appliedFilters]);

  const fetchStudentHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (appliedFilters.year) params.append('year', appliedFilters.year.toString());
      if (appliedFilters.semester) params.append('semester', appliedFilters.semester.toString());
      if (appliedFilters.subject) params.append('subject', appliedFilters.subject);
      if (appliedFilters.search) params.append('search', appliedFilters.search);
      if (appliedFilters.attendanceRange?.min !== undefined) params.append('minAttendance', appliedFilters.attendanceRange.min.toString());
      if (appliedFilters.attendanceRange?.max !== undefined) params.append('maxAttendance', appliedFilters.attendanceRange.max.toString());
      if (appliedFilters.dateRange?.start) params.append('startDate', appliedFilters.dateRange.start);
      if (appliedFilters.dateRange?.end) params.append('endDate', appliedFilters.dateRange.end);

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

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const clearFilters = () => {
    const defaultFilters = { attendanceRange: { min: 0, max: 100 } };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedStudents = [...students].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const exportData = async (format: 'excel' | 'pdf') => {
    try {
      const params = new URLSearchParams();
      params.append('type', format);
      params.append('data', 'student-history');
      
      Object.entries(appliedFilters).forEach(([key, value]) => {
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
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
          <h2 className="text-xl font-bold text-gray-900">Student History & Analytics</h2>
          <p className="text-gray-600">Comprehensive attendance records with filtering</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportData('excel')}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportData('pdf')}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Students</p>
                <p className="text-lg font-bold">{students.length}</p>
              </div>
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Avg Attendance</p>
                <p className="text-lg font-bold">
                  {students.length > 0 
                    ? Math.round(students.reduce((sum, s) => sum + s.attendancePercentage, 0) / students.length)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">High Performers</p>
                <p className="text-lg font-bold">
                  {students.filter(s => s.attendancePercentage >= 80).length}
                </p>
              </div>
              <BarChart3 className="w-6 h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">At Risk</p>
                <p className="text-lg font-bold">
                  {students.filter(s => s.attendancePercentage < 60).length}
                </p>
              </div>
              <Calendar className="w-6 h-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
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
                <CardTitle className="text-base">Filters</CardTitle>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Name, Reg No..."
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
              </div>
              
              {/* Apply Filters Button */}
              <div className="flex justify-center pt-4 border-t">
                <Button
                  onClick={applyFilters}
                  className="flex items-center gap-2 px-6"
                >
                  <Filter className="w-4 h-4" />
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Excel-like Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student Records ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('reg_no')}
                  >
                    <div className="flex items-center justify-between">
                      Reg No
                      <SortIcon field="reg_no" />
                    </div>
                  </th>
                  <th 
                    className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center justify-between">
                      Name
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                    Email
                  </th>
                  <th 
                    className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('year')}
                  >
                    <div className="flex items-center justify-between">
                      Year
                      <SortIcon field="year" />
                    </div>
                  </th>
                  <th 
                    className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('semester')}
                  >
                    <div className="flex items-center justify-between">
                      Sem
                      <SortIcon field="semester" />
                    </div>
                  </th>
                  <th 
                    className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalSessions')}
                  >
                    <div className="flex items-center justify-between">
                      Total Sessions
                      <SortIcon field="totalSessions" />
                    </div>
                  </th>
                  <th 
                    className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('attendedSessions')}
                  >
                    <div className="flex items-center justify-between">
                      Attended
                      <SortIcon field="attendedSessions" />
                    </div>
                  </th>
                  <th 
                    className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('attendancePercentage')}
                  >
                    <div className="flex items-center justify-between">
                      Attendance %
                      <SortIcon field="attendancePercentage" />
                    </div>
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">
                    Last Attended
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium">
                      {student.reg_no}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">
                      {student.name}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-gray-600">
                      {student.email}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                      {student.year}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                      {student.semester}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                      {student.totalSessions}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                      {student.attendedSessions}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getAttendanceColor(student.attendancePercentage)}`}>
                        {student.attendancePercentage}%
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-600">
                      {student.lastAttendance 
                        ? new Date(student.lastAttendance).toLocaleDateString()
                        : 'Never'
                      }
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
    </div>
  );
}
