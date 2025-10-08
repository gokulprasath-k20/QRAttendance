import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const { role } = sessionData;

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'excel';
    const dataType = url.searchParams.get('data') || 'attendance';

    if (role !== 'admin' && role !== 'staff' && role !== 'student') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Students can only export their own attendance data
    if (role === 'student' && dataType !== 'student-attendance') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    const sessionId = url.searchParams.get('sessionId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (dataType === 'student-history') {
      return await handleStudentHistoryExport(url, type);
    }

    if (dataType === 'student-attendance') {
      return await handleStudentAttendanceExport(url, type, sessionData);
    }

    // Fetch attendance data with filters
    let query = supabaseAdmin
      .from('attendance')
      .select(`
        *,
        student:student_id (
          name,
          reg_no,
          email,
          year,
          semester
        ),
        session:session_id (
          subject,
          date,
          start_time,
          year,
          semester,
          staff:staff_id (
            name,
            email
          )
        )
      `)
      .order('marked_at', { ascending: false });

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    if (startDate) {
      query = query.gte('marked_at', startDate);
    }

    if (endDate) {
      query = query.lte('marked_at', endDate);
    }

    const { data: attendance, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    if (type === 'excel') {
      return await generateExcelReport(attendance);
    } else if (type === 'pdf') {
      return await generatePDFReport(attendance);
    } else {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateExcelReport(attendance: any[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Report');

  // Add headers
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Time', key: 'time', width: 10 },
    { header: 'Student Name', key: 'studentName', width: 20 },
    { header: 'Registration No', key: 'regNo', width: 15 },
    { header: 'Year', key: 'year', width: 8 },
    { header: 'Semester', key: 'semester', width: 10 },
    { header: 'Subject', key: 'subject', width: 20 },
    { header: 'Staff', key: 'staff', width: 20 },
    { header: 'Session Date', key: 'sessionDate', width: 12 },
  ];

  // Style headers
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF8B5CF6' }
  };

  // Add data
  attendance.forEach((record) => {
    const markedAt = new Date(record.marked_at);
    worksheet.addRow({
      date: markedAt.toLocaleDateString(),
      time: markedAt.toLocaleTimeString(),
      studentName: record.student?.name || 'N/A',
      regNo: record.student?.reg_no || 'N/A',
      year: record.student?.year || 'N/A',
      semester: record.student?.semester || 'N/A',
      subject: record.session?.subject || 'N/A',
      staff: record.session?.staff?.name || 'N/A',
      sessionDate: record.session?.date || 'N/A',
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="attendance-report.xlsx"',
    },
  });
}

async function handleStudentHistoryExport(url: URL, type: string) {
  // Extract filters from URL parameters
  const filters = {
    year: url.searchParams.get('year') ? parseInt(url.searchParams.get('year')!) : undefined,
    semester: url.searchParams.get('semester') ? parseInt(url.searchParams.get('semester')!) : undefined,
    subject: url.searchParams.get('subject') || undefined,
    search: url.searchParams.get('search') || undefined,
    minAttendance: url.searchParams.get('attendanceRange.min') ? parseInt(url.searchParams.get('attendanceRange.min')!) : 0,
    maxAttendance: url.searchParams.get('attendanceRange.max') ? parseInt(url.searchParams.get('attendanceRange.max')!) : 100,
    startDate: url.searchParams.get('dateRange.start') || '',
    endDate: url.searchParams.get('dateRange.end') || '',
  };

  // Fetch student history data (similar to the API endpoint)
  let studentsQuery = supabaseAdmin
    .from('students')
    .select('id, reg_no, name, email, year, semester, created_at')
    .order('reg_no', { ascending: true });

  if (filters.year) studentsQuery = studentsQuery.eq('year', filters.year);
  if (filters.semester) studentsQuery = studentsQuery.eq('semester', filters.semester);
  if (filters.search) {
    studentsQuery = studentsQuery.or(`name.ilike.%${filters.search}%,reg_no.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  const { data: students } = await studentsQuery;
  if (!students) return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });

  // Calculate attendance data for each student
  const studentHistory = await Promise.all(
    students.map(async (student) => {
      // Get sessions for this student
      let sessionsQuery = supabaseAdmin
        .from('sessions')
        .select('id, subject, date')
        .eq('year', student.year)
        .eq('semester', student.semester);

      if (filters.subject) sessionsQuery = sessionsQuery.eq('subject', filters.subject);
      if (filters.startDate) sessionsQuery = sessionsQuery.gte('date', filters.startDate);
      if (filters.endDate) sessionsQuery = sessionsQuery.lte('date', filters.endDate);

      const { data: sessions } = await sessionsQuery;
      const totalSessions = sessions?.length || 0;

      // Get attendance for this student
      let attendanceQuery = supabaseAdmin
        .from('attendance')
        .select('id, marked_at, session:session_id(subject)')
        .eq('student_id', student.id);

      if (filters.startDate) attendanceQuery = attendanceQuery.gte('marked_at', filters.startDate);
      if (filters.endDate) attendanceQuery = attendanceQuery.lte('marked_at', filters.endDate);

      const { data: attendanceRecords } = await attendanceQuery;
      let filteredAttendance = attendanceRecords || [];
      
      if (filters.subject) {
        filteredAttendance = filteredAttendance.filter((record: any) => record.session?.subject === filters.subject);
      }

      const attendedSessions = filteredAttendance.length;
      const attendancePercentage = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

      return {
        ...student,
        totalSessions,
        attendedSessions,
        attendancePercentage,
        lastAttendance: filteredAttendance.length > 0 
          ? filteredAttendance.sort((a: any, b: any) => new Date(b.marked_at).getTime() - new Date(a.marked_at).getTime())[0].marked_at
          : null
      };
    })
  );

  // Filter by attendance percentage
  const filteredHistory = studentHistory.filter(
    (record) => record.attendancePercentage >= filters.minAttendance && record.attendancePercentage <= filters.maxAttendance
  );

  if (type === 'excel') {
    return await generateStudentHistoryExcel(filteredHistory);
  } else {
    return await generateStudentHistoryPDF(filteredHistory);
  }
}

async function generateStudentHistoryExcel(students: any[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Student History');

  worksheet.columns = [
    { header: 'Registration No', key: 'regNo', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Year', key: 'year', width: 8 },
    { header: 'Semester', key: 'semester', width: 10 },
    { header: 'Total Sessions', key: 'totalSessions', width: 15 },
    { header: 'Attended Sessions', key: 'attendedSessions', width: 18 },
    { header: 'Attendance %', key: 'attendancePercentage', width: 15 },
    { header: 'Last Attendance', key: 'lastAttendance', width: 18 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF8B5CF6' }
  };

  students.forEach((student) => {
    worksheet.addRow({
      regNo: student.reg_no,
      name: student.name,
      email: student.email,
      year: student.year,
      semester: student.semester,
      totalSessions: student.totalSessions,
      attendedSessions: student.attendedSessions,
      attendancePercentage: `${student.attendancePercentage}%`,
      lastAttendance: student.lastAttendance ? new Date(student.lastAttendance).toLocaleDateString() : 'Never',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="student-history.xlsx"',
    },
  });
}

async function generateStudentHistoryPDF(students: any[]) {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Student History Report', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
  doc.text(`Total Students: ${students.length}`, 20, 45);
  
  let yPosition = 60;
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFontSize(10);
  doc.text('Reg No', 20, yPosition);
  doc.text('Name', 50, yPosition);
  doc.text('Year/Sem', 100, yPosition);
  doc.text('Sessions', 130, yPosition);
  doc.text('Attended', 155, yPosition);
  doc.text('Percentage', 180, yPosition);
  
  yPosition += 10;
  
  students.forEach((student) => {
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(student.reg_no, 20, yPosition);
    doc.text(student.name.substring(0, 15), 50, yPosition);
    doc.text(`${student.year}/${student.semester}`, 100, yPosition);
    doc.text(student.totalSessions.toString(), 130, yPosition);
    doc.text(student.attendedSessions.toString(), 155, yPosition);
    doc.text(`${student.attendancePercentage}%`, 180, yPosition);
    
    yPosition += 8;
  });
  
  const pdfBuffer = doc.output('arraybuffer');
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="student-history.pdf"',
    },
  });
}

async function generatePDFReport(attendance: any[]) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Attendance Report', 20, 20);
  
  // Add generation date
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
  
  // Add summary
  doc.text(`Total Records: ${attendance.length}`, 20, 45);
  
  let yPosition = 60;
  const pageHeight = doc.internal.pageSize.height;
  
  // Add table headers
  doc.setFontSize(10);
  doc.text('Date', 20, yPosition);
  doc.text('Student', 50, yPosition);
  doc.text('Reg No', 100, yPosition);
  doc.text('Subject', 130, yPosition);
  doc.text('Staff', 170, yPosition);
  
  yPosition += 10;
  
  // Add data rows
  attendance.forEach((record) => {
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
    
    const markedAt = new Date(record.marked_at);
    doc.text(markedAt.toLocaleDateString(), 20, yPosition);
    doc.text(record.student?.name?.substring(0, 15) || 'N/A', 50, yPosition);
    doc.text(record.student?.reg_no || 'N/A', 100, yPosition);
    doc.text(record.session?.subject?.substring(0, 12) || 'N/A', 130, yPosition);
    doc.text(record.session?.staff?.name?.substring(0, 12) || 'N/A', 170, yPosition);
    
    yPosition += 8;
  });
  
  const pdfBuffer = doc.output('arraybuffer');
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="attendance-report.pdf"',
    },
  });
}

async function handleStudentAttendanceExport(url: URL, type: string, sessionData: any) {
  const { id: studentId } = sessionData;
  
  // Extract filters from URL parameters
  const filters = {
    subject: url.searchParams.get('subject') || '',
    dateFrom: url.searchParams.get('dateFrom') || '',
    dateTo: url.searchParams.get('dateTo') || '',
    status: url.searchParams.get('status') || '',
    search: url.searchParams.get('search') || ''
  };

  // Get all sessions for the student
  const { data: studentData } = await supabaseAdmin
    .from('students')
    .select('year, semester')
    .eq('id', studentId)
    .single();

  if (!studentData) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  // Get all sessions for this student's year and semester
  let sessionsQuery = supabaseAdmin
    .from('sessions')
    .select(`
      id, 
      subject, 
      date, 
      start_time, 
      end_time,
      is_active,
      staff:staff_id(name)
    `)
    .eq('year', studentData.year)
    .eq('semester', studentData.semester)
    .eq('is_active', false); // Only completed sessions

  if (filters.subject) {
    sessionsQuery = sessionsQuery.ilike('subject', `%${filters.subject}%`);
  }

  if (filters.dateFrom) {
    sessionsQuery = sessionsQuery.gte('date', filters.dateFrom);
  }

  if (filters.dateTo) {
    sessionsQuery = sessionsQuery.lte('date', filters.dateTo);
  }

  const { data: allSessions } = await sessionsQuery;

  // Get attendance records for this student
  let attendanceQuery = supabaseAdmin
    .from('attendance')
    .select('session_id, marked_at')
    .eq('student_id', studentId);

  if (filters.dateFrom) {
    attendanceQuery = attendanceQuery.gte('marked_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    attendanceQuery = attendanceQuery.lte('marked_at', filters.dateTo);
  }

  const { data: attendanceRecords } = await attendanceQuery;

  // Create attendance map
  const attendanceMap = new Map();
  attendanceRecords?.forEach(record => {
    attendanceMap.set(record.session_id, record.marked_at);
  });

  // Combine sessions with attendance status
  let combinedData = allSessions?.map(session => ({
    ...session,
    status: attendanceMap.has(session.id) ? 'present' : 'absent',
    marked_at: attendanceMap.get(session.id) || null
  })) || [];

  // Apply additional filters
  if (filters.status) {
    combinedData = combinedData.filter(item => item.status === filters.status);
  }

  if (filters.search) {
    combinedData = combinedData.filter(item =>
      item.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
      (item.staff && Array.isArray(item.staff) && item.staff[0]?.name?.toLowerCase().includes(filters.search.toLowerCase()))
    );
  }

  // Sort by date (newest first)
  combinedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (type === 'excel') {
    return await generateStudentAttendanceExcel(combinedData);
  } else {
    return NextResponse.json({ error: 'PDF export not supported for student attendance' }, { status: 400 });
  }
}

async function generateStudentAttendanceExcel(attendanceData: any[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('My Attendance History');

  worksheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Subject', key: 'subject', width: 25 },
    { header: 'Staff', key: 'staff', width: 20 },
    { header: 'Start Time', key: 'startTime', width: 12 },
    { header: 'End Time', key: 'endTime', width: 12 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Marked At', key: 'markedAt', width: 18 },
  ];

  // Style headers
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF8B5CF6' }
  };

  // Add data
  attendanceData.forEach((record) => {
    worksheet.addRow({
      date: new Date(record.date).toLocaleDateString(),
      subject: record.subject,
      staff: (record.staff && Array.isArray(record.staff) && record.staff[0]?.name) || 'N/A',
      startTime: record.start_time,
      endTime: record.end_time,
      status: record.status === 'present' ? 'Present' : 'Absent',
      markedAt: record.marked_at ? new Date(record.marked_at).toLocaleString() : 'N/A',
    });
  });

  // Add conditional formatting for status
  const statusColumn = worksheet.getColumn('status');
  statusColumn.eachCell((cell, rowNumber) => {
    if (rowNumber > 1) { // Skip header
      if (cell.value === 'Present') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD4F6D4' }
        };
        cell.font = { color: { argb: 'FF0F5132' } };
      } else if (cell.value === 'Absent') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFECACA' }
        };
        cell.font = { color: { argb: 'FF991B1B' } };
      }
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="my-attendance-history.xlsx"',
    },
  });
}
