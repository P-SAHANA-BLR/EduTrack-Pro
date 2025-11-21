import React, { useState, useEffect } from 'react';
import { Room, Session } from '../types';
import { api } from '../services/mockBackend';

interface RoomTrackerProps {
  sessions: Session[];
}

const RoomTracker: React.FC<RoomTrackerProps> = ({ sessions }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    api.getRooms().then(setRooms);
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const getRoomStatus = (roomId: string) => {
    const now = currentTime;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];
    const currentHm = now.getHours() * 60 + now.getMinutes();

    // Check for currently active session
    const activeSession = sessions.find(s => {
      if (s.roomId !== roomId || s.day !== currentDay) return false;
      
      const [startH, startM] = s.startTime.split(':').map(Number);
      const [endH, endM] = s.endTime.split(':').map(Number);
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;

      return currentHm >= startTotal && currentHm < endTotal;
    });

    if (activeSession) return { type: 'ACTIVE', session: activeSession };

    // Check for upcoming session (within 15 mins)
    const upcomingSession = sessions.find(s => {
        if (s.roomId !== roomId || s.day !== currentDay) return false;
        const [startH, startM] = s.startTime.split(':').map(Number);
        const startTotal = startH * 60 + startM;
        // If starts within next 15 mins
        return startTotal > currentHm && startTotal <= currentHm + 15;
    });

    if (upcomingSession) return { type: 'UPCOMING', session: upcomingSession };

    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <i className="fas fa-building mr-2 text-brand-600"></i>
            Live Occupancy Tracker
          </h2>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
      </div>

      {/* Grid for Classrooms & Labs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {rooms.map(room => {
          const status = getRoomStatus(room.id);
          const activeSession = status?.session;
          const isOccupied = status?.type === 'ACTIVE';
          const isUpcoming = status?.type === 'UPCOMING';
          const isCheckedIn = isOccupied && activeSession?.checkedIn;
          
          let statusColor = 'border-gray-200 bg-gray-50'; // Default Empty
          if (isUpcoming) statusColor = 'border-orange-300 bg-orange-50'; // Upcoming
          if (isOccupied && !isCheckedIn) statusColor = 'border-yellow-400 bg-yellow-50'; // Scheduled but waiting
          if (isCheckedIn) statusColor = 'border-red-500 bg-red-50'; // Occupied and confirmed

          // Distinct style for Labs
          const isLab = room.type === 'LAB';
          const icon = isLab ? 'fa-flask' : (room.type === 'SEMINAR_HALL' ? 'fa-chalkboard-teacher' : 'fa-chair');

          return (
            <div key={room.id} className={`relative p-3 rounded-lg border-t-4 shadow-sm transition-all hover:shadow-md ${statusColor} flex flex-col h-36 justify-between`}>
              
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-700 text-sm truncate flex items-center">
                    <i className={`fas ${icon} text-xs mr-1 opacity-50`}></i>
                    {room.name}
                </h3>
                <div className={`h-2 w-2 rounded-full ${isCheckedIn ? 'bg-red-500' : (isOccupied ? 'bg-yellow-400 animate-pulse' : (isUpcoming ? 'bg-orange-400' : 'bg-green-400'))}`}></div>
              </div>
              
              {activeSession ? (
                <div className="mt-1 flex-1 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-gray-900 line-clamp-1" title={activeSession.subject}>{activeSession.subject}</p>
                  <p className="text-[10px] text-gray-600 truncate">{activeSession.teacherName}</p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {activeSession.startTime}-{activeSession.endTime}
                  </p>
                  
                  {isCheckedIn && (
                    <div className="mt-auto pt-2 flex items-center justify-between border-t border-red-100">
                       <span className="text-[10px] font-bold text-red-700"><i className="fas fa-users mr-1"></i>{activeSession.studentCount || 0} / {room.capacity}</span>
                    </div>
                  )}
                  
                  {isOccupied && !isCheckedIn && (
                     <div className="mt-auto pt-1 text-[10px] text-yellow-700 font-medium">
                        Waiting for teacher...
                     </div>
                  )}

                  {isUpcoming && (
                      <div className="mt-auto pt-1 text-[10px] text-orange-700 font-medium">
                         Starts soon
                      </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-xs text-gray-400 italic">Available</span>
                </div>
              )}

              <div className="absolute bottom-1 right-2">
                <span className="text-[9px] text-gray-400 font-bold">{room.type.substring(0,3)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoomTracker;