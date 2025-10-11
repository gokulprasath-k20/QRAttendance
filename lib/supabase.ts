import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client component client
export const createClientSupabase = () => createClientComponentClient();

// Server component client
export const createServerSupabase = () => createServerComponentClient({ cookies });

// Service role client (for admin operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types
export type Database = {
  public: {
    Tables: {
      staff: {
        Row: {
          id: string;
          name: string;
          email: string;
          password_hash: string;
          subjects: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          password_hash: string;
          subjects: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          password_hash?: string;
          subjects?: string[];
          created_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          reg_no: string;
          name: string;
          email: string;
          password_hash: string;
          year: number;
          semester: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          reg_no: string;
          name: string;
          email: string;
          password_hash: string;
          year: number;
          semester: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          reg_no?: string;
          name?: string;
          email?: string;
          password_hash?: string;
          year?: number;
          semester?: number;
          created_at?: string;
        };
      };
      admin: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          created_at?: string;
        };
      };
      otp_sessions: {
        Row: {
          id: string;
          staff_id: string;
          subject: string;
          year: number;
          semester: number;
          date: string;
          start_time: string;
          end_time: string | null;
          is_active: boolean;
          total_students: number;
          current_otp_token: string | null;
          otp_rotation_count: number;
          last_otp_update: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          subject: string;
          year: number;
          semester: number;
          date?: string;
          start_time?: string;
          end_time?: string | null;
          is_active?: boolean;
          total_students?: number;
          current_otp_token?: string | null;
          otp_rotation_count?: number;
          last_otp_update?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          subject?: string;
          year?: number;
          semester?: number;
          date?: string;
          start_time?: string;
          end_time?: string | null;
          is_active?: boolean;
          total_students?: number;
          current_otp_token?: string | null;
          otp_rotation_count?: number;
          last_otp_update?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          marked_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          student_id: string;
          marked_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          student_id?: string;
          marked_at?: string;
        };
      };
    };
  };
};
