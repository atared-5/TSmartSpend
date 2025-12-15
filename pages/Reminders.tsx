import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Clock, Smartphone, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Reminders: React.FC = () => {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState('21:00');
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );

  useEffect(() => {
    const settings = localStorage.getItem('smartspend_reminder_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      setEnabled(parsed.enabled);
      setTime(parsed.time || '21:00');
    }
  }, []);

  const saveSettings = (newEnabled: boolean, newTime: string) => {
    setEnabled(newEnabled);
    setTime(newTime);
    localStorage.setItem('smartspend_reminder_settings', JSON.stringify({
      enabled: newEnabled,
      time: newTime
    }));
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
        alert("This browser does not support notifications.");
        return;
    }
    
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      new Notification("Notifications Enabled", {
        body: "You will receive daily reminders at " + time,
        icon: '/vite.svg'
      });
      // Ensure we save enabled state if it wasn't already
      if (!enabled) saveSettings(true, time);
    }
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    if (isChecked && permission !== 'granted') {
        requestPermission();
    }
    saveSettings(isChecked, time);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
       <header className="bg-white p-4 sticky top-0 z-10 border-b border-slate-100 flex items-center gap-2">
         <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full">
            <ArrowLeft className="w-6 h-6" />
         </button>
         <h1 className="text-xl font-bold text-slate-900">Reminders</h1>
       </header>

       <div className="p-4 space-y-6">
          {/* Main Toggle */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
                      <Bell className="w-6 h-6" />
                   </div>
                   <div>
                      <h2 className="font-bold text-slate-900">Daily Reminder</h2>
                      <p className="text-xs text-slate-500">Get notified to log your spending</p>
                   </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={enabled}
                    onChange={handleToggle}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
             </div>

             {enabled && (
                 <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Reminder Time</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="time" 
                            value={time}
                            onChange={(e) => saveSettings(enabled, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 font-bold text-slate-900 outline-none focus:ring-2 ring-indigo-500"
                        />
                    </div>
                 </div>
             )}
          </div>

          {/* Permissions Warning */}
          {enabled && permission !== 'granted' && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                      <p className="text-sm font-bold text-amber-800">Notifications Blocked</p>
                      <p className="text-xs text-amber-700 mt-1">Please enable notifications in your browser settings to receive reminders.</p>
                      <button onClick={requestPermission} className="mt-2 text-xs bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg font-bold">Enable Now</button>
                  </div>
              </div>
          )}

          {/* Mobile Info */}
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
              <h3 className="flex items-center gap-2 font-bold text-blue-900 mb-3">
                  <Smartphone className="w-5 h-5" /> Mobile Setup
              </h3>
              <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-blue-800">
                      <span className="bg-blue-200 text-blue-800 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">1</span>
                      <span>For <strong>iOS (iPhone)</strong>, tap "Share" <span className="inline-block align-middle"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></span> and select "Add to Home Screen". Notifications only work when the app is installed.</span>
                  </li>
                  <li className="flex gap-3 text-sm text-blue-800">
                      <span className="bg-blue-200 text-blue-800 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">2</span>
                      <span>For <strong>Android</strong>, ensure notifications are allowed for this site in Chrome settings.</span>
                  </li>
              </ul>
          </div>
       </div>
    </div>
  );
};
