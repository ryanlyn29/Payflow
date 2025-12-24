import React, { createContext, useContext, useState, useCallback } from 'react';
import { Icons } from './Icons';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notif-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000,
    };

    setNotifications(prev => [...prev, newNotification]);

    if (newNotification.duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, newNotification.duration);
    }
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-24 right-6 z-[200] space-y-2 pointer-events-none">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className="pointer-events-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-4 min-w-[300px] max-w-md animate-in slide-in-from-right duration-300"
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                notif.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                notif.type === 'error' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' :
                notif.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' :
                'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
              }`}>
                {notif.type === 'success' && <Icons.Success size={18} />}
                {notif.type === 'error' && <Icons.Error size={18} />}
                {notif.type === 'warning' && <Icons.Warning size={18} />}
                {notif.type === 'info' && <Icons.Info size={18} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{notif.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notif.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Icons.X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};

