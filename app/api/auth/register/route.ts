import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/crypto';
import { isValidEmail, isValidRegNo } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role } = body;

    if (!role || !['staff', 'student'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Only staff and student registration allowed.' },
        { status: 400 }
      );
    }

    if (role === 'staff') {
      return await registerStaff(body);
    } else if (role === 'student') {
      return await registerStudent(body);
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function registerStaff(data: Record<string, any>) {
  const { name, email, password, subjects } = data;

  // Validation
  if (!name || !email || !password || !subjects || !Array.isArray(subjects)) {
    return NextResponse.json(
      { error: 'Name, email, password, and subjects are required' },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: 'Invalid email format' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters long' },
      { status: 400 }
    );
  }

  if (subjects.length === 0) {
    return NextResponse.json(
      { error: 'At least one subject must be selected' },
      { status: 400 }
    );
  }

  // Check if email already exists
  const { data: existingUser } = await supabaseAdmin
    .from('staff')
    .select('email')
    .eq('email', email)
    .single();

  if (existingUser) {
    return NextResponse.json(
      { error: 'Email already registered' },
      { status: 409 }
    );
  }

  // Hash password and create user
  const passwordHash = hashPassword(password);

  const { data: newUser, error } = await supabaseAdmin
    .from('staff')
    .insert({
      name,
      email,
      password_hash: passwordHash,
      subjects
    })
    .select('id, name, email, subjects, created_at')
    .single();

  if (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Staff account created successfully',
    user: { ...newUser, role: 'staff' }
  });
}

async function registerStudent(data: Record<string, any>) {
  const { reg_no, name, email, password, year, semester } = data;

  // Validation
  if (!reg_no || !name || !email || !password || !year || !semester) {
    return NextResponse.json(
      { error: 'All fields are required' },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: 'Invalid email format' },
      { status: 400 }
    );
  }

  if (!isValidRegNo(reg_no)) {
    return NextResponse.json(
      { error: 'Invalid registration number format' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters long' },
      { status: 400 }
    );
  }

  if (year < 1 || year > 4) {
    return NextResponse.json(
      { error: 'Year must be between 1 and 4' },
      { status: 400 }
    );
  }

  if (semester < 1 || semester > 8) {
    return NextResponse.json(
      { error: 'Semester must be between 1 and 8' },
      { status: 400 }
    );
  }

  // Check if registration number or email already exists
  const { data: existingUser } = await supabaseAdmin
    .from('students')
    .select('reg_no, email')
    .or(`reg_no.eq.${reg_no},email.eq.${email}`)
    .single();

  if (existingUser) {
    if (existingUser.reg_no === reg_no) {
      return NextResponse.json(
        { error: 'Registration number already exists' },
        { status: 409 }
      );
    }
    if (existingUser.email === email) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }
  }

  // Hash password and create user
  const passwordHash = hashPassword(password);

  const { data: newUser, error } = await supabaseAdmin
    .from('students')
    .insert({
      reg_no,
      name,
      email,
      password_hash: passwordHash,
      year,
      semester
    })
    .select('id, reg_no, name, email, year, semester, created_at')
    .single();

  if (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Student account created successfully',
    user: { ...newUser, role: 'student' }
  });
}
