import React, { useState, useEffect } from 'react';
import { Session, Room, User } from '../types';
import { api } from '../services/mockBackend';
import TimetableManager from './TimetableManager';

interface AdminDashboardProps {
  user: User;
  sessions: Session[];
  onUpdate: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, sessions, onUpdate }) => {
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  
  useEffect(() => {
      api.getRooms().then(setRooms);
  }, []);
  
  const handleDelete = async (id: string) => {
    if(window.confirm("Are you sure you want to delete this session?")) {
        await api.deleteSession(id);
        onUpdate();
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSession) {
        await api.updateSession(editingSession);
        setEditingSession(null);
        onUpdate();
    }
  };

  // New Session State
  const [newSession, setNewSession] = useState<Partial<Session>>({
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      subject: '',
      roomId: '',
      teacherName: ''
  });

  const handleCreateSession = async (e: React.FormEvent) => {
      e.preventDefault();
      if(newSession.roomId && newSession.subject && newSession.teacherName) {
          await api.createSession({
              id: `manual-${Date.now()}`,
              teacherId: user.id, // Default to current admin or placeholder
              checkedIn: false,
              ...newSession
          } as Session);
          setIsAdding(false);
          onUpdate();
      }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [selectedDay, setSelectedDay] = useState('Monday');

  const filteredSessions = sessions.filter(s => s.day === selectedDay).sort((a,b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-brand-500">
            <h3 className="text-gray-500 text-xs font-bold uppercase">Total Sessions (Week)</h3>
            <p className="text-2xl font-bold text-gray-800">{sessions.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-red-500">
            <h3 className="text-gray-500 text-xs font-bold uppercase">Admin Actions</h3>
            <p className="text-sm text-gray-600 mt-1">Monitor classroom activity and manage timetable.</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-500">
            <h3 className="text-gray-500 text-xs font-bold uppercase">System Status</h3>
            <p className="text-2xl font-bold text-green-600">Online</p>
        </div>
      </div>

      {/* Timetable Management */}
      <TimetableManager currentUser={user} onUpdate={onUpdate} />

      {/* Manual Edit Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-800">Manage Timetable</h2>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition"
                >
                    <i className="fas fa-plus mr-1"></i> Add Session
                </button>
            </div>
        </div>

        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
            {days.map(d => (
                <button 
                    key={d} 
                    onClick={() => setSelectedDay(d)}
                    className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${selectedDay === d ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    {d}
                </button>
            ))}
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3">Room</th>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Subject</th>
                        <th className="px-4 py-3">Teacher</th>
                        <th className="px-4 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSessions.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-400">No sessions scheduled for {selectedDay}</td></tr>
                    ) : (
                        filteredSessions.map(s => (
                            <tr key={s.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{s.roomId}</td>
                                <td className="px-4 py-3">{s.startTime} - {s.endTime}</td>
                                <td className="px-4 py-3">{s.subject}</td>
                                <td className="px-4 py-3">{s.teacherName}</td>
                                <td className="px-4 py-3 flex space-x-2">
                                    <button onClick={() => setEditingSession(s)} className="text-blue-600 hover:text-blue-800" title="Edit"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-800" title="Delete"><i className="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Edit Modal */}
      {(editingSession || isAdding) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">{isAdding ? 'Add New Session' : 'Edit Session'}</h3>
                <form onSubmit={isAdding ? handleCreateSession : handleSaveEdit} className="space-y-3">
                    <div>
                         <label className="block text-xs font-bold text-gray-500">Room</label>
                         <select 
                            className="w-full border rounded p-2"
                            value={isAdding ? newSession.roomId : editingSession?.roomId}
                            onChange={e => isAdding ? setNewSession({...newSession, roomId: e.target.value}) : setEditingSession({...editingSession!, roomId: e.target.value})}
                            required
                         >
                             <option value="">Select Room</option>
                             {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                         </select>
                    </div>
                    
                    {/* Always allow editing Day now */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500">Day</label>
                        <select 
                            className="w-full border rounded p-2"
                            value={isAdding ? newSession.day : editingSession?.day}
                            onChange={e => isAdding ? setNewSession({...newSession, day: e.target.value}) : setEditingSession({...editingSession!, day: e.target.value})}
                        >
                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500">Subject</label>
                        <input 
                            className="w-full border rounded p-2" 
                            value={isAdding ? newSession.subject : editingSession?.subject} 
                            onChange={e => isAdding ? setNewSession({...newSession, subject: e.target.value}) : setEditingSession({...editingSession!, subject: e.target.value})}
                            required
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="w-1/2">
                            <label className="block text-xs font-bold text-gray-500">Start Time</label>
                            <input type="time" className="w-full border rounded p-2" value={isAdding ? newSession.startTime : editingSession?.startTime} onChange={e => isAdding ? setNewSession({...newSession, startTime: e.target.value}) : setEditingSession({...editingSession!, startTime: e.target.value})} required />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-xs font-bold text-gray-500">End Time</label>
                            <input type="time" className="w-full border rounded p-2" value={isAdding ? newSession.endTime : editingSession?.endTime} onChange={e => isAdding ? setNewSession({...newSession, endTime: e.target.value}) : setEditingSession({...editingSession!, endTime: e.target.value})} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500">Teacher Name</label>
                        <input 
                            className="w-full border rounded p-2" 
                            value={isAdding ? newSession.teacherName : editingSession?.teacherName} 
                            onChange={e => isAdding ? setNewSession({...newSession, teacherName: e.target.value}) : setEditingSession({...editingSession!, teacherName: e.target.value})}
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                        <button type="button" onClick={() => { setEditingSession(null); setIsAdding(false); }} className="text-gray-500 hover:text-gray-700">Cancel</button>
                        <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700">{isAdding ? 'Create' : 'Save Changes'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;