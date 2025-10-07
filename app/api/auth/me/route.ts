import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // Decode session token
    let sessionData;
    try {
      sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Check if session is expired
    if (Date.now() > sessionData.exp) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    const { id, role } = sessionData;

    // Get user data from appropriate table
    let tableName = '';
    switch (role) {
      case 'admin':
        tableName = 'admin';
        break;
      case 'staff':
        tableName = 'staff';
        break;
      case 'student':
        tableName = 'students';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 401 }
        );
    }

    const { data: user, error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: { ...userWithoutPassword, role }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
