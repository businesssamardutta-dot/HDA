import React from 'react';
import { 
  Bike, 
  MapPin, 
  Phone, 
  Navigation, 
  Package, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Power, 
  DollarSign, 
  Star, 
  ShieldCheck, 
  AlertCircle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Banknote
} from 'lucide-react';
import { Order, DeliveryBoy } from '../../types';

interface DeliveryHomeViewProps {
  rider: DeliveryBoy;
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onToggleOnline: () => void;
  onAcceptOrder: (orderId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DeliveryHomeView: React.FC<DeliveryHomeViewProps> = ({
  rider,
  orders,
  onSelectOrder,
  onToggleOnline,
  onAcceptOrder,
  onNavigateToTab
}) => {
  const isOnline = rider.availability_status === 'Available' || rider.availability_status === 'Busy';

  const getCustomerDisplayName = (ord: Order) => {
    const name = ord.customer_name;
    if (!name || (rider?.full_name && name.trim().toLowerCase() === rider.full_name.trim().toLowerCase())) {
      return 'Customer';
    }
    return name;
  };
  
  // Calculate delivery metrics strictly for this rider
  const assignedOrders = orders.filter(o => o.order_status === 'Assigned' && o.assignment_status !== 'Accepted');
  const acceptedOrders = orders.filter(o => o.assignment_status === 'Accepted' && o.order_status !== 'Out for Delivery');
  const activeOrders = orders.filter(o => o.order_status === 'Out for Delivery');
  const deliveredOrders = orders.filter(o => o.order_status === 'Delivered');

  // Calculate today's COD cash collected
  const todayCodCash = deliveredOrders
    .filter(o => o.payment_method === 'COD')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const pendingDeliveriesCount = assignedOrders.length + acceptedOrders.length + activeOrders.length;

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* 1. Rider Profile Card & Availability Toggle */}
      <div className="bg-slate-900/90 border border-emerald-500/20 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-bold text-emerald-300 text-lg">
                  {rider.full_name?.charAt(0) || 'D'}
                </div>
              </div>
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                isOnline ? 'bg-emerald-400' : 'bg-slate-500'
              }`} />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">{rider.full_name}</h3>
                <span className="text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  {rider.employee_code || 'DB-0834'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{rider.vehicle_info || 'Bike'}</span>
                <span>•</span>
                <span className="flex items-center text-amber-400 font-semibold gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400" /> {rider.rating || 4.9}
                </span>
              </p>
            </div>
          </div>

          {/* Go Online/Offline Toggle Button */}
          <button
            onClick={onToggleOnline}
            className={`px-3 py-2 rounded-2xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
              isOnline
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-emerald-500/10'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>
        </div>
      </div>

      {/* 2. Today's Delivery Overview Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Assigned */}
        <div 
          onClick={() => onNavigateToTab('orders')}
          className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 p-3 rounded-2xl cursor-pointer transition-all active:scale-[0.98]"
        >
          <div className="flex justify-between items-start mb-1">
            <span className="text-[11px] font-medium text-slate-400">Assigned</span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white">{assignedOrders.length}</p>
          <p className="text-[10px] text-blue-400 mt-0.5">Awaiting Acceptance</p>
        </div>

        {/* In Progress */}
        <div 
          onClick={() => onNavigateToTab('orders')}
          className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 p-3 rounded-2xl cursor-pointer transition-all active:scale-[0.98]"
        >
          <div className="flex justify-between items-start mb-1">
            <span className="text-[11px] font-medium text-slate-400">In Progress</span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Bike className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white">{activeOrders.length + acceptedOrders.length}</p>
          <p className="text-[10px] text-amber-400 mt-0.5">On Active Route</p>
        </div>

        {/* Delivered */}
        <div 
          onClick={() => onNavigateToTab('orders')}
          className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 p-3 rounded-2xl cursor-pointer transition-all active:scale-[0.98]"
        >
          <div className="flex justify-between items-start mb-1">
            <span className="text-[11px] font-medium text-slate-400">Delivered</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white">{deliveredOrders.length}</p>
          <p className="text-[10px] text-emerald-400 mt-0.5">Completed Today</p>
        </div>

        {/* COD Cash in Hand */}
        <div 
          onClick={() => onNavigateToTab('profile')}
          className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 p-3 rounded-2xl cursor-pointer transition-all active:scale-[0.98]"
        >
          <div className="flex justify-between items-start mb-1">
            <span className="text-[11px] font-medium text-slate-400">COD Cash</span>
            <div className="w-6 h-6 rounded-lg bg-teal-500/15 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-teal-300">₹{todayCodCash}</p>
          <p className="text-[10px] text-teal-400 mt-0.5">In Hand to Deposit</p>
        </div>
      </div>

      {/* 3. New Assigned Orders Section (Alert banner if new orders) */}
      {assignedOrders.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <h4 className="font-bold text-sm text-white">New Assigned Orders</h4>
            </div>
            <span className="text-xs font-bold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30">
              {assignedOrders.length} New
            </span>
          </div>

          <div className="space-y-2.5">
            {assignedOrders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-4 shadow-lg shadow-emerald-500/5 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-400">
                      Order #{order.order_number || order.id.slice(0, 8)}
                    </span>
                    <h5 className="font-bold text-white text-sm">{getCustomerDisplayName(order)}</h5>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-white">₹{order.total_amount}</span>
                    <p className="text-[10px] text-slate-400">{order.payment_method}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-xs text-slate-300 mb-3 bg-slate-950/50 p-2.5 rounded-xl">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{order.delivery_address_text || (order as any).delivery_address || 'Customer Address'}</span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => onAcceptOrder(order.id)}
                    className="flex-1 py-2.5 bg-linear-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Order</span>
                  </button>
                  <button
                    onClick={() => onSelectOrder(order)}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <span>Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Active Out for Delivery Card (if any) */}
      {activeOrders.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Bike className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>Active Delivery in Progress</span>
            </h4>
            <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Live Route
            </span>
          </div>

          {activeOrders.slice(0, 1).map((order) => (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="bg-linear-to-br from-slate-900 to-amber-950/40 border border-amber-500/40 rounded-2xl p-4 shadow-xl cursor-pointer hover:border-amber-400 transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Delivering To Customer</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                      Customer
                    </span>
                    <h5 className="font-bold text-white text-base">{getCustomerDisplayName(order)}</h5>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-white">₹{order.total_amount}</span>
                  <span className="block text-[10px] font-bold text-amber-300">{order.payment_method}</span>
                </div>
              </div>

              <div className="flex items-start space-x-2 text-xs text-slate-300 mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{order.delivery_address_text || (order as any).delivery_address || 'Delivery Address'}</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  Tap to reach customer & complete POD
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span>Open Step</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Accepted / Ready for Pickup Section */}
      {acceptedOrders.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-bold text-sm text-slate-300 px-1">Accepted & Ready for Pickup</h4>
          {acceptedOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h6 className="font-bold text-xs text-white">{getCustomerDisplayName(order)}</h6>
                  <p className="text-[11px] text-slate-400">Order #{order.order_number || order.id.slice(0, 8)} • ₹{order.total_amount}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                <span>Start</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 6. Empty State if no pending deliveries */}
      {pendingDeliveriesCount === 0 && (
        <div className="text-center py-10 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-3 text-emerald-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-sm text-white">All Caught Up!</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            You have no pending assignments right now. Keep your status <strong>ONLINE</strong> to receive new orders from dispatch.
          </p>
        </div>
      )}
    </div>
  );
};
