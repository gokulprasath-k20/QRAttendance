import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';
import { decryptOTPToken, isOTPTokenValid } from '../../../lib/crypto';

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

    const { otpCode } = await request.json();

    if (!otpCode) {
      return NextResponse.json({ error: 'OTP code is required' }, { status: 400 });
    }

    // Find active session with matching OTP
    const { data: sessions, error: sessionError } = await supabaseAdmin
      .from('otp_sessions')
      .select('*, current_otp_token')
      .eq('is_active', true);

    if (sessionError || !sessions || sessions.length === 0) {
      return NextResponse.json({ error: 'No active sessions found' }, { status: 404 });
    }

    let matchingSession = null;
    let validToken = null;

    // Check each active session for matching OTP
    for (const session of sessions) {
      if (session.current_otp_token) {
        try {
          const token = decryptOTPToken(session.current_otp_token);
          if (token.otp === otpCode && isOTPTokenValid(token)) {
            matchingSession = session;
            validToken = token;
            break;
          }
        } catch (error) {
          // Continue to next session if decryption fails
          continue;
        }
      }
    }

    if (!matchingSession || !validToken) {
      return NextResponse.json({ error: 'Invalid or expired OTP code' }, { status: 400 });
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

    const session = matchingSession;
    const token = validToken;

    // Verify student belongs to the correct year/semester
    if (student.year !== session.year || student.semester !== session.semester) {
      return NextResponse.json({ 
        error: 'This session is not for your year/semester' 
      }, { status: 403 });
    }

    // Verify OTP token matches session details
    if (token.subject !== session.subject || 
        token.year !== session.year || 
        token.semester !== session.semester) {
      return NextResponse.json({ error: 'OTP code mismatch' }, { status: 400 });
    }

    // Check if attendance already marked
    const { data: existingAttendance } = await supabaseAdmin
      .from('attendance')
      .select('id')
      .eq('session_id', session.id)
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
        session_id: session.id,
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
          .from('otp_sessions')
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
          .from('otp_sessions')
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
