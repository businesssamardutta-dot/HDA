import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Calendar, 
  Bell, 
  Maximize2, 
  Minimize2, 
  ChevronDown, 
  Database, 
  User, 
  LogOut, 
  Settings, 
  CheckCircle2,
  RefreshCw,
  X
} from 'lucide-react';
import { AppNotification } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

interface HeaderProps {
  toggleSidebar: () => void;
  unreadCount: number;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onOpenSupabaseModal: () => void;
  onOpenSettings: () => void;
  onSearchClick: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  toggleSidebar,
  unreadCount,
  notifications,
  onOpenNotifications,
  onOpenSupabaseModal,
  onOpenSettings,
  onSearchClick,
  onResetData,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 md:px-6 py-2.5 flex items-center justify-between shadow-xs">
      {/* Left section: Hamburger & Search */}
      <div className="flex items-center space-x-3 md:space-x-4 flex-1 max-w-xl">
        <button
          id="btn-sidebar-toggle"
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div 
          onClick={onSearchClick}
          className="flex-1 flex items-center bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-full px-4 py-2 text-sm text-gray-500 cursor-pointer transition-all shadow-2xs"
        >
          <Search className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
          <span className="truncate text-xs md:text-sm">Search orders, customers, delivery boys...</span>
          <span className="hidden sm:inline-block ml-auto text-[10px] bg-white border border-gray-200 text-gray-400 font-mono px-1.5 py-0.5 rounded shadow-2xs">
            ⌘K
          </span>
        </div>
      </div>

      {/* Right section: Actions & Profile */}
      <div className="flex items-center space-x-2 md:space-x-3 ml-3">
        {/* Date display pill */}
        <div className="hidden lg:flex items-center space-x-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700">
          <Calendar className="w-3.5 h-3.5 text-gray-500" />
          <span>17 May 2025</span>
        </div>

        {/* Supabase Status Pill */}
        <button
          id="btn-supabase-status"
          onClick={onOpenSupabaseModal}
          className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            isSupabaseConfigured
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
          }`}
          title="Supabase PostgreSQL Integration & Schema Status"
        >
          <Database className="w-3.5 h-3.5" />
          <span>{isSupabaseConfigured ? 'Supabase Live' : 'Supabase Ready (01_*)'}</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            id="btn-notification-bell"
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '12' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Quick Dropdown */}
          {showNotificationDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <span className="font-semibold text-sm text-gray-800">Notifications</span>
                <button
                  onClick={onOpenNotifications}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  View All
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {notifications.slice(0, 4).map((n) => (
                  <div key={n.id} className="p-3 hover:bg-gray-50 transition-colors">
                    <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-gray-400 mt-1 inline-block">Just now</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <button
          id="btn-fullscreen-toggle"
          onClick={toggleFullscreen}
          className="hidden sm:flex p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            id="btn-user-profile"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center space-x-2 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Super Admin"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200"
            />
            <div className="hidden md:block text-left text-xs leading-tight">
              <div className="font-semibold text-gray-900">Super Admin</div>
              <div className="text-[11px] text-gray-500">Super User</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-900">Super Admin</p>
                <p className="text-[11px] text-gray-500 truncate">admin@haribansho.com</p>
              </div>

              <button
                onClick={() => { setShowProfileDropdown(false); onOpenSupabaseModal(); }}
                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Supabase SQL & Schema</span>
              </button>

              <button
                onClick={() => { setShowProfileDropdown(false); onOpenSettings(); }}
                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Settings className="w-4 h-4 text-gray-500" />
                <span>App Settings</span>
              </button>

              <button
                onClick={() => { 
                  setShowProfileDropdown(false); 
                  if (confirm('Reset demo state to initial reference defaults?')) {
                    onResetData();
                  }
                }}
                className="w-full text-left px-4 py-2 text-xs text-amber-700 hover:bg-amber-50 flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4 text-amber-600" />
                <span>Reset Database State</span>
              </button>

              <div className="border-t border-gray-100 my-1"></div>

              <div className="px-4 py-1.5 text-[10px] text-gray-400">
                Haribansho Delivery v1.0.0
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
