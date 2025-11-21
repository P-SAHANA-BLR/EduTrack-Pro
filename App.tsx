import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { User, UserRole, Session } from './types';
import { api } from './services/mockBackend';
import RoomTracker from './components/RoomTracker';
import TeacherConsole from './components/TeacherConsole';
import AdminDashboard from './components/AdminDashboard';
import AlertSystem from './components/AlertSystem';

// --- Components defined inline for single-file simplicity in output, but structured ---

const Login = ({ onLogin, onSwitchToRegister }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await api.login(email, password);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-600 mb-3">
                <i className="fas fa-university text-xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-brand-900">EduTrack Pro</h1>
            <p className="text-sm text-gray-500">Classroom Occupancy & Management</p>
        </div>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm border p-2 focus:border-brand-500 focus:ring-brand-500" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm border p-2 focus:border-brand-500 focus:ring-brand-500" required />
          </div>
          <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-md hover:bg-brand-700 transition font-medium">Sign In</button>
        </form>
        <div className="mt-4 text-center text-sm">
          <button onClick={onSwitchToRegister} className="text-brand-600 hover:underline">New User? Register here</button>
        </div>
      </div>
    </div>
  );
};

const Register = ({ onRegister, onSwitchToLogin }: any) => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', department: '', password: '', role: UserRole.TEACHER
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await api.registerUser({
            id: `u-${Date.now()}`,
            ...formData
        });
        alert("Registration successful! Please login.");
        onSwitchToLogin();
    } catch(e) {
        alert("Registration failed. Email might be taken.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-brand-700 mb-6 text-center">User Registration</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
             <label className="block text-xs font-bold text-gray-600 mb-1">Role</label>
             <select 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                className="w-full border p-2 rounded bg-gray-50"
             >
                 <option value={UserRole.TEACHER}>Faculty / Teacher</option>
                 <option value={UserRole.ADMIN}>HOD / Admin</option>
             </select>
          </div>
          <input placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded" required />
          <input placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-2 rounded" required />
          <input placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border p-2 rounded" required />
          <input placeholder="Department" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full border p-2 rounded" required />
          <input placeholder="Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border p-2 rounded" required />
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition">Register</button>
        </form>
        <button onClick={onSwitchToLogin} className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700">Back to Login</button>
      </div>
    </div>
  );
};

const Dashboard = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'admin'>('overview');

  const refreshData = async () => {
    const allSessions = await api.getSessions();
    setSessions(allSessions);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  // --- 20 Minute Alert Rule Logic ---
  useEffect(() => {
    const checkAttendance = async () => {
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[now.getDay()];
        const currentHm = now.getHours() * 60 + now.getMinutes();
        
        // Mock HOD ID
        const adminId = 'u1'; 

        sessions.forEach(s => {
            if (s.day !== currentDay) return;
            const [sh, sm] = s.startTime.split(':').map(Number);
            const sessionStartMin = sh * 60 + sm;
            
            // Rule: "within 20 minutes of beginning of the new period" 
            if (currentHm > sessionStartMin + 20 && currentHm < sessionStartMin + 60 && !s.checkedIn) {
                api.createAlert({
                    id: `alert-absent-${s.id}`,
                    message: `CRITICAL: Room ${s.roomId} is EMPTY. ${s.teacherName} absent > 20mins.`,
                    type: 'CRITICAL',
                    timestamp: Date.now(),
                    read: false,
                    recipientId: adminId
                });
            }
        });
    };

    const timer = setInterval(checkAttendance, 60000);
    checkAttendance();
    return () => clearInterval(timer);
  }, [sessions]);

  useEffect(() => {
      if (user.role === UserRole.ADMIN) setActiveTab('admin'); // Default to Admin console for HOD
      else setActiveTab('schedule');
  }, [user.role]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm px-4 sm:px-6 py-3 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-brand-200 shadow-lg">
                <i className="fas fa-graduation-cap"></i>
            </div>
            <span className="font-bold text-lg sm:text-xl text-gray-800 hidden sm:block">EduTrack Pro</span>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-4">
            {/* Nav Tabs */}
            <button 
                onClick={() => setActiveTab('overview')} 
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
                Live View
            </button>
            
            {user.role === UserRole.TEACHER && (
                 <button 
                    onClick={() => setActiveTab('schedule')} 
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'schedule' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    My Classes & Booking
                </button>
            )}

            {user.role === UserRole.ADMIN && (
                 <button 
                    onClick={() => setActiveTab('admin')} 
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'admin' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Admin Console
                </button>
            )}

            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            
            <div className="flex items-center gap-2">
                <div className="text-right hidden md:block leading-tight">
                    <div className="text-sm font-bold text-gray-900">{user.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">{user.role}</div>
                </div>
                <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition" title="Logout">
                    <i className="fas fa-sign-out-alt"></i>
                </button>
            </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        
        {activeTab === 'overview' && (
            <div className="animate-fade-in">
                <RoomTracker sessions={sessions} />
            </div>
        )}

        {activeTab === 'schedule' && user.role === UserRole.TEACHER && (
            <div className="animate-fade-in">
                <TeacherConsole user={user} sessions={sessions} onUpdate={refreshData} />
            </div>
        )}

        {activeTab === 'admin' && user.role === UserRole.ADMIN && (
            <div className="animate-fade-in">
                <AdminDashboard user={user} sessions={sessions} onUpdate={refreshData} />
            </div>
        )}
      </main>

      <AlertSystem user={user} />
    </div>
  );
};

// Main App Container
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('currentUser', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          user ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : (
            isRegistering ? 
                <Register onRegister={() => setIsRegistering(false)} onSwitchToLogin={() => setIsRegistering(false)} /> : 
                <Login onLogin={handleLogin} onSwitchToRegister={() => setIsRegistering(true)} />
          )
        } />
      </Routes>
    </Router>
  );
};

export default App;