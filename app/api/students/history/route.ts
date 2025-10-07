import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { StudentHistoryRecord, StudentHistoryFilters } from '../../../../types';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const { role } = sessionData;

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const url = new URL(request.url);
    const filters: StudentHistoryFilters = {
      year: url.searchParams.get('year') ? parseInt(url.searchParams.get('year')!) : undefined,
      semester: url.searchParams.get('semester') ? parseInt(url.searchParams.get('semester')!) : undefined,
      subject: url.searchParams.get('subject') || undefined,
      search: url.searchParams.get('search') || undefined,
      attendanceRange: {
        min: url.searchParams.get('minAttendance') ? parseInt(url.searchParams.get('minAttendance')!) : 0,
        max: url.searchParams.get('maxAttendance') ? parseInt(url.searchParams.get('maxAttendance')!) : 100,
      },
      dateRange: {
        start: url.searchParams.get('startDate') || '',
        end: url.searchParams.get('endDate') || '',
      }
    };

    // Get all students with basic info
    let studentsQuery = supabaseAdmin
      .from('students')
      .select('id, reg_no, name, email, year, semester, created_at')
      .order('reg_no', { ascending: true });

    if (filters.year) {
      studentsQuery = studentsQuery.eq('year', filters.year);
    }

    if (filters.semester) {
      studentsQuery = studentsQuery.eq('semester', filters.semester);
    }

    if (filters.search) {
      studentsQuery = studentsQuery.or(`name.ilike.%${filters.search}%,reg_no.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data: students, error: studentsError } = await studentsQuery;

    if (studentsError) {
      console.error('Students fetch error:', studentsError);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // Get attendance data for each student
    const studentHistory: StudentHistoryRecord[] = await Promise.all(
      students.map(async (student) => {
        // Get all sessions for this student's year and semester
        let sessionsQuery = supabaseAdmin
          .from('sessions')
          .select('id, subject, date, start_time, staff:staff_id(name)')
          .eq('year', student.year)
          .eq('semester', student.semester);

        if (filters.subject) {
          sessionsQuery = sessionsQuery.eq('subject', filters.subject);
        }

        if (filters.dateRange?.start) {
          sessionsQuery = sessionsQuery.gte('date', filters.dateRange.start);
        }

        if (filters.dateRange?.end) {
          sessionsQuery = sessionsQuery.lte('date', filters.dateRange.end);
        }

        const { data: sessions } = await sessionsQuery;
        const totalSessions = sessions?.length || 0;

        // Get attendance records for this student
        let attendanceQuery = supabaseAdmin
          .from('attendance')
          .select(`
            id, 
            marked_at, 
            session:session_id(
              id, 
              subject, 
              date, 
              start_time,
              staff:staff_id(name)
            )
          `)
          .eq('student_id', student.id);

        if (filters.dateRange?.start) {
          attendanceQuery = attendanceQuery.gte('marked_at', filters.dateRange.start);
        }

        if (filters.dateRange?.end) {
          attendanceQuery = attendanceQuery.lte('marked_at', filters.dateRange.end);
        }

        const { data: attendanceRecords } = await attendanceQuery;
        
        // Filter attendance by subject if specified
        let filteredAttendance = attendanceRecords || [];
        if (filters.subject) {
          filteredAttendance = filteredAttendance.filter(
            (record: any) => record.session?.subject === filters.subject
          );
        }

        const attendedSessions = filteredAttendance.length;
        const attendancePercentage = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

        // Get last attendance date
        const lastAttendance = filteredAttendance.length > 0 
          ? filteredAttendance.sort((a: any, b: any) => 
              new Date(b.marked_at).getTime() - new Date(a.marked_at).getTime()
            )[0].marked_at
          : undefined;

        // Get recent attendance (last 10 records)
        const recentAttendance = filteredAttendance
          .sort((a: any, b: any) => new Date(b.marked_at).getTime() - new Date(a.marked_at).getTime())
          .slice(0, 10)
          .map((record: any) => ({
            id: record.id,
            session_id: record.session?.id,
            student_id: student.id,
            marked_at: record.marked_at,
            session: record.session
          }));

        return {
          id: student.id,
          reg_no: student.reg_no,
          name: student.name,
          email: student.email,
          year: student.year,
          semester: student.semester,
          totalSessions,
          attendedSessions,
          attendancePercentage,
          lastAttendance,
          recentAttendance,
          created_at: student.created_at,
        };
      })
    );

    // Filter by attendance percentage if specified
    let filteredHistory = studentHistory;
    if (filters.attendanceRange) {
      filteredHistory = studentHistory.filter(
        (record) => 
          record.attendancePercentage >= filters.attendanceRange!.min &&
          record.attendancePercentage <= filters.attendanceRange!.max
      );
    }

    return NextResponse.json({ 
      students: filteredHistory,
      total: filteredHistory.length,
      filters 
    });

  } catch (error) {
    console.error('Student history fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
