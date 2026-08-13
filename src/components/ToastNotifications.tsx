import React from 'react';
import { ToastNotification } from '../types';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastNotificationsProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastNotifications: React.FC<ToastNotificationsProps> = ({
  notifications,
  onDismiss,
}) => {
  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="pointer-events-auto p-3.5 bg-[#12131C]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex items-start gap-3 relative overflow-hidden"
          >
            {/* Left Accent Bar */}
            <div className={`w-1 absolute left-0 top-0 bottom-0 ${
              n.type === 'success' ? 'bg-emerald-400' :
              n.type === 'warning' ? 'bg-amber-400' :
              n.type === 'alert' ? 'bg-rose-500' : 'bg-purple-500'
            }`} />

            <div className="shrink-0 mt-0.5">
              {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {n.type === 'alert' && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {(!n.type || n.type === 'info') && <Info className="w-4 h-4 text-purple-400" />}
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="text-xs font-bold text-white leading-snug">{n.title}</div>
              <div className="text-[11px] text-gray-300 leading-relaxed mt-0.5 break-words">{n.message}</div>
              <div className="text-[9px] text-gray-500 font-mono mt-1">{n.time}</div>
            </div>

            <button
              onClick={() => onDismiss(n.id)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
