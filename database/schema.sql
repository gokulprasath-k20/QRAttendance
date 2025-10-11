-- OTP Attendance Management System Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Staff Management Table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Management Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 4),
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Management Table
CREATE TABLE IF NOT EXISTS admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OTP Sessions Table (renamed from qr_sessions for clarity)
CREATE TABLE IF NOT EXISTS otp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 4),
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  total_students INTEGER DEFAULT 0,
  current_otp_token TEXT, -- Stores encrypted OTP token
  otp_rotation_count INTEGER DEFAULT 0, -- Track OTP rotations
  last_otp_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Last OTP update time
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES otp_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  otp_used TEXT, -- Store the OTP code that was used for attendance
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- OTP History Table (for audit and security)
CREATE TABLE IF NOT EXISTS otp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES otp_sessions(id) ON DELETE CASCADE,
  otp_code TEXT NOT NULL, -- Store the actual 6-digit OTP (not encrypted)
  encrypted_token TEXT NOT NULL, -- Store the encrypted token
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES students(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_students_reg_no ON students(reg_no);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_year_semester ON students(year, semester);
CREATE INDEX IF NOT EXISTS idx_admin_email ON admin(email);
CREATE INDEX IF NOT EXISTS idx_otp_sessions_staff_id ON otp_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_otp_sessions_date ON otp_sessions(date);
CREATE INDEX IF NOT EXISTS idx_otp_sessions_active ON otp_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_otp_sessions_year_semester ON otp_sessions(year, semester);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_at ON attendance(marked_at);
CREATE INDEX IF NOT EXISTS idx_otp_history_session_id ON otp_history(session_id);
CREATE INDEX IF NOT EXISTS idx_otp_history_otp_code ON otp_history(otp_code);
CREATE INDEX IF NOT EXISTS idx_otp_history_expires_at ON otp_history(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_history_is_used ON otp_history(is_used);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (drop existing ones first)
DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_updated_at ON admin;
CREATE TRIGGER update_admin_updated_at BEFORE UPDATE ON admin
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_otp_sessions_updated_at ON otp_sessions;
CREATE TRIGGER update_otp_sessions_updated_at BEFORE UPDATE ON otp_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired OTP history
CREATE OR REPLACE FUNCTION cleanup_expired_otp_history()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM otp_history 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate OTP and mark attendance (8-second expiration)
CREATE OR REPLACE FUNCTION validate_otp_and_mark_attendance(
    p_student_id UUID,
    p_otp_code TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    session_id UUID
) AS $$
DECLARE
    v_session_record RECORD;
    v_student_record RECORD;
    v_otp_record RECORD;
BEGIN
    -- Get student details
    SELECT * INTO v_student_record FROM students WHERE id = p_student_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Student not found', NULL::UUID;
        RETURN;
    END IF;
    
    -- Find active session with matching OTP for student's year/semester (15-second window)
    SELECT oh.*, os.* INTO v_otp_record
    FROM otp_history oh
    JOIN otp_sessions os ON oh.session_id = os.id
    WHERE oh.otp_code = p_otp_code
    AND oh.generated_at > NOW() - INTERVAL '15 seconds'
    AND oh.is_used = FALSE
    AND os.is_active = TRUE
    AND os.year = v_student_record.year
    AND os.semester = v_student_record.semester
    ORDER BY oh.generated_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Invalid or expired OTP code (15-second window)', NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if student already marked attendance for this session
    IF EXISTS (SELECT 1 FROM attendance WHERE session_id = v_otp_record.session_id AND student_id = p_student_id) THEN
        RETURN QUERY SELECT FALSE, 'Attendance already marked for this session', v_otp_record.session_id;
        RETURN;
    END IF;
    
    -- Mark OTP as used
    UPDATE otp_history 
    SET is_used = TRUE, used_by = p_student_id, used_at = NOW()
    WHERE id = v_otp_record.id;
    
    -- Insert attendance record
    INSERT INTO attendance (session_id, student_id, otp_used)
    VALUES (v_otp_record.session_id, p_student_id, p_otp_code);
    
    RETURN QUERY SELECT TRUE, 'Attendance marked successfully', v_otp_record.session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security (RLS)
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff table (drop existing ones first)
DROP POLICY IF EXISTS "Staff can view their own data" ON staff;
CREATE POLICY "Staff can view their own data" ON staff
    FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Staff can update their own data" ON staff;
CREATE POLICY "Staff can update their own data" ON staff
    FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for students table
DROP POLICY IF EXISTS "Students can view their own data" ON students;
CREATE POLICY "Students can view their own data" ON students
    FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Students can update their own data" ON students;
CREATE POLICY "Students can update their own data" ON students
    FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for admin table
DROP POLICY IF EXISTS "Admin can view their own data" ON admin;
CREATE POLICY "Admin can view their own data" ON admin
    FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Admin can update their own data" ON admin;
CREATE POLICY "Admin can update their own data" ON admin
    FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for otp_sessions table
DROP POLICY IF EXISTS "Staff can manage their own sessions" ON otp_sessions;
CREATE POLICY "Staff can manage their own sessions" ON otp_sessions
    FOR ALL USING (auth.uid()::text = staff_id::text);

DROP POLICY IF EXISTS "Students can view sessions for their year/semester" ON otp_sessions;
CREATE POLICY "Students can view sessions for their year/semester" ON otp_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id::text = auth.uid()::text 
            AND students.year = otp_sessions.year 
            AND students.semester = otp_sessions.semester
        )
    );

-- RLS Policies for attendance table
DROP POLICY IF EXISTS "Staff can view attendance for their sessions" ON attendance;
CREATE POLICY "Staff can view attendance for their sessions" ON attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM otp_sessions 
            WHERE otp_sessions.id = attendance.session_id 
            AND otp_sessions.staff_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "Students can view their own attendance" ON attendance;
CREATE POLICY "Students can view their own attendance" ON attendance
    FOR SELECT USING (auth.uid()::text = student_id::text);

DROP POLICY IF EXISTS "Students can insert their own attendance" ON attendance;
CREATE POLICY "Students can insert their own attendance" ON attendance
    FOR INSERT WITH CHECK (auth.uid()::text = student_id::text);

-- RLS Policies for otp_history table
DROP POLICY IF EXISTS "Staff can view OTP history for their sessions" ON otp_history;
CREATE POLICY "Staff can view OTP history for their sessions" ON otp_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM otp_sessions 
            WHERE otp_sessions.id = otp_history.session_id 
            AND otp_sessions.staff_id::text = auth.uid()::text
        )
    );

-- Create views for easier querying
CREATE OR REPLACE VIEW session_with_staff AS
SELECT 
    s.*,
    st.name as staff_name,
    st.email as staff_email
FROM otp_sessions s
JOIN staff st ON s.staff_id = st.id;

CREATE OR REPLACE VIEW attendance_with_details AS
SELECT 
    a.*,
    s.name as student_name,
    s.reg_no as student_reg_no,
    s.year as student_year,
    s.semester as student_semester,
    os.subject,
    os.date as session_date,
    os.start_time as session_start_time,
    st.name as staff_name
FROM attendance a
JOIN students s ON a.student_id = s.id
JOIN otp_sessions os ON a.session_id = os.id
JOIN staff st ON os.staff_id = st.id;

-- View for active OTP sessions with current codes (15-second window)
CREATE OR REPLACE VIEW active_otp_sessions AS
SELECT 
    s.*,
    st.name as staff_name,
    oh.otp_code as current_otp,
    oh.generated_at as otp_generated_at,
    oh.generated_at + INTERVAL '15 seconds' as otp_expires_at
FROM otp_sessions s
JOIN staff st ON s.staff_id = st.id
LEFT JOIN otp_history oh ON s.id = oh.session_id 
    AND oh.generated_at > NOW() - INTERVAL '15 seconds'
    AND oh.is_used = FALSE
WHERE s.is_active = TRUE
ORDER BY s.created_at DESC, oh.generated_at DESC;

-- Insert default admin user (password: admin123)
-- Note: In production, use a secure password and proper hashing
INSERT INTO admin (email, password_hash) 
VALUES ('admin@college.edu', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
ON CONFLICT (email) DO NOTHING;

-- Create function to get attendance statistics
CREATE OR REPLACE FUNCTION get_attendance_stats(student_uuid UUID)
RETURNS TABLE (
    total_sessions BIGINT,
    attended_sessions BIGINT,
    attendance_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT os.id) as total_sessions,
        COUNT(DISTINCT a.session_id) as attended_sessions,
        CASE 
            WHEN COUNT(DISTINCT os.id) > 0 
            THEN ROUND((COUNT(DISTINCT a.session_id)::NUMERIC / COUNT(DISTINCT os.id)::NUMERIC) * 100, 2)
            ELSE 0
        END as attendance_percentage
    FROM students st
    LEFT JOIN otp_sessions os ON st.year = os.year AND st.semester = os.semester
    LEFT JOIN attendance a ON os.id = a.session_id AND a.student_id = st.id
    WHERE st.id = student_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_students BIGINT,
    total_staff BIGINT,
    active_sessions BIGINT,
    today_attendance BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM staff) as total_staff,
        (SELECT COUNT(*) FROM otp_sessions WHERE is_active = true) as active_sessions,
        (SELECT COUNT(*) FROM attendance WHERE DATE(marked_at) = CURRENT_DATE) as today_attendance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration helper: Copy data from qr_sessions to otp_sessions (if qr_sessions exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'qr_sessions') THEN
        INSERT INTO otp_sessions (
            id, staff_id, subject, year, semester, date, start_time, end_time, 
            is_active, total_students, current_otp_token, created_at, updated_at
        )
        SELECT 
            id, staff_id, subject, year, semester, date, start_time, end_time,
            is_active, total_students, current_otp_token, created_at, updated_at
        FROM qr_sessions
        ON CONFLICT (id) DO NOTHING;
        
        -- Update attendance table references if needed
        -- This assumes the foreign key constraint allows it
    END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
