'use client';

// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Calendar, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
// @ts-ignore
import ExcelJS from 'exceljs';

interface AttendanceRecord {
  id: string;
  student_name: string;
  reg_no: string;
  subject: string;
  date: string;
  time: string;
  status: 'Present' | 'Absent';
  session_id: string;
  student_id?: string;
}

interface AttendanceHistoryProps {
  staffId: string;
}

export function AttendanceHistory({ staffId }: AttendanceHistoryProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    status: 'all',
    subject: 'all'
  });

  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    fetchAttendanceHistory();
  }, [staffId]);

  useEffect(() => {
    applyFilters();
  }, [records, filters]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch all sessions for this staff member
      const sessionsResponse = await fetch('/api/sessions');
      if (!sessionsResponse.ok) throw new Error('Failed to fetch sessions');
      const sessionsData = await sessionsResponse.json();
      const staffSessions = sessionsData.sessions.filter((s: any) => s.staff_id === staffId);

      // Get unique subjects
      const subjectSet = new Set();
      staffSessions.forEach((s: any) => subjectSet.add(s.subject));
      const uniqueSubjects = Array.from(subjectSet);
      setSubjects(uniqueSubjects);

      // Fetch attendance for each session
      const allRecords: AttendanceRecord[] = [];
      
      for (const session of staffSessions) {
        const attendanceResponse = await fetch(`/api/attendance?sessionId=${session.id}`);
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          
          // Add present students
          attendanceData.attendance.forEach((att: any) => {
            allRecords.push({
              id: att.id,
              student_name: att.student?.name || 'Unknown',
              reg_no: att.student?.reg_no || 'N/A',
              subject: session.subject,
              date: session.date,
              time: formatDate(att.marked_at),
              status: 'Present',
              session_id: session.id
            });
          });
        }

        // Get all students for this year/semester to find absent ones
        if (!session.is_active) {
          try {
            const studentsResponse = await fetch(`/api/students?year=${session.year}&semester=${session.semester}`);
            if (studentsResponse.ok) {
              const studentsData = await studentsResponse.json();
              const presentStudentIds = new Set(
                allRecords
                  .filter(r => r.session_id === session.id)
                  .map(r => r.student_id)
              );

              // Add absent students
              studentsData.students?.forEach((student: any) => {
                if (!presentStudentIds.has(student.id)) {
                  allRecords.push({
                    id: `absent-${session.id}-${student.id}`,
                    student_name: student.name,
                    reg_no: student.reg_no,
                    subject: session.subject,
                    date: session.date,
                    time: formatDate(session.start_time),
                    status: 'Absent',
                    session_id: session.id
                  });
                }
              });
            }
          } catch (error) {
            console.error('Error fetching students:', error);
          }
        }
      }

      setRecords(allRecords);
    } catch (error) {
      console.error('Failed to fetch attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];

    // Search filter (name or reg_no)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(record => 
        record.student_name.toLowerCase().includes(searchTerm) ||
        record.reg_no.toLowerCase().includes(searchTerm)
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(record => 
        new Date(record.date) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(record => 
        new Date(record.date) <= new Date(filters.dateTo)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(record => 
        record.status.toLowerCase() === filters.status
      );
    }

    // Subject filter
    if (filters.subject !== 'all') {
      filtered = filtered.filter(record => 
        record.subject === filters.subject
      );
    }

    // Sort by date and time (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredRecords(filtered);
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance History');

    // Add headers
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Reg. No', key: 'regNo', width: 15 },
      { header: 'Subject', key: 'subject', width: 30 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Time', key: 'time', width: 20 },
      { header: 'Status', key: 'status', width: 12 }
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '8B5CF6' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data
    filteredRecords.forEach((record, index) => {
      const row = worksheet.addRow({
        name: record.student_name,
        regNo: record.reg_no,
        subject: record.subject,
        date: record.date,
        time: record.time,
        status: record.status
      });

      // Style status column
      const statusCell = row.getCell('status');
      if (record.status === 'Present') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'D1FAE5' }
        };
        statusCell.font = { color: { argb: '065F46' } };
      } else {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FEE2E2' }
        };
        statusCell.font = { color: { argb: '991B1B' } };
      }

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F9FAFB' }
        };
      }
    });

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_history_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2">Loading attendance history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Student Attendance History
          </span>
          <Button
            onClick={exportToExcel}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name or reg. no"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          
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
          
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'present', label: 'Present Only' },
              { value: 'absent', label: 'Absent Only' }
            ]}
          />
          
          <Select
            value={filters.subject}
            onChange={(e) => handleFilterChange('subject', e.target.value)}
            options={[
              { value: 'all', label: 'All Subjects' },
              ...subjects.map(subject => ({ value: subject, label: subject }))
            ]}
          />
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            Showing {filteredRecords.length} of {records.length} records
          </p>
          <div className="flex gap-4 text-sm">
            <span className="text-success-600">
              Present: {filteredRecords.filter(r => r.status === 'Present').length}
            </span>
            <span className="text-error-600">
              Absent: {filteredRecords.filter(r => r.status === 'Absent').length}
            </span>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto">
          <table className="attendance-table w-full">
            <thead>
              <tr>
                <th className="text-left p-3 bg-primary-50 font-semibold">Name</th>
                <th className="text-left p-3 bg-primary-50 font-semibold">Reg. No</th>
                <th className="text-left p-3 bg-primary-50 font-semibold">Subject</th>
                <th className="text-left p-3 bg-primary-50 font-semibold">Date</th>
                <th className="text-left p-3 bg-primary-50 font-semibold">Time</th>
                <th className="text-left p-3 bg-primary-50 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record, index) => (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 border-b"
                >
                  <td className="p-3 font-medium">{record.student_name}</td>
                  <td className="p-3 text-gray-600">{record.reg_no}</td>
                  <td className="p-3">{record.subject}</td>
                  <td className="p-3 text-gray-600">{record.date}</td>
                  <td className="p-3 text-gray-600">{record.time}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      record.status === 'Present' 
                        ? 'bg-success-100 text-success-800'
                        : 'bg-error-100 text-error-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No attendance records found matching your filters.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
