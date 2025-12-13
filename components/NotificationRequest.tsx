import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

export const NotificationRequest: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      setVisible(true);
    }
  }, []);

  const enableNotifications = () => {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        setVisible(false);
        new Notification("Notifications Enabled", {
          body: "We will remind you at 9 PM to log your daily spending!",
        });
      }
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-indigo-600 text-white p-4 rounded-lg shadow-lg flex items-center justify-between z-50">
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5" />
        <span className="text-sm font-medium">Enable reminders for 9 PM daily reports?</span>
      </div>
      <button 
        onClick={enableNotifications}
        className="bg-white text-indigo-600 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
      >
        Allow
      </button>
    </div>
  );
};
