import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        <AnimatePresence>
          {notifications.map(({ id, message, type }) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto p-4 rounded-xl shadow-xl flex items-start gap-3 border backdrop-blur-md ${
                type === 'success'
                  ? 'bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700/60'
                  : type === 'error'
                  ? 'bg-rose-50/95 dark:bg-rose-950/90 text-rose-900 dark:text-rose-100 border-rose-300 dark:border-rose-700/60'
                  : type === 'warning'
                  ? 'bg-amber-50/95 dark:bg-amber-950/90 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700/60'
                  : 'bg-sky-50/95 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 border-sky-300 dark:border-slate-700/60'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {type === 'error' && <XCircle className="w-5 h-5 text-rose-500" />}
                {type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {type === 'info' && <Info className="w-5 h-5 text-sky-500" />}
              </div>
              <div className="flex-1 text-sm font-medium leading-relaxed">
                {message}
              </div>
              <button
                onClick={() => removeNotification(id)}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4 opacity-70 hover:opacity-100" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
