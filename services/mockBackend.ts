import { User, Room, Session, Alert, UserRole } from '../types';

// --- Initial Data Generation ---

const generateRooms = (): Room[] => {
  const rooms: Room[] = [];
  // 15 Classrooms
  for (let i = 1; i <= 15; i++) {
    rooms.push({
      id: `c${i}`,
      name: `Classroom ${i}`,
      type: 'CLASSROOM',
      capacity: 60,
      features: ['Projector', 'Whiteboard']
    });
  }
  // 5 Labs
  for (let i = 1; i <= 5; i++) {
    rooms.push({
      id: `l${i}`,
      name: `Lab ${i}`,
      type: 'LAB',
      capacity: 60,
      features: ['Computers', 'AC', 'Safety Gear']
    });
  }
  // 1 Seminar Hall
  rooms.push({
    id: `s1`,
    name: `Main Seminar Hall`,
    type: 'SEMINAR_HALL',
    capacity: 150,
    features: ['Audio System', 'Stage', 'Projector']
  });
  return rooms;
};

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Dr. HOD', email: 'hod@college.edu', role: UserRole.ADMIN, department: 'Computer Science', password: 'admin' },
  { id: 'u2', name: 'Prof. Smith', email: 'smith@college.edu', role: UserRole.TEACHER, phone: '123-456-7890', password: 'pass', department: 'CS' },
  { id: 'u3', name: 'Prof. Johnson', email: 'johnson@college.edu', role: UserRole.TEACHER, phone: '987-654-3210', password: 'pass', department: 'Math' },
];

// Initial Session for Demo
const MOCK_SESSIONS: Session[] = [
  { 
    id: 's1', 
    day: 'Monday', 
    startTime: '09:00', 
    endTime: '10:00', 
    subject: 'Intro to CS', 
    roomId: 'c1', 
    teacherId: 'u2', 
    teacherName: 'Prof. Smith', 
    checkedIn: false,
    durationHours: 1
  }
];

// --- LocalStorage Persistence ---

const DB = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem('users') || JSON.stringify(MOCK_USERS)),
  setUsers: (users: User[]) => localStorage.setItem('users', JSON.stringify(users)),
  
  getRooms: (): Room[] => {
    const stored = localStorage.getItem('rooms');
    if (stored) return JSON.parse(stored);
    const initial = generateRooms();
    localStorage.setItem('rooms', JSON.stringify(initial));
    return initial;
  },
  
  getSessions: (): Session[] => JSON.parse(localStorage.getItem('sessions') || JSON.stringify(MOCK_SESSIONS)),
  setSessions: (sessions: Session[]) => localStorage.setItem('sessions', JSON.stringify(sessions)),

  getAlerts: (): Alert[] => JSON.parse(localStorage.getItem('alerts') || '[]'),
  setAlerts: (alerts: Alert[]) => localStorage.setItem('alerts', JSON.stringify(alerts)),
};

// --- API Exports ---

export const api = {
  login: async (email: string, password: string): Promise<User | null> => {
    await new Promise(r => setTimeout(r, 300));
    const users = DB.getUsers();
    return users.find(u => u.email === email && u.password === password) || null;
  },

  registerUser: async (user: User): Promise<User> => {
    const users = DB.getUsers();
    if (users.find(u => u.email === user.email)) throw new Error("User already exists");
    users.push(user);
    DB.setUsers(users);
    return user;
  },

  getRooms: async () => DB.getRooms(),

  getSessions: async () => DB.getSessions(),

  addSessions: async (newSessions: Session[]) => {
    const current = DB.getSessions();
    DB.setSessions([...current, ...newSessions]);
  },

  createSession: async (session: Session) => {
    const current = DB.getSessions();
    DB.setSessions([...current, session]);
    return session;
  },

  updateSession: async (updatedSession: Session) => {
    const sessions = DB.getSessions();
    const idx = sessions.findIndex(s => s.id === updatedSession.id);
    if (idx !== -1) {
      sessions[idx] = updatedSession;
      DB.setSessions(sessions);
    }
  },

  deleteSession: async (sessionId: string) => {
    const sessions = DB.getSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    DB.setSessions(filtered);
  },

  // Check-in logic with Student Count
  checkIn: async (sessionId: string, studentCount: number) => {
    const sessions = DB.getSessions();
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx !== -1) {
      sessions[idx].checkedIn = true;
      sessions[idx].checkInTime = new Date().toLocaleTimeString();
      sessions[idx].studentCount = studentCount;
      DB.setSessions(sessions);
    }
  },

  // Generate QR Code state (simulated)
  generateQr: async (sessionId: string, duration: number) => {
    const sessions = DB.getSessions();
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx !== -1) {
        sessions[idx].qrCodeGenerated = true;
        sessions[idx].durationHours = duration;
        // Update end time based on duration logic could go here
        DB.setSessions(sessions);
    }
  },

  createAlert: async (alert: Alert) => {
    const alerts = DB.getAlerts();
    // Debounce duplicate alerts (same message within 10 mins)
    if(!alerts.find(a => a.message === alert.message && Date.now() - a.timestamp < 600000)) {
        DB.setAlerts([alert, ...alerts]);
    }
  },

  getAlertsForUser: async (userId: string) => {
    return DB.getAlerts().filter(a => a.recipientId === userId);
  }
};