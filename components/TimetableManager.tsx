import React, { useState } from 'react';
import { parseTimetableImage } from '../services/geminiService';
import { Session, Room, User } from '../types';
import { api } from '../services/mockBackend';

interface TimetableManagerProps {
  currentUser: User;
  onUpdate: () => void;
}

const TimetableManager: React.FC<TimetableManagerProps> = ({ currentUser, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    setStatusMsg('Processing image with Gemini AI...');

    try {
      // Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Content = base64data.split(',')[1]; // Remove data:image/png;base64 prefix

        const extractedData = await parseTimetableImage(base64Content);
        
        if (extractedData.length > 0) {
            setStatusMsg(`Found ${extractedData.length} sessions. Mapping to system...`);
            
            // Fetch current rooms and users to map names to IDs
            const rooms = await api.getRooms();
            
            // Map extracted data to Session objects
            const newSessions: Session[] = extractedData.map((item, index) => {
                // Simple heuristic mapping
                const room = rooms.find(r => r.name.toLowerCase().includes(item.roomName.toLowerCase())) || rooms[0];
                
                return {
                    id: `auto-${Date.now()}-${index}`,
                    day: item.day,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    subject: item.subject,
                    roomId: room.id,
                    teacherId: currentUser.id, // Assigning to uploader for demo, usually logic would match teacher name
                    teacherName: item.teacherName || currentUser.name,
                    checkedIn: false
                };
            });

            await api.addSessions(newSessions);
            setStatusMsg('Timetable updated successfully!');
            onUpdate();
        } else {
            setStatusMsg('Could not extract valid session data. Please ensure image is clear.');
        }
        setUploading(false);
      };
    } catch (error) {
      console.error(error);
      setStatusMsg('Error processing timetable.');
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Update Timetable (AI Powered)</h2>
      <p className="text-gray-600 mb-4 text-sm">
        Upload a photo of the class schedule. The system will automatically detect sessions, rooms, and times to populate the calendar.
        <br/><span className="text-xs text-gray-400">Updates required once every 3 months.</span>
      </p>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
        <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden" 
            id="timetable-upload"
            disabled={uploading}
        />
        <label htmlFor="timetable-upload" className="cursor-pointer flex flex-col items-center">
             {previewUrl ? (
                 <img src={previewUrl} alt="Preview" className="h-32 object-contain mb-4 rounded" />
             ) : (
                <i className="fas fa-cloud-upload-alt text-4xl text-brand-500 mb-3"></i>
             )}
            <span className="text-brand-600 font-medium">Click to upload timetable image</span>
            <span className="text-gray-400 text-xs mt-1">Supports PNG, JPG</span>
        </label>
      </div>

      {statusMsg && (
        <div className={`mt-4 p-3 rounded text-sm ${statusMsg.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
            {uploading && <i className="fas fa-spinner fa-spin mr-2"></i>}
            {statusMsg}
        </div>
      )}
    </div>
  );
};

export default TimetableManager;