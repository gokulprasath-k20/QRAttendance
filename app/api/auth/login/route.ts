import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { verifyPassword } from '../../../../lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'staff', 'student'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    let user = null;
    let tableName = '';

    // Check user in appropriate table based on role
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
    }

    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = verifyPassword(password, data.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = data;

    // Create session token (simplified for demo - use proper JWT in production)
    const sessionToken = Buffer.from(JSON.stringify({
      id: data.id,
      email: data.email,
      role,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    })).toString('base64');

    const response = NextResponse.json({
      user: { ...userWithoutPassword, role },
      token: sessionToken
    });

    // Set HTTP-only cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
