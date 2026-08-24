import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  UserCheck,
  Bike,
  Users,
  Package,
  Tags,
  MapPin,
  Truck,
  Compass,
  History,
  CreditCard,
  RotateCcw,
  BarChart3,
  Bell,
  TicketPercent,
  Settings,
  ShieldCheck,
  FileSpreadsheet,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Leaf,
  Layers,
  X
} from 'lucide-react';

export type NavTabId =
  | 'dashboard'
  | 'orders'
  | 'assign-orders'
  | 'delivery-boys'
  | 'customers'
  | 'products'
  | 'categories'
  | 'zones'
  | 'order-tracking'
  | 'delivery-history'
  | 'payments-cod'
  | 'returns-cancelled'
  | 'reports'
  | 'notifications'
  | 'offers-coupons'
  | 'settings'
  | 'users-roles'
  | 'audit-logs'
  | 'support';

interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hasSubmenu?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, hasSubmenu: true },
  { id: 'assign-orders', label: 'Assign Orders', icon: UserCheck },
  { id: 'delivery-boys', label: 'Delivery Boys', icon: Bike },
  { id: 'customers', label: 'Customers', icon: Users, hasSubmenu: true },
  { id: 'products', label: 'Products', icon: Package, hasSubmenu: true },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'zones', label: 'Locations / Zones', icon: MapPin },
  { id: 'order-tracking', label: 'Order Tracking', icon: Compass, hasSubmenu: true },
  { id: 'delivery-history', label: 'Delivery History', icon: History, hasSubmenu: true },
  { id: 'payments-cod', label: 'Payments & COD', icon: CreditCard, hasSubmenu: true },
  { id: 'returns-cancelled', label: 'Returns / Cancelled', icon: RotateCcw, hasSubmenu: true },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, hasSubmenu: true },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'offers-coupons', label: 'Offers & Coupons', icon: TicketPercent },
  { id: 'settings', label: 'Settings', icon: Settings, hasSubmenu: true },
  { id: 'users-roles', label: 'Users & Roles', icon: ShieldCheck },
  { id: 'audit-logs', label: 'Audit Logs', icon: FileSpreadsheet },
  { id: 'support', label: 'Support / Help', icon: HelpCircle },
];

interface SidebarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      <aside
        id="sidebar-navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-gradient-to-b from-[#06241a] via-[#083022] to-[#041a13] text-gray-200 flex flex-col border-r border-[#0d4231] shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="px-5 py-4.5 flex items-center justify-between border-b border-[#0f4735]/60">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setActiveTab('dashboard'); onClose(); }}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-none">
                Haribansho
              </h1>
              <p className="text-[11px] text-emerald-300/80 font-medium tracking-wide mt-1">
                Delivery App
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Item List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-[#15803d] text-white font-semibold shadow-md shadow-emerald-950/40'
                    : 'text-gray-300 hover:text-white hover:bg-[#0e3b2c]/70'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-emerald-400/90'
                    }`}
                  />
                  <span className="tracking-tight">{item.label}</span>
                </div>

                {item.hasSubmenu && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      isActive ? 'text-white/80 rotate-180' : 'text-gray-400 group-hover:text-gray-300'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom App/Version Card matching reference image */}
        <div className="p-3.5 border-t border-[#0f4735]/60">
          <div className="bg-[#0b3829]/90 border border-[#165a42]/70 rounded-xl p-3 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Leaf className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                Haribansho Delivery App
              </div>
              <div className="text-[10px] text-emerald-300/70 font-mono mt-0.5">
                Version 1.0.0
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
