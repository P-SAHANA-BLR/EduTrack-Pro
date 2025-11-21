export enum UserRole {
  ADMIN = 'ADMIN', // HOD
  TEACHER = 'TEACHER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  phone?: string;
  password?: string; // In a real app, never store plain text
}

export interface Room {
  id: string;
  name: string;
  type: 'CLASSROOM' | 'LAB' | 'SEMINAR_HALL';
  capacity: number;
  features: string[];
}

export interface Session {
  id: string;
  day: string; // Monday, Tuesday...
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  subject: string;
  roomId: string;
  teacherId: string;
  teacherName: string;
  checkedIn: boolean;
  checkInTime?: string;
  studentCount?: number;
  durationHours?: number; // 1, 2, or 3
  qrCodeGenerated?: boolean;
}

export interface Alert {
  id: string;
  message: string;
  type: 'WARNING' | 'INFO' | 'CRITICAL';
  timestamp: number;
  read: boolean;
  recipientId: string; // usually HOD
}

// For Gemini Response
export interface ExtractedTimetableEntry {
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  roomName: string;
  teacherName?: string; // If available in image
}