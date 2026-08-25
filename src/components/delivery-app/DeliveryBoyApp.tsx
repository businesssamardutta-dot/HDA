import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bike, 
  Home, 
  ShoppingBag, 
  MapPin, 
  User, 
  Bell, 
  Power, 
  ArrowLeft, 
  Smartphone, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  RefreshCw,
  Volume2
} from 'lucide-react';
import { DeliveryBoy, Order, AppNotification } from '../../types';
import { dbService } from '../../services/dbService';
import { DeliveryLoginView } from './DeliveryLoginView';
import { DeliveryHomeView } from './DeliveryHomeView';
import { DeliveryOrdersView } from './DeliveryOrdersView';
import { DeliveryDetailView } from './DeliveryDetailView';
import { DeliveryTrackingView } from './DeliveryTrackingView';
import { DeliveryProfileView } from './DeliveryProfileView';
import { DeliveryNotificationsModal } from './DeliveryNotificationsModal';

interface DeliveryBoyAppProps {
  onBackToAdmin?: () => void;
  isEmbedded?: boolean;
  standalone?: boolean;
}

export const DeliveryBoyApp: React.FC<DeliveryBoyAppProps> = ({
  onBackToAdmin,
  isEmbedded = false,
  standalone = false
}) => {
  // Authentication State
  const [currentRider, setCurrentRider] = useState<DeliveryBoy | null>(() => {
    const cached = localStorage.getItem('haribansho_delivery_rider');
    return cached ? JSON.parse(cached) : null;
  });

  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'tracking' | 'profile'>('home');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);

  // Sync session to localStorage
  useEffect(() => {
    if (currentRider) {
      localStorage.setItem('haribansho_delivery_rider', JSON.stringify(currentRider));
    } else {
      localStorage.removeItem('haribansho_delivery_rider');
    }
  }, [currentRider]);

  // Load orders strictly assigned to this rider
  const loadRiderOrders = useCallback(async (isSilent = false) => {
    if (!currentRider?.id) return;
    if (!isSilent) setIsLoading(true);

    try {
      const riderOrders = await dbService.getAssignedOrdersForDeliveryBoy(currentRider.id);
      
      // Check if a new assigned order arrived
      if (orders.length > 0 && riderOrders.length > orders.length) {
        const diff = riderOrders.find(ro => !orders.some(o => o.id === ro.id));
        if (diff) {
          setNewOrderAlert(`New Order #${diff.order_number || diff.id.slice(0, 8)} Assigned!`);
          setTimeout(() => setNewOrderAlert(null), 5000);
        }
      }

      setOrders(riderOrders);

      // Also refresh rider profile stats
      const updatedRider = await dbService.getDeliveryBoyById(currentRider.id);
      if (updatedRider) {
        setCurrentRider(updatedRider);
      }
    } catch (e) {
      console.error('Error loading rider orders:', e);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [currentRider?.id, orders]);

  // Initial load
  useEffect(() => {
    if (currentRider) {
      loadRiderOrders();
    }
  }, [currentRider?.id]);

  // Realtime Supabase Subscription
  useEffect(() => {
    if (!currentRider?.id) return;

    const unsubscribe = dbService.subscribeToDeliveryBoyRealtime(currentRider.id, () => {
      console.log('⚡ Realtime event received for delivery boy, reloading orders...');
      loadRiderOrders(true);
    });

    // Also poll every 12 seconds as backup
    const interval = setInterval(() => {
      loadRiderOrders(true);
    }, 12000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [currentRider?.id, loadRiderOrders]);

  // Login handler
  const handleLoginSuccess = (boy: DeliveryBoy) => {
    setCurrentRider(boy);
    setActiveTab('home');
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentRider(null);
    setOrders([]);
    setActiveTab('home');
    setSelectedOrderForDetail(null);
  };

  // Availability Toggle
  const handleToggleOnline = async () => {
    if (!currentRider) return;
    const newStatus = (currentRider.availability_status === 'Available' || currentRider.availability_status === 'Busy')
      ? 'Offline'
      : 'Available';

    const updated = await dbService.updateDeliveryBoyStatus(currentRider.id, newStatus);
    if (updated) {
      setCurrentRider(updated);
    } else {
      setCurrentRider({ ...currentRider, availability_status: newStatus });
    }
  };

  // Quick Accept Order from Home or List
  const handleAcceptOrder = async (orderId: string) => {
    if (!currentRider) return;
    try {
      await dbService.acceptDeliveryAssignment(orderId, currentRider.id);
      loadRiderOrders(true);
    } catch (e) {
      console.error('Error accepting order:', e);
    }
  };

  // Badges calculations
  const pendingAssignedCount = orders.filter(o => o.order_status === 'Assigned' && o.assignment_status !== 'Accepted').length;
  const inProgressCount = orders.filter(o => o.order_status === 'Out for Delivery' || o.assignment_status === 'Accepted').length;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 relative">
      
      {/* Android Device Shell Container */}
      <div className={`w-full ${isEmbedded ? 'max-w-md h-full' : 'max-w-md h-[100dvh] sm:h-[880px] sm:max-h-[92vh]'} flex flex-col bg-slate-950 sm:border-4 sm:border-slate-800 sm:rounded-[40px] shadow-2xl overflow-hidden relative`}>
        
        {/* Top Android Status Bar */}
        <div className="pt-2 px-5 pb-1 flex justify-between items-center text-[11px] text-slate-400 font-mono tracking-wider bg-slate-950 z-30 shrink-0 select-none">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          
          {/* Camera Notch */}
          <div className="w-24 h-4 bg-slate-900 rounded-full flex items-center justify-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-700" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
          </div>

          <div className="flex items-center space-x-1.5">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* New Order Alert Banner */}
        {newOrderAlert && (
          <div className="bg-linear-to-r from-emerald-500 to-teal-400 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-lg z-40 animate-in slide-in-from-top">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>{newOrderAlert}</span>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="bg-slate-950 text-emerald-300 px-2 py-0.5 rounded-lg text-[10px]"
            >
              View
            </button>
          </div>
        )}

        {/* App Main Header (when logged in) */}
        {currentRider && (
          <header className="px-4 py-3 bg-slate-950 border-b border-slate-900 flex justify-between items-center z-20 shrink-0">
            <div className="flex items-center space-x-2.5">
              {onBackToAdmin && (
                <button
                  onClick={onBackToAdmin}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Switch to Admin Web App"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-linear-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold">
                  <Bike className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="font-bold text-xs text-white leading-none">Haribansho Rider</h2>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {currentRider.employee_code || 'DB-0834'}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => loadRiderOrders(false)}
                disabled={isLoading}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                title="Refresh orders from Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>

              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                {pendingAssignedCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>
            </div>
          </header>
        )}

        {/* Scrollable Main Screen Container */}
        <div className="flex-1 overflow-y-auto relative bg-slate-950">
          {!currentRider ? (
            <DeliveryLoginView onLoginSuccess={handleLoginSuccess} />
          ) : (
            <>
              {activeTab === 'home' && (
                <DeliveryHomeView
                  rider={currentRider}
                  orders={orders}
                  onSelectOrder={(ord) => setSelectedOrderForDetail(ord)}
                  onToggleOnline={handleToggleOnline}
                  onAcceptOrder={handleAcceptOrder}
                  onNavigateToTab={(tab) => setActiveTab(tab as any)}
                />
              )}

              {activeTab === 'orders' && (
                <DeliveryOrdersView
                  orders={orders}
                  rider={currentRider}
                  onSelectOrder={(ord) => setSelectedOrderForDetail(ord)}
                  onAcceptOrder={handleAcceptOrder}
                />
              )}

              {activeTab === 'tracking' && (
                <DeliveryTrackingView
                  orders={orders}
                  rider={currentRider}
                  onSelectOrder={(ord) => setSelectedOrderForDetail(ord)}
                />
              )}

              {activeTab === 'profile' && (
                <DeliveryProfileView
                  rider={currentRider}
                  orders={orders}
                  onLogout={handleLogout}
                  onToggleOnline={handleToggleOnline}
                />
              )}
            </>
          )}
        </div>

        {/* Bottom Android Navigation Bar (when logged in) */}
        {currentRider && (
          <nav className="border-t border-slate-900 bg-slate-950/95 backdrop-blur-md px-3 py-2 flex justify-around items-center z-30 shrink-0">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'home' ? 'text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px]">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`relative flex flex-col items-center space-y-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'orders' ? 'text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {pendingAssignedCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center px-1">
                    {pendingAssignedCount}
                  </span>
                )}
              </div>
              <span className="text-[10px]">Orders</span>
            </button>

            <button
              onClick={() => setActiveTab('tracking')}
              className={`relative flex flex-col items-center space-y-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'tracking' ? 'text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <MapPin className="w-5 h-5" />
                {inProgressCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                )}
              </div>
              <span className="text-[10px]">Live Route</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'profile' ? 'text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px]">Profile</span>
            </button>
          </nav>
        )}

        {/* Android Home Bar Indicator */}
        <div className="h-1 bg-slate-950 flex justify-center pb-2 pt-1 shrink-0">
          <div className="w-32 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Order Step-by-Step Delivery Action Modal */}
        {selectedOrderForDetail && currentRider && (
          <DeliveryDetailView
            order={selectedOrderForDetail}
            rider={currentRider}
            onClose={() => setSelectedOrderForDetail(null)}
            onStatusUpdated={() => {
              loadRiderOrders(true);
            }}
          />
        )}

        {/* Notifications Modal */}
        <DeliveryNotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          orders={orders}
          onSelectOrderById={(orderId) => {
            const found = orders.find(o => o.id === orderId);
            if (found) setSelectedOrderForDetail(found);
          }}
        />
      </div>
    </div>
  );
};
