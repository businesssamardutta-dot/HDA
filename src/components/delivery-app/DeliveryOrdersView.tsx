import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Bike, 
  Package, 
  ArrowRight, 
  CreditCard,
  Banknote,
  ChevronRight
} from 'lucide-react';
import { Order, DeliveryBoy } from '../../types';

interface DeliveryOrdersViewProps {
  orders: Order[];
  rider: DeliveryBoy;
  onSelectOrder: (order: Order) => void;
  onAcceptOrder: (orderId: string) => void;
}

export const DeliveryOrdersView: React.FC<DeliveryOrdersViewProps> = ({
  orders,
  rider,
  onSelectOrder,
  onAcceptOrder
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'assigned' | 'accepted' | 'progress' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter orders strictly by tab and search
  const filteredOrders = orders.filter(order => {
    // Tab filter
    if (filterTab === 'assigned' && (order.order_status !== 'Assigned' || order.assignment_status === 'Accepted')) return false;
    if (filterTab === 'accepted' && (order.assignment_status !== 'Accepted' || order.order_status === 'Out for Delivery')) return false;
    if (filterTab === 'progress' && order.order_status !== 'Out for Delivery') return false;
    if (filterTab === 'delivered' && order.order_status !== 'Delivered') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const num = (order.order_number || '').toLowerCase();
      const cust = (order.customer_name || '').toLowerCase();
      const addr = (order.delivery_address_text || (order as any).delivery_address || '').toLowerCase();
      const ph = (order.customer_phone || '').toLowerCase();
      return num.includes(q) || cust.includes(q) || addr.includes(q) || ph.includes(q);
    }
    return true;
  });

  const getStatusBadge = (order: Order) => {
    if (order.order_status === 'Delivered') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Delivered
        </span>
      );
    }
    if (order.order_status === 'Out for Delivery') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1 animate-pulse">
          <Bike className="w-3 h-3" /> On The Way
        </span>
      );
    }
    if (order.assignment_status === 'Accepted') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
          <Package className="w-3 h-3" /> Accepted
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-1">
        <Clock className="w-3 h-3" /> New Assigned
      </span>
    );
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by order #, customer, address..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-400/60 rounded-2xl text-xs text-white placeholder-slate-500 outline-hidden transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Tabs Chips */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: 'all', label: 'All', count: orders.length },
          { id: 'assigned', label: 'Assigned', count: orders.filter(o => o.order_status === 'Assigned' && o.assignment_status !== 'Accepted').length },
          { id: 'accepted', label: 'Accepted', count: orders.filter(o => o.assignment_status === 'Accepted' && o.order_status !== 'Out for Delivery').length },
          { id: 'progress', label: 'In Progress', count: orders.filter(o => o.order_status === 'Out for Delivery').length },
          { id: 'delivered', label: 'Delivered', count: orders.filter(o => o.order_status === 'Delivered').length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
              filterTab === tab.id
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filterTab === tab.id ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-4 transition-all shadow-md active:scale-[0.99] cursor-pointer"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-white">
                      Order #{order.order_number || order.id.slice(0, 8)}
                    </span>
                    {getStatusBadge(order)}
                  </div>
                  <h5 className="font-bold text-sm text-slate-100 mt-1">
                    {order.customer_name || 'Customer'}
                  </h5>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-sm text-emerald-400">₹{order.total_amount}</p>
                  <span className={`text-[10px] font-bold ${
                    order.payment_method === 'COD' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {order.payment_method}
                  </span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="flex items-start space-x-2 text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded-xl mb-3">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">
                  {order.delivery_address_text || (order as any).delivery_address || 'Customer Address'}
                </span>
              </div>

              {/* Footer action row */}
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {order.order_status === 'Assigned' && order.assignment_status !== 'Accepted' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAcceptOrder(order.id);
                    }}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Accept</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : order.order_status === 'Out for Delivery' ? (
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold rounded-lg text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Tap to Mark Delivered</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                    <span>View Flow</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
            <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h5 className="font-bold text-sm text-slate-300">No Orders in this View</h5>
            <p className="text-xs text-slate-500 mt-1">
              There are no orders matching the selected filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
