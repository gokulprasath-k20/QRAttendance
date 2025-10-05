import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const { id: userId, role } = sessionData;

    // Get session with attendance data
    const { data: session, error } = await supabaseAdmin
      .from('qr_sessions')
      .select(`
        *,
        staff:staff_id (
          name,
          email
        ),
        attendance (
          id,
          student_id,
          marked_at,
          student:student_id (
            name,
            reg_no,
            email
          )
        )
      `)
      .eq('id', params.id)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check permissions
    if (role === 'staff' && session.staff_id !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (role === 'student') {
      // Check if student belongs to this year/semester
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('year, semester')
        .eq('id', userId)
        .single();

      if (!student || student.year !== session.year || student.semester !== session.semester) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const { id: staffId, role } = sessionData;

    if (role !== 'staff') {
      return NextResponse.json({ error: 'Only staff can update sessions' }, { status: 403 });
    }

    const { is_active } = await request.json();

    // Verify session belongs to staff member
    const { data: session } = await supabaseAdmin
      .from('qr_sessions')
      .select('staff_id, is_active')
      .eq('id', params.id)
      .single();

    if (!session || session.staff_id !== staffId) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // Update session
    const updateData: any = {};
    
    if (typeof is_active === 'boolean') {
      updateData.is_active = is_active;
      if (!is_active) {
        updateData.end_time = new Date().toISOString();
      }
    }

    const { data: updatedSession, error } = await supabaseAdmin
      .from('qr_sessions')
      .update(updateData)
      .eq('id', params.id)
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
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const { id: userId, role } = sessionData;

    if (role !== 'staff' && role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify session exists and check permissions
    const { data: session } = await supabaseAdmin
      .from('qr_sessions')
      .select('staff_id')
      .eq('id', params.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (role === 'staff' && session.staff_id !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete session (attendance records will be deleted due to CASCADE)
    const { error } = await supabaseAdmin
      .from('qr_sessions')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
