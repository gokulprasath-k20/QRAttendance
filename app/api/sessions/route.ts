import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const { id: userId, role } = sessionData;

    if (role === 'staff') {
      // Get sessions for staff member
      const { data: sessions, error } = await supabaseAdmin
        .from('otp_sessions')
        .select(`
          *,
          staff:staff_id (
            name,
            email
          )
        `)
        .eq('staff_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
      }

      return NextResponse.json({ sessions });
    } else if (role === 'student') {
      // Get sessions for student's year and semester
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('year, semester')
        .eq('id', userId)
        .single();

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      const { data: sessions, error } = await supabaseAdmin
        .from('otp_sessions')
        .select(`
          *,
          staff:staff_id (
            name,
            email
          ),
          attendance!left (
            id,
            student_id,
            marked_at
          )
        `)
        .eq('year', student.year)
        .eq('semester', student.semester)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
      }

      return NextResponse.json({ sessions });
    } else if (role === 'admin') {
      // Get all sessions for admin
      const { data: sessions, error } = await supabaseAdmin
        .from('otp_sessions')
        .select(`
          *,
          staff:staff_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
      }

      return NextResponse.json({ sessions });
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const { id: staffId, role } = sessionData;

    if (role !== 'staff') {
      return NextResponse.json({ error: 'Only staff can create sessions' }, { status: 403 });
    }

    const { subject, year, semester } = await request.json();

    if (!subject || !year || !semester) {
      return NextResponse.json({ error: 'Subject, year, and semester are required' }, { status: 400 });
    }

    // Validate year and semester
    if (year < 1 || year > 4 || semester < 1 || semester > 8) {
      return NextResponse.json({ error: 'Invalid year or semester' }, { status: 400 });
    }

    // Check if staff teaches this subject
    const { data: staff } = await supabaseAdmin
      .from('staff')
      .select('subjects')
      .eq('id', staffId)
      .single();

    if (!staff || !staff.subjects.includes(subject)) {
      return NextResponse.json({ error: 'You are not authorized to teach this subject' }, { status: 403 });
    }

    // Check if there's already an active session for this staff member
    const { data: activeSession } = await supabaseAdmin
      .from('otp_sessions')
      .select('id')
      .eq('staff_id', staffId)
      .eq('is_active', true)
      .single();

    if (activeSession) {
      return NextResponse.json({ error: 'You already have an active session. Please end it first.' }, { status: 409 });
    }

    // Count total students for this year/semester
    const { count: totalStudents } = await supabaseAdmin
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('year', year)
      .eq('semester', semester);

    // Create new session
    const { data: newSession, error } = await supabaseAdmin
      .from('otp_sessions')
      .insert({
        staff_id: staffId,
        subject,
        year,
        semester,
        total_students: totalStudents || 0
      })
      .select(`
        *,
        staff:staff_id (
          name,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ session: newSession });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
