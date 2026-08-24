import React, { useState, useMemo } from 'react';
import {
  Bell,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Trash2,
  CheckCheck,
  RefreshCw,
  Sparkles,
  Users,
  Bike,
  UserCheck,
  Tag,
  ExternalLink,
  Info,
  X,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { AppNotification, User, Customer, DeliveryBoy } from '../../types';
import { dbService } from '../../services/dbService';

interface NotificationsViewProps {
  notifications: AppNotification[];
  users?: User[];
  customers?: Customer[];
  deliveryBoys?: DeliveryBoy[];
  onRefresh: () => void;
  onSendNotification?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  users = [],
  customers = [],
  deliveryBoys = [],
  onRefresh,
  onSendNotification
}) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [readStatusFilter, setReadStatusFilter] = useState<'All' | 'Unread' | 'Read'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Form State for Dispatching Notification
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<'Order' | 'Delivery' | 'System' | 'Promotion' | 'Alert' | 'General'>('System');
  const [recipientType, setRecipientType] = useState<'all' | 'customers' | 'delivery_boys' | 'specific_role' | 'specific_user'>('all');
  const [targetRoleId, setTargetRoleId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [sendSuccessMessage, setSendSuccessMessage] = useState('');

  // -------------------------------------------------------------
  // FILTERING LOGIC
  // -------------------------------------------------------------
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'All' || n.notification_type === filterType;

      const matchesRead =
        readStatusFilter === 'All' ||
        (readStatusFilter === 'Unread' && !n.is_read) ||
        (readStatusFilter === 'Read' && n.is_read);

      return matchesSearch && matchesType && matchesRead;
    });
  }, [notifications, searchQuery, filterType, readStatusFilter]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  // -------------------------------------------------------------
  // ACTIONS
  // -------------------------------------------------------------
  const handleMarkAsRead = async (id: string) => {
    try {
      await dbService.markNotificationRead(id);
      onRefresh();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dbService.markAllNotificationsRead();
      onRefresh();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification record?')) return;
    try {
      await dbService.deleteNotification(id);
      if (selectedNotification?.id === id) {
        setSelectedNotification(null);
      }
      onRefresh();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) {
      alert('Please enter both title and message.');
      return;
    }

    setIsSending(true);
    try {
      let recipientCount = 0;
      if (recipientType === 'all') recipientCount = (users.length || 1) + (customers.length || 1) + (deliveryBoys.length || 1);
      else if (recipientType === 'customers') recipientCount = customers.length || 1;
      else if (recipientType === 'delivery_boys') recipientCount = deliveryBoys.length || 1;
      else recipientCount = 1;

      let mappedRecipientType: any = 'All Users';
      if (recipientType === 'customers') mappedRecipientType = 'Customers';
      else if (recipientType === 'delivery_boys') mappedRecipientType = 'Delivery Boys';
      else if (recipientType === 'specific_user') mappedRecipientType = 'Specific Delivery Boy';

      await dbService.sendNotification({
        title: newTitle.trim(),
        message: newMessage.trim(),
        notification_type: newType as any,
        recipient_type: mappedRecipientType,
        recipient_id: targetUserId || targetRoleId || undefined,
        is_read: false
      });

      setSendSuccessMessage(`Successfully broadcasted notification to ${recipientCount} recipients!`);
      setTimeout(() => {
        setSendSuccessMessage('');
        setIsSendModalOpen(false);
        setNewTitle('');
        setNewMessage('');
        setActionUrl('');
        onRefresh();
      }, 1200);
    } catch (err) {
      console.error('Failed to broadcast notification:', err);
      alert('Failed to send notification. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async (notification: AppNotification) => {
    try {
      await dbService.sendNotification({
        title: `[Resent] ${notification.title}`,
        message: notification.message,
        notification_type: notification.notification_type,
        recipient_type: notification.recipient_type || 'All Users',
        is_read: false
      });
      alert('Notification resent successfully!');
      onRefresh();
    } catch (err) {
      console.error('Failed to resend notification:', err);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Notification Center</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">Live operational alerts, push notifications, and courier broadcasts</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center space-x-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-gray-500" />
              <span>Mark All Read</span>
            </button>
          )}

          <button
            onClick={() => setIsSendModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>+ Send Notification</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notifications by title or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 text-xs">
            <button
              onClick={() => setReadStatusFilter('All')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                readStatusFilter === 'All' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setReadStatusFilter('Unread')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                readStatusFilter === 'Unread' ? 'bg-white text-purple-700 shadow-2xs' : 'text-gray-500'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setReadStatusFilter('Read')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                readStatusFilter === 'Read' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-gray-500'
              }`}
            >
              Read
            </button>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
          >
            <option value="All">All Types</option>
            <option value="System">System Alerts</option>
            <option value="Order">Order Updates</option>
            <option value="Delivery">Delivery & Fleet</option>
            <option value="Promotion">Promotions</option>
            <option value="Alert">Critical Alerts</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-600">No notifications found</p>
            <p className="text-gray-400 mt-1">Try resetting your search query or filters</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const isUnread = !notification.is_read;
            return (
              <div
                key={notification.id}
                className={`p-4 transition-all flex items-start justify-between gap-4 ${
                  isUnread ? 'bg-purple-50/30 hover:bg-purple-50/50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      notification.notification_type === 'Alert'
                        ? 'bg-rose-100 text-rose-700'
                        : notification.notification_type === 'Order'
                        ? 'bg-blue-100 text-blue-700'
                        : notification.notification_type === 'Delivery'
                        ? 'bg-emerald-100 text-emerald-700'
                        : notification.notification_type === 'Promotion'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`text-sm ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                        {notification.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                        {notification.notification_type}
                      </span>
                      {notification.recipient_type && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700">
                          To: {notification.recipient_type.replace('_', ' ')}
                        </span>
                      )}
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                      )}
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">
                      {notification.message}
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] text-gray-400 pt-1">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(notification.created_at).toLocaleString()}</span>
                      </span>
                      {notification.recipient_type && (
                        <span>• Target: {notification.recipient_type}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center space-x-1 shrink-0">
                  {isUnread && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      title="Mark as Read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleResend(notification)}
                    className="p-1.5 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="Resend Notification"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SEND NOTIFICATION MODAL */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-gray-900">Broadcast Notification</h3>
              </div>
              <button
                onClick={() => setIsSendModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sendSuccessMessage ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-800 text-sm">Dispatched Successfully</h4>
                <p className="text-xs text-gray-600">{sendSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleSendNotification} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Notification Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flash Delivery Offer or System Scheduled Maintenance"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Message Content *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide full description of the alert, coupon, or update..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Notification Category</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="System">System Alert</option>
                      <option value="Order">Order Update</option>
                      <option value="Delivery">Delivery Fleet</option>
                      <option value="Promotion">Promotional Campaign</option>
                      <option value="Alert">High Priority Warning</option>
                      <option value="General">General Announcement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Recipient Target</label>
                    <select
                      value={recipientType}
                      onChange={(e) => setRecipientType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="all">All Users & Fleet ({users.length + customers.length + deliveryBoys.length})</option>
                      <option value="customers">All Customers Only ({customers.length})</option>
                      <option value="delivery_boys">All Delivery Boys ({deliveryBoys.length})</option>
                      <option value="specific_role">Specific Role</option>
                    </select>
                  </div>
                </div>

                {recipientType === 'specific_role' && (
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Select Target Role</label>
                    <select
                      value={targetRoleId}
                      onChange={(e) => setTargetRoleId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="dispatcher">Dispatch Officers</option>
                      <option value="operations_manager">Operations Managers</option>
                      <option value="super_admin">Super Admins</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Action Link / Deep Link (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. /orders, /offers, https://..."
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Preview Box */}
                {newTitle && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Live Preview</span>
                    <div className="font-bold text-gray-900">{newTitle}</div>
                    <div className="text-gray-600">{newMessage || 'Message preview will appear here...'}</div>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsSendModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? 'Broadcasting...' : 'Broadcast Now'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
