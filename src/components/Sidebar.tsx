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

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    groupTitle: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    ]
  },
  {
    groupTitle: 'OPERATIONS & FLEET',
    items: [
      { id: 'orders', label: 'Orders & Dispatch', icon: ShoppingBag, hasSubmenu: true },
      { id: 'assign-orders', label: 'Assign Orders', icon: UserCheck },
      { id: 'delivery-boys', label: 'Delivery Fleet / Riders', icon: Bike },
      { id: 'order-tracking', label: 'Live GPS Tracking', icon: Compass },
      { id: 'delivery-history', label: 'Delivery History', icon: History },
    ]
  },
  {
    groupTitle: 'CATALOG & STORES',
    items: [
      { id: 'products', label: 'Products & Stock', icon: Package, hasSubmenu: true },
      { id: 'categories', label: 'Categories', icon: Tags },
      { id: 'customers', label: 'Customer Directory', icon: Users },
      { id: 'zones', label: 'Locations & Service Zones', icon: MapPin },
    ]
  },
  {
    groupTitle: 'FINANCE & ANALYTICS',
    items: [
      { id: 'payments-cod', label: 'Payments & COD', icon: CreditCard },
      { id: 'returns-cancelled', label: 'Returns & Cancellations', icon: RotateCcw },
      { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    ]
  },
  {
    groupTitle: 'ENGAGEMENT & PROMOS',
    items: [
      { id: 'notifications', label: 'Push Notifications', icon: Bell },
      { id: 'offers-coupons', label: 'Offers & Coupons', icon: TicketPercent },
    ]
  },
  {
    groupTitle: 'SYSTEM & ADMIN',
    items: [
      { id: 'settings', label: 'App Settings', icon: Settings },
      { id: 'users-roles', label: 'Users & Roles', icon: ShieldCheck },
      { id: 'audit-logs', label: 'Audit Logs', icon: FileSpreadsheet },
      { id: 'support', label: 'Help & Support', icon: HelpCircle },
    ]
  }
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#06241a] text-gray-200 flex flex-col border-r border-[#0d4231] shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#0f4735]/70 shrink-0 bg-[#041a13]/60">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setActiveTab('dashboard'); onClose(); }}>
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-950/50 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-none">
                Haribansho
              </h1>
              <p className="text-[11px] text-emerald-400 font-medium tracking-wide mt-1">
                Quick Commerce Ops
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-emerald-900/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Item List */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest">
                {group.groupTitle}
              </div>

              {group.items.map((item) => {
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
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/40'
                        : 'text-gray-300 hover:text-white hover:bg-[#0c3a2b]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-emerald-400'
                        }`}
                      />
                      <span className="truncate tracking-tight">{item.label}</span>
                    </div>

                    {item.hasSubmenu && (
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                          isActive ? 'text-white rotate-90' : 'text-emerald-500/60 group-hover:text-emerald-300'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom App/Version Footer Card */}
        <div className="p-3.5 border-t border-[#0f4735]/70 shrink-0 bg-[#041a13]/60">
          <div className="bg-[#0b3829] border border-[#165a42]/80 rounded-xl p-3 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Leaf className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                Haribansho Delivery
              </div>
              <div className="text-[10px] text-emerald-300/80 font-mono mt-0.5">
                Version 1.2.0 • Active
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
