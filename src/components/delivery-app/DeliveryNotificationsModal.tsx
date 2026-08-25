import React from 'react';
import { X, Bell, CheckCircle2, Clock, Package, AlertCircle } from 'lucide-react';
import { AppNotification, Order } from '../../types';

interface DeliveryNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  orders: Order[];
  onSelectOrderById?: (orderId: string) => void;
}

export const DeliveryNotificationsModal: React.FC<DeliveryNotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  orders,
  onSelectOrderById
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-end sm:items-center">
      <div className="bg-slate-900 border border-emerald-500/20 text-white w-full sm:max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Notifications & Alerts</h3>
              <p className="text-[11px] text-slate-400">Order assignments & dispatch updates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (notif.entity_id && onSelectOrderById) {
                    onSelectOrderById(notif.entity_id);
                    onClose();
                  }
                }}
                className="p-3 bg-slate-950/70 border border-slate-800 hover:border-emerald-500/30 rounded-2xl transition-all cursor-pointer space-y-1"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold text-xs text-white">{notif.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                  {notif.message}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">No new notifications</p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
