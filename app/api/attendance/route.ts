import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';
import { decryptQRToken, isQRTokenValid } from '../../../lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const { id: studentId, role } = sessionData;

    if (role !== 'student') {
      return NextResponse.json({ error: 'Only students can mark attendance' }, { status: 403 });
    }

    const { qrToken } = await request.json();

    if (!qrToken) {
      return NextResponse.json({ error: 'QR token is required' }, { status: 400 });
    }

    // Decrypt and validate QR token
    let token;
    try {
      token = decryptQRToken(qrToken);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 });
    }

    if (!isQRTokenValid(token)) {
      return NextResponse.json({ error: 'QR code has expired. Please scan a fresh code.' }, { status: 400 });
    }

    // Get student details
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('year, semester, name, reg_no')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Verify session exists and is active
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('qr_sessions')
      .select('*')
      .eq('id', token.sessionId)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found or inactive' }, { status: 404 });
    }

    // Verify student belongs to the correct year/semester
    if (student.year !== session.year || student.semester !== session.semester) {
      return NextResponse.json({ 
        error: 'This session is not for your year/semester' 
      }, { status: 403 });
    }

    // Verify QR token matches session details
    if (token.subject !== session.subject || 
        token.year !== session.year || 
        token.semester !== session.semester) {
      return NextResponse.json({ error: 'QR code mismatch' }, { status: 400 });
    }

    // Check if attendance already marked
    const { data: existingAttendance } = await supabaseAdmin
      .from('attendance')
      .select('id')
      .eq('session_id', token.sessionId)
      .eq('student_id', studentId)
      .single();

    if (existingAttendance) {
      return NextResponse.json({ 
        error: 'Attendance already marked for this session' 
      }, { status: 409 });
    }

    // Mark attendance
    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .insert({
        session_id: token.sessionId,
        student_id: studentId
      })
      .select(`
        *,
        session:session_id (
          subject,
          date,
          start_time
        )
      `)
      .single();

    if (attendanceError) {
      console.error('Attendance marking error:', attendanceError);
      return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Attendance marked successfully',
      attendance,
      student: {
        name: student.name,
        reg_no: student.reg_no
      }
    });
  } catch (error) {
    console.error('Attendance marking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const { id: userId, role } = sessionData;

    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const studentId = url.searchParams.get('studentId');

    if (role === 'student') {
      // Get attendance for the student
      let query = supabaseAdmin
        .from('attendance')
        .select(`
          *,
          session:session_id (
            subject,
            date,
            start_time,
            staff:staff_id (
              name
            )
          )
        `)
        .eq('student_id', userId)
        .order('marked_at', { ascending: false });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data: attendance, error } = await query;

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
      }

      return NextResponse.json({ attendance });
    } else if (role === 'staff') {
      // Get attendance for staff's sessions
      let query = supabaseAdmin
        .from('attendance')
        .select(`
          *,
          student:student_id (
            name,
            reg_no,
            email
          ),
          session:session_id (
            subject,
            date,
            start_time,
            staff_id
          )
        `)
        .order('marked_at', { ascending: false });

      if (sessionId) {
        // Verify session belongs to staff
        const { data: session } = await supabaseAdmin
          .from('qr_sessions')
          .select('staff_id')
          .eq('id', sessionId)
          .single();

        if (!session || session.staff_id !== userId) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        query = query.eq('session_id', sessionId);
      } else {
        // Filter by staff's sessions
        const { data: staffSessions } = await supabaseAdmin
          .from('qr_sessions')
          .select('id')
          .eq('staff_id', userId);

        if (staffSessions) {
          const sessionIds = staffSessions.map(s => s.id);
          query = query.in('session_id', sessionIds);
        }
      }

      const { data: attendance, error } = await query;

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
      }

      return NextResponse.json({ attendance });
    } else if (role === 'admin') {
      // Get all attendance for admin
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
        .order('marked_at', { ascending: false })
        .limit(1000);

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data: attendance, error } = await query;

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
      }

      return NextResponse.json({ attendance });
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
  } catch (error) {
    console.error('Attendance fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
