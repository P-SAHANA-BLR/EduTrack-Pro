import React, { useState, useEffect } from 'react';
import { Session, User, Room } from '../types';
import { api } from '../services/mockBackend';

interface TeacherConsoleProps {
  user: User;
  sessions: Session[];
  onUpdate: () => void;
}

const TeacherConsole: React.FC<TeacherConsoleProps> = ({ user, sessions, onUpdate }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  
  // Booking State
  const [bookingRoom, setBookingRoom] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD
  const [bookingTime, setBookingTime] = useState(new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})); // HH:MM
  const [bookingDuration, setBookingDuration] = useState(1);
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState<number>(0);
  
  // Optimistic session state to show QR immediately without waiting for server roundtrip
  const [optimisticSession, setOptimisticSession] = useState<Session | null>(null);
  
  useEffect(() => {
      api.getRooms().then(setRooms);
  }, []);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = days[new Date().getDay()];
  
  const scheduledSessions = sessions.filter(s => s.teacherId === user.id && s.day === todayDayName).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleStartBooking = async () => {
      if(!bookingRoom || !bookingDate || !bookingTime) {
          alert("Please fill in all booking details");
          return;
      }

      const [h, m] = bookingTime.split(':').map(Number);
      const endH = (h + bookingDuration) % 24;
      const endTimeStr = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      const [y, month, d] = bookingDate.split('-').map(Number);
      const dateObj = new Date(y, month - 1, d); 
      const bookingDay = days[dateObj.getDay()];

      const newSession: Session = {
          id: `adhoc-${Date.now()}`,
          roomId: bookingRoom,
          day: bookingDay,
          startTime: bookingTime,
          endTime: endTimeStr,
          subject: "Ad-hoc Class / Lab",
          teacherId: user.id,
          teacherName: user.name,
          checkedIn: false,
          durationHours: bookingDuration,
          qrCodeGenerated: true 
      };

      // Optimistic Update: Show immediately
      setOptimisticSession(newSession);
      setActiveSessionId(newSession.id);

      await api.createSession(newSession);
      onUpdate(); 
  };

  const handleScheduledStart = async (session: Session) => {
      // Calculate duration from existing times
      const [sh, sm] = session.startTime.split(':').map(Number);
      const [eh, em] = session.endTime.split(':').map(Number);
      const duration = Math.max(1, Math.round((eh + em/60) - (sh + sm/60)));

      // Optimistic Update
      const updatedSession = { ...session, qrCodeGenerated: true, durationHours: duration };
      setOptimisticSession(updatedSession);
      setActiveSessionId(session.id);

      await api.generateQr(session.id, duration);
      onUpdate();
  };

  const handleConfirmAttendance = async (session: Session | undefined) => {
    if (!session) return;
    if (studentCount <= 0) {
        alert("Please enter a valid number of students.");
        return;
    }
    await api.checkIn(session.id, studentCount);
    setActiveSessionId(null);
    setOptimisticSession(null);
    onUpdate();
  };

  // Logic Fix: Prioritize Optimistic Session if it matches the active ID.
  // This ensures that when a user clicks "Start", the local state (qrCodeGenerated=true) 
  // is used immediately, instead of waiting for the server prop to update.
  const sessionFromProps = sessions.find(s => s.id === activeSessionId);
  const activeSession = (optimisticSession && optimisticSession.id === activeSessionId) 
    ? optimisticSession 
    : sessionFromProps;

  return (
    <div className="space-y-8">
      
      {/* --- Section 1: Quick Start / Book Room --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100">
         <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
             <i className="fas fa-bolt text-yellow-500 mr-2"></i> Start Class / Lab Session
         </h2>
         <p className="text-sm text-gray-600 mb-4">Select classroom and duration to generate attendance QR code immediately.</p>
         
         <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
             <div>
                 <label className="block text-xs font-bold text-gray-500 mb-1">Room / Lab</label>
                 <select 
                    className="w-full border rounded p-2 text-sm" 
                    value={bookingRoom} 
                    onChange={e => setBookingRoom(e.target.value)}
                 >
                     <option value="">Select Room...</option>
                     {rooms.map(r => (
                         <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                     ))}
                 </select>
             </div>
             <div>
                 <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                 <input 
                    type="date" 
                    className="w-full border rounded p-2 text-sm" 
                    value={bookingDate} 
                    onChange={e => setBookingDate(e.target.value)} 
                 />
             </div>
             <div>
                 <label className="block text-xs font-bold text-gray-500 mb-1">Time</label>
                 <input 
                    type="time" 
                    className="w-full border rounded p-2 text-sm" 
                    value={bookingTime} 
                    onChange={e => setBookingTime(e.target.value)} 
                 />
             </div>
             <div>
                 <label className="block text-xs font-bold text-gray-500 mb-1">Duration</label>
                 <select 
                    className="w-full border rounded p-2 text-sm" 
                    value={bookingDuration}
                    onChange={e => setBookingDuration(Number(e.target.value))}
                 >
                     <option value={1}>1 Hour</option>
                     <option value={2}>2 Hours</option>
                     <option value={3}>3 Hours (Max)</option>
                 </select>
             </div>
             <button 
                onClick={handleStartBooking}
                className="bg-brand-600 text-white py-2 px-4 rounded-md hover:bg-brand-700 transition font-bold text-sm h-10"
             >
                 Generate QR
             </button>
         </div>
      </div>

      {/* --- Section 2: Active QR Code Area --- */}
      {activeSession && activeSession.qrCodeGenerated && !activeSession.checkedIn && (
          <div className="bg-brand-50 p-6 rounded-xl border border-brand-200 animate-fade-in">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="bg-white p-3 border rounded-lg shadow-sm">
                      <div className="w-48 h-48 bg-white flex items-center justify-center overflow-hidden rounded-md border border-gray-100">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({id: activeSession.id, room: activeSession.roomId, subj: activeSession.subject}))}`}
                            alt="Session QR Code"
                            className="w-full h-full object-contain"
                          />
                      </div>
                  </div>
                  <div className="flex-1 space-y-4">
                      <div>
                        <span className="bg-brand-100 text-brand-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Active Session</span>
                        <h3 className="text-xl font-bold text-gray-900 mt-1">{activeSession.subject}</h3>
                        <p className="text-sm text-gray-600">Room: {activeSession.roomId} • {activeSession.startTime} - {activeSession.endTime}</p>
                      </div>
                      
                      <p className="text-gray-600 text-sm border-l-4 border-brand-300 pl-3">
                          <b>Step 1:</b> Ask students to scan the QR code to mark their attendance.<br/>
                          <b>Step 2:</b> Once class has settled, enter the headcount below to confirm room occupancy.
                      </p>

                      <div className="p-4 bg-white rounded-lg border border-gray-200 max-w-md shadow-sm">
                          <label className="block text-xs font-bold text-gray-500 mb-2">Number of Students Present</label>
                          <div className="flex gap-2">
                              <input 
                                type="number" 
                                value={studentCount} 
                                onChange={e => setStudentCount(Number(e.target.value))}
                                className="flex-1 border rounded p-2 font-mono text-lg"
                                placeholder="0"
                                min="0"
                                autoFocus
                              />
                              <button 
                                onClick={() => handleConfirmAttendance(activeSession)}
                                className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 transition shadow-sm"
                              >
                                Confirm & Occupy
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- Section 3: Scheduled Classes List --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">My Scheduled Classes (Today)</h2>
        {scheduledSessions.length === 0 ? (
            <p className="text-gray-400 italic">No scheduled classes found for today ({todayDayName}).</p>
        ) : (
            <div className="space-y-4">
                {scheduledSessions.map(s => {
                    const isQrActive = activeSessionId === s.id;
                    return (
                    <div key={s.id} className={`flex justify-between items-center p-4 rounded-lg border ${s.checkedIn ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div>
                            <h4 className="font-bold text-gray-800">{s.subject}</h4>
                            <p className="text-sm text-gray-600">{s.startTime} - {s.endTime} | {s.roomId}</p>
                        </div>
                        <div>
                            {s.checkedIn ? (
                                <span className="text-green-700 text-xs font-bold px-2 py-1 bg-green-100 rounded">In Progress ({s.studentCount} Students)</span>
                            ) : (
                                !(s.qrCodeGenerated || isQrActive) ? (
                                    <button 
                                        onClick={() => handleScheduledStart(s)}
                                        className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 font-medium"
                                    >
                                        Start Class
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <span className="text-brand-600 text-xs font-bold flex items-center">
                                            <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse mr-2"></span>
                                            QR Active
                                        </span>
                                        {!isQrActive && (
                                            <button onClick={() => setActiveSessionId(s.id)} className="text-sm border border-brand-200 text-brand-700 px-2 py-1 rounded hover:bg-brand-50">
                                                View QR
                                            </button>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )})}
            </div>
        )}
      </div>

    </div>
  );
};

export default TeacherConsole;