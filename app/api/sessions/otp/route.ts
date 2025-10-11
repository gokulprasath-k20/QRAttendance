import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const { id: staffId, role } = sessionData;

    if (role !== 'staff') {
      return NextResponse.json({ error: 'Only staff can update OTP tokens' }, { status: 403 });
    }

    const { sessionId, otpToken } = await request.json();

    if (!sessionId || !otpToken) {
      return NextResponse.json({ error: 'Session ID and OTP token are required' }, { status: 400 });
    }

    // Verify session belongs to staff
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('otp_sessions')
      .select('staff_id')
      .eq('id', sessionId)
      .eq('staff_id', staffId)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // Update session with new OTP token
    const { error: updateError } = await supabaseAdmin
      .from('otp_sessions')
      .update({ current_otp_token: otpToken })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json({ error: 'Failed to update OTP token' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('OTP update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
