import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const { role } = sessionData;

    if (role !== 'staff' && role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const semester = url.searchParams.get('semester');

    let query = supabaseAdmin
      .from('students')
      .select('id, reg_no, name, email, year, semester, created_at')
      .order('reg_no', { ascending: true });

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    if (semester) {
      query = query.eq('semester', parseInt(semester));
    }

    const { data: students, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Students fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
