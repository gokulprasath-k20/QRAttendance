import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
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

    if (role !== 'admin' && role !== 'staff') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'excel';
    const sessionId = url.searchParams.get('sessionId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

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
