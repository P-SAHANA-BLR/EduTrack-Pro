import React, { useEffect, useState } from 'react';
import { Alert, User } from '../types';
import { api } from '../services/mockBackend';

interface AlertSystemProps {
  user: User;
}

const AlertSystem: React.FC<AlertSystemProps> = ({ user }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const fetchAlerts = async () => {
    const data = await api.getAlertsForUser(user.id);
    // sort by newest
    setAlerts(data.sort((a, b) => b.timestamp - a.timestamp));
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [user.id]);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 flex flex-col gap-2">
      {alerts.slice(0, 3).map(alert => (
        <div key={alert.id} className={`p-4 rounded-lg shadow-lg border-l-4 animate-bounce-in bg-white ${alert.type === 'CRITICAL' ? 'border-red-500' : 'border-blue-500'}`}>
            <div className="flex justify-between items-start">
                <h4 className={`font-bold text-sm ${alert.type === 'CRITICAL' ? 'text-red-600' : 'text-blue-600'}`}>
                    {alert.type === 'CRITICAL' ? 'Missing Teacher Alert' : 'Notification'}
                </h4>
                <span className="text-[10px] text-gray-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
            </div>
            <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
        </div>
      ))}
    </div>
  );
};

export default AlertSystem;