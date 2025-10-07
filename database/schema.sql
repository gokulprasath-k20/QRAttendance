-- QR Attendance Management System Database Schema
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

-- QR Sessions Table
CREATE TABLE IF NOT EXISTS qr_sessions (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES qr_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_students_reg_no ON students(reg_no);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_year_semester ON students(year, semester);
CREATE INDEX IF NOT EXISTS idx_admin_email ON admin(email);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_staff_id ON qr_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_date ON qr_sessions(date);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_active ON qr_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_year_semester ON qr_sessions(year, semester);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_at ON attendance(marked_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_updated_at BEFORE UPDATE ON admin
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_sessions_updated_at BEFORE UPDATE ON qr_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff table
CREATE POLICY "Staff can view their own data" ON staff
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Staff can update their own data" ON staff
    FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for students table
CREATE POLICY "Students can view their own data" ON students
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Students can update their own data" ON students
    FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for admin table
CREATE POLICY "Admin can view their own data" ON admin
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admin can update their own data" ON admin
    FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for qr_sessions table
CREATE POLICY "Staff can manage their own sessions" ON qr_sessions
    FOR ALL USING (auth.uid()::text = staff_id::text);

CREATE POLICY "Students can view sessions for their year/semester" ON qr_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE students.id::text = auth.uid()::text 
            AND students.year = qr_sessions.year 
            AND students.semester = qr_sessions.semester
        )
    );

-- RLS Policies for attendance table
CREATE POLICY "Staff can view attendance for their sessions" ON attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM qr_sessions 
            WHERE qr_sessions.id = attendance.session_id 
            AND qr_sessions.staff_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Students can view their own attendance" ON attendance
    FOR SELECT USING (auth.uid()::text = student_id::text);

CREATE POLICY "Students can insert their own attendance" ON attendance
    FOR INSERT WITH CHECK (auth.uid()::text = student_id::text);

-- Create views for easier querying
CREATE OR REPLACE VIEW session_with_staff AS
SELECT 
    s.*,
    st.name as staff_name,
    st.email as staff_email
FROM qr_sessions s
JOIN staff st ON s.staff_id = st.id;

CREATE OR REPLACE VIEW attendance_with_details AS
SELECT 
    a.*,
    s.name as student_name,
    s.reg_no as student_reg_no,
    s.year as student_year,
    s.semester as student_semester,
    qs.subject,
    qs.date as session_date,
    qs.start_time as session_start_time,
    st.name as staff_name
FROM attendance a
JOIN students s ON a.student_id = s.id
JOIN qr_sessions qs ON a.session_id = qs.id
JOIN staff st ON qs.staff_id = st.id;

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
        COUNT(DISTINCT qs.id) as total_sessions,
        COUNT(DISTINCT a.session_id) as attended_sessions,
        CASE 
            WHEN COUNT(DISTINCT qs.id) > 0 
            THEN ROUND((COUNT(DISTINCT a.session_id)::NUMERIC / COUNT(DISTINCT qs.id)::NUMERIC) * 100, 2)
            ELSE 0
        END as attendance_percentage
    FROM students st
    LEFT JOIN qr_sessions qs ON st.year = qs.year AND st.semester = qs.semester
    LEFT JOIN attendance a ON qs.id = a.session_id AND a.student_id = st.id
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
        (SELECT COUNT(*) FROM qr_sessions WHERE is_active = true) as active_sessions,
        (SELECT COUNT(*) FROM attendance WHERE DATE(marked_at) = CURRENT_DATE) as today_attendance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
