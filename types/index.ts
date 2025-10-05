export interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff' | 'student';
  created_at: string;
}

export interface Staff extends User {
  name: string;
  subjects: string[];
  password_hash: string;
}

export interface Student extends User {
  reg_no: string;
  name: string;
  year: number;
  semester: number;
  password_hash: string;
}

export interface Admin extends User {
  password_hash: string;
}

export interface QRSession {
  id: string;
  staff_id: string;
  subject: string;
  year: number;
  semester: number;
  date: string;
  start_time: string;
  end_time?: string;
  is_active: boolean;
  total_students: number;
  staff?: Staff;
}

export interface Attendance {
  id: string;
  session_id: string;
  student_id: string;
  marked_at: string;
  session?: QRSession;
  student?: Student;
}

export interface QRToken {
  sessionId: string;
  timestamp: number;
  subject: string;
  year: number;
  semester: number;
}

export interface AttendanceStats {
  totalSessions: number;
  attendedSessions: number;
  attendancePercentage: number;
  recentAttendance: Attendance[];
}

export interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  activeSessions: number;
  todayAttendance: number;
  weeklyAttendance: number[];
  monthlyAttendance: number[];
}

export interface ExportData {
  sessions: QRSession[];
  attendance: Attendance[];
  students: Student[];
  dateRange: {
    start: string;
    end: string;
  };
}

// Academic structure
export const SUBJECTS_BY_YEAR_SEM = {
  1: {
    1: ["Mathematics I", "Physics", "Chemistry", "Engineering Graphics", "Basic Electrical Engineering", "Programming in C"],
    2: ["Mathematics II", "Engineering Mechanics", "Basic Electronics", "Environmental Science", "Workshop Technology", "Communication Skills"]
  },
  2: {
    3: ["DM", "DSA", "OOPS", "FDS", "DPCO"],
    4: ["TOC", "AI&ML", "DBMS", "WE", "IOS", "ESS"]
  },
  3: {
    5: ["Computer Network", "FSWD", "Cloud Computing", "Distributed Computing", "STA"],
    6: ["Software Engineering", "Mobile App Development", "Information Security", "HCI", "Project Management", "Elective I"]
  },
  4: {
    7: ["Machine Learning", "Blockchain Technology", "Advanced Database Systems", "Cyber Security", "Elective II", "Major Project I"],
    8: ["Advanced AI", "IoT and Embedded Systems", "Advanced Software Engineering", "Industry Internship", "Elective III", "Major Project II"]
  }
} as const;

export type Year = 1 | 2 | 3 | 4;
export type Semester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface LoginFormData {
  email: string;
  password: string;
}

export interface StaffRegistrationData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  subjects: string[];
}

export interface StudentRegistrationData {
  reg_no: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  year: number;
  semester: number;
}

export interface SessionCreateData {
  subject: string;
  year: number;
  semester: number;
}
