import React, { useState, useMemo } from 'react';
import {
  FileText,
  Inbox,
  UserCheck,
  PackageCheck,
  XCircle,
  IndianRupee,
  Plus,
  Send,
  BarChart,
  ChevronDown,
  Navigation,
  Eye,
  CheckCircle,
  Truck,
  TrendingUp,
  Clock,
  MapPin,
  ShoppingBag,
  Users,
  Settings as SettingsIcon,
  Bell,
  Star,
  Layers,
  ArrowRight,
  User
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart as RechartsBarChart, 
  Bar, 
  CartesianGrid 
} from 'recharts';

import { Order, DeliveryBoy, AppNotification, DashboardStats } from '../types';
import { NavTabId } from './Sidebar';

interface DashboardViewProps {
  stats: DashboardStats;
  orders: Order[];
  deliveryBoys: DeliveryBoy[];
  notifications: AppNotification[];
  onPunchNewOrder: () => void;
  onAssignOrder: (order?: Order) => void;
  onSendNotification: () => void;
  onOpenReports: () => void;
  onNavigateTab: (tab: NavTabId) => void;
  onViewOrder: (order: Order) => void;
  onTrackOrder: (order: Order) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  orders,
  deliveryBoys,
  notifications,
  onPunchNewOrder,
  onAssignOrder,
  onSendNotification,
  onOpenReports,
  onNavigateTab,
  onViewOrder,
  onTrackOrder,
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('All Time');

  // Format currency in Indian numbering format
  const formatINR = (val: number) => {
    return '₹' + (val || 0).toLocaleString('en-IN');
  };

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800';
      case 'Out for Delivery':
        return 'bg-blue-100 text-blue-800';
      case 'Assigned':
        return 'bg-amber-100 text-amber-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Dynamic calculations directly from live orders
  const { orderOverviewData, deliveryStatusData, paymentModeData, trendData, zoneDistribution } = useMemo(() => {
    const total = orders.length;

    // Order Overview
    const deliveredCount = orders.filter(o => o.order_status === 'Delivered').length;
    const pendingCount = orders.filter(o => o.order_status === 'Pending').length;
    const assignedCount = orders.filter(o => o.order_status === 'Assigned' || o.order_status === 'Out for Delivery').length;
    const cancelledCount = orders.filter(o => o.order_status === 'Cancelled').length;

    const overview = [
      { name: 'Delivered', value: deliveredCount, color: '#16a34a', percent: total > 0 ? `${Math.round((deliveredCount / total) * 100)}%` : '0%' },
      { name: 'Pending', value: pendingCount, color: '#f59e0b', percent: total > 0 ? `${Math.round((pendingCount / total) * 100)}%` : '0%' },
      { name: 'Assigned', value: assignedCount, color: '#3b82f6', percent: total > 0 ? `${Math.round((assignedCount / total) * 100)}%` : '0%' },
      { name: 'Cancelled', value: cancelledCount, color: '#ef4444', percent: total > 0 ? `${Math.round((cancelledCount / total) * 100)}%` : '0%' },
    ];

    // Delivery Status Bars
    const onTheWayCount = orders.filter(o => o.order_status === 'Out for Delivery').length;
    const strictlyAssignedCount = orders.filter(o => o.order_status === 'Assigned').length;

    const statusBars = [
      { status: 'Delivered', count: deliveredCount, fill: '#16a34a' },
      { status: 'On The Way', count: onTheWayCount, fill: '#3b82f6' },
      { status: 'Assigned', count: strictlyAssignedCount, fill: '#f97316' },
      { status: 'Pending', count: pendingCount, fill: '#eab308' },
      { status: 'Cancelled', count: cancelledCount, fill: '#ef4444' },
    ];

    // Payment Mode
    const codCount = orders.filter(o => o.payment_method === 'COD').length;
    const onlineCount = orders.filter(o => o.payment_method === 'Online' || o.payment_method === 'UPI').length;
    const cardCount = orders.filter(o => o.payment_method === 'Card' || o.payment_method === 'Wallet').length;

    const payModes = [
      { name: 'COD', value: codCount, percent: total > 0 ? `${Math.round((codCount / total) * 100)}%` : '0%', color: '#16a34a' },
      { name: 'Online', value: onlineCount, percent: total > 0 ? `${Math.round((onlineCount / total) * 100)}%` : '0%', color: '#3b82f6' },
      { name: 'Card/Wallet', value: cardCount, percent: total > 0 ? `${Math.round((cardCount / total) * 100)}%` : '0%', color: '#f97316' },
    ];

    // Orders Trend (Last 7 days or date groups)
    const daysMap: { [key: string]: number } = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayLabel = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      daysMap[dayLabel] = 0;
    }

    orders.forEach(o => {
      if (o.created_at) {
        const d = new Date(o.created_at);
        const dayLabel = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        if (daysMap[dayLabel] !== undefined) {
          daysMap[dayLabel]++;
        }
      }
    });

    const trends = Object.keys(daysMap).map(k => ({
      day: k,
      orders: daysMap[k]
    }));

    // Zone Breakdown
    const zonesMap: { [key: string]: number } = {
      'North Zone': 0,
      'South Zone': 0,
      'East Zone': 0,
      'West Zone': 0,
      'Central Zone': 0
    };

    orders.forEach(o => {
      const zName = o.zone_name || 'Central Zone';
      if (zonesMap[zName] !== undefined) {
        zonesMap[zName]++;
      } else {
        zonesMap[zName] = (zonesMap[zName] || 0) + 1;
      }
    });

    return {
      orderOverviewData: overview,
      deliveryStatusData: statusBars,
      paymentModeData: payModes,
      trendData: trends,
      zoneDistribution: zonesMap
    };
  }, [orders]);

  // Top delivery riders sorted by actual deliveries
  const sortedDeliveryBoys = useMemo(() => {
    return [...deliveryBoys].sort((a, b) => (b.total_deliveries || 0) - (a.total_deliveries || 0));
  }, [deliveryBoys]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Header Section: Title & 4 Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <span>Operations Command Center</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live Database
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time delivery management, rider tracking, and order fulfillment
          </p>
        </div>

        {/* 4 Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-punch-new-order-top"
            onClick={onPunchNewOrder}
            className="flex items-center space-x-1.5 bg-[#15803d] hover:bg-[#166534] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all hover:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Punch New Order</span>
          </button>

          <button
            id="btn-assign-order-top"
            onClick={() => onAssignOrder()}
            className="flex items-center space-x-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all hover:shadow-md cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Assign Order</span>
          </button>

          <button
            id="btn-send-notification-top"
            onClick={onSendNotification}
            className="flex items-center space-x-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all hover:shadow-md cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send Notification</span>
          </button>

          <button
            id="btn-reports-top"
            onClick={onOpenReports}
            className="flex items-center space-x-1.5 bg-[#0f766e] hover:bg-[#115e59] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all hover:shadow-md cursor-pointer"
          >
            <BarChart className="w-4 h-4" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* 2. Top 6 KPI Statistic Cards Grid (Computed from Live DB) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Total Orders */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white mb-2.5">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-xs text-gray-500 font-medium">Total Orders</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{(stats?.totalOrders ?? stats?.total_orders ?? 0).toLocaleString()}</div>
          <div className="text-[11px] text-gray-400 mt-1">Live from database</div>
        </div>

        {/* Card 2: Pending Orders */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white mb-2.5">
            <Inbox className="w-5 h-5" />
          </div>
          <div className="text-xs text-gray-500 font-medium">Pending Orders</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{(stats?.pendingOrders ?? stats?.pending_orders ?? 0).toLocaleString()}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Awaiting dispatch</div>
        </div>

        {/* Card 3: Assigned Orders */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-white mb-2.5">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-gray-500 font-medium">Assigned Orders</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{(stats?.assignedOrders ?? stats?.assigned_orders ?? 0).toLocaleString()}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Active on delivery</div>
        </div>

        {/* Card 4: Delivered Orders */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center text-white mb-2.5">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-gray-500 font-medium">Delivered Orders</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{(stats?.deliveredOrders ?? stats?.delivered_orders ?? 0).toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Fulfilled successfully</div>
        </div>

        {/* Card 5: Cancelled Orders */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white mb-2.5">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="text-xs text-gray-500 font-medium">Cancelled Orders</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{(stats?.cancelledOrders ?? stats?.cancelled_orders ?? 0).toLocaleString()}</div>
          <div className="text-[11px] text-rose-500 font-medium mt-1">Cancelled records</div>
        </div>

        {/* Card 6: Total Revenue */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-pink-500 flex items-center justify-center text-white mb-2.5">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="text-xs text-gray-500 font-medium">Total Revenue</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{formatINR(stats?.totalRevenue ?? stats?.total_revenue ?? 0)}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Collected & Settled</div>
        </div>
      </div>

      {/* 3. Row 2: Order Overview | Orders Trend | Recent Orders | Today's Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Order Overview (Donut Chart) */}
        <div className="lg:col-span-3 bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900">Order Overview</h3>
            <span className="text-xs text-gray-400 font-medium">{stats?.totalOrders ?? stats?.total_orders ?? orders.length} total</span>
          </div>

          <div className="relative h-44 flex items-center justify-center my-1">
            {orders.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderOverviewData.filter(d => d.value > 0)}
                    innerRadius={46}
                    outerRadius={66}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {orderOverviewData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 text-xs py-8">
                <Inbox className="w-8 h-8 mb-1.5 opacity-40 text-gray-400" />
                <span>No orders recorded</span>
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-bold text-gray-900">{stats?.totalOrders ?? stats?.total_orders ?? orders.length}</span>
              <span className="text-[10px] text-gray-400 font-medium">Total</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs pt-1 border-t border-gray-50">
            {orderOverviewData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-800 text-xs">
                  {(item.value || 0).toLocaleString()} ({item.percent})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders Trend (Line Chart) */}
        <div className="lg:col-span-3 bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900">Orders Trend</h3>
            <span className="text-xs text-gray-400 font-medium">Last 7 Days</span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#16a34a" 
                  strokeWidth={2.5} 
                  dot={{ r: 3.5, fill: '#16a34a', strokeWidth: 1.5, stroke: '#fff' }} 
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders (Table) */}
        <div className="lg:col-span-3 bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Recent Orders</h3>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {orders.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100 pb-1.5 font-medium">
                    <th className="pb-2 font-medium">Order ID</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.slice(0, 5).map((order) => (
                    <tr 
                      key={order.id} 
                      onClick={() => onViewOrder(order)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 font-semibold text-gray-800">{order.order_number}</td>
                      <td className="py-2.5 text-gray-600 truncate max-w-[80px]">{order.customer_name}</td>
                      <td className="py-2.5 font-semibold text-gray-800">₹{(order.total_amount || 0).toFixed(2)}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(order.order_status)}`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-gray-400 text-[11px]">{order.time_display || 'Recent'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 text-xs">
                <FileText className="w-8 h-8 mb-2 opacity-30 text-gray-400" />
                <p className="font-semibold text-gray-600">No Orders in Database</p>
                <p className="text-[11px] text-gray-400 mt-1">Use "Punch New Order" to create an order.</p>
              </div>
            )}
          </div>
        </div>

        {/* Today's Summary */}
        <div className="lg:col-span-3 bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Today's Summary</h3>

          <div className="space-y-3 flex-1 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50/60 border border-gray-100">
              <div className="flex items-center space-x-2 text-gray-700">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">New Orders</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">{stats?.todayNewOrders ?? stats?.today_new_orders ?? 0}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50/60 border border-gray-100">
              <div className="flex items-center space-x-2 text-gray-700">
                <Truck className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Out for Delivery</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">{stats?.todayOutForDelivery ?? stats?.today_out_for_delivery ?? 0}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50/60 border border-gray-100">
              <div className="flex items-center space-x-2 text-gray-700">
                <PackageCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">Delivered</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">{stats?.todayDelivered ?? stats?.today_delivered ?? 0}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50/60 border border-gray-100">
              <div className="flex items-center space-x-2 text-gray-700">
                <IndianRupee className="w-4 h-4 text-pink-600" />
                <span className="font-medium">COD Amount</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">{formatINR(stats?.todayCodAmount ?? stats?.today_cod_amount ?? 0)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50/60 border border-gray-100">
              <div className="flex items-center space-x-2 text-gray-700">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="font-medium">Avg. Delivery Time</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">
                {(stats?.avgDeliveryTimeMinutes ?? stats?.today_avg_delivery_mins ?? 0) > 0 
                  ? `${stats?.avgDeliveryTimeMinutes ?? stats?.today_avg_delivery_mins} mins` 
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Row 3: Top Delivery Boys | Orders by Zone | Delivery Status | Order by Payment Mode | Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Top Delivery Boys */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Delivery Fleet</h3>
            <button
              onClick={() => onNavigateTab('delivery-boys')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              Manage
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {sortedDeliveryBoys.length > 0 ? (
              sortedDeliveryBoys.slice(0, 5).map((boy) => (
                <div key={boy.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] ring-1 ring-emerald-200">
                        {boy.full_name?.charAt(0) || 'R'}
                      </div>
                    <div>
                      <div className="font-semibold text-gray-900 leading-tight">{boy.full_name}</div>
                      <div className="text-[10px] text-gray-400">{boy.total_deliveries || 0} Deliveries</div>
                    </div>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-amber-600">
                    <span>{(boy.rating || 5.0).toFixed(1)}</span>
                    <Star className="w-3 h-3 ml-0.5 fill-amber-400 text-amber-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-400 text-xs">
                <Truck className="w-7 h-7 mb-1.5 opacity-30 text-gray-400" />
                <p className="font-semibold text-gray-600">No Delivery Partners</p>
                <button
                  onClick={() => onNavigateTab('delivery-boys')}
                  className="text-[11px] text-emerald-700 font-bold mt-1 underline"
                >
                  + Add Rider
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Orders by Zone (Zone Visualizer) */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Orders by Zone</h3>

          <div className="flex-1 flex flex-col items-center gap-3">
            {/* Zone breakdown list */}
            <div className="w-full space-y-2 text-xs pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-[11px] text-gray-700">North Zone</span>
                </div>
                <span className="font-semibold text-gray-900 text-xs">{zoneDistribution['North Zone'] || 0} Orders</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-gray-700">South Zone</span>
                </div>
                <span className="font-semibold text-gray-900 text-xs">{zoneDistribution['South Zone'] || 0} Orders</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="text-[11px] text-gray-700">East Zone</span>
                </div>
                <span className="font-semibold text-gray-900 text-xs">{zoneDistribution['East Zone'] || 0} Orders</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-[11px] text-gray-700">West Zone</span>
                </div>
                <span className="font-semibold text-gray-900 text-xs">{zoneDistribution['West Zone'] || 0} Orders</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-[11px] text-gray-700">Central Zone</span>
                </div>
                <span className="font-semibold text-gray-900 text-xs">{zoneDistribution['Central Zone'] || 0} Orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Status (Bar Chart) */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900">Delivery Status</h3>
            <span className="text-xs text-gray-400 font-medium">Live</span>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={deliveryStatusData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="status" tick={{ fontSize: 8.5, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {deliveryStatusData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order by Payment Mode (Donut Chart) */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Payment Breakdown</h3>

          <div className="relative h-32 flex items-center justify-center">
            {orders.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentModeData.filter(p => p.value > 0)}
                    innerRadius={36}
                    outerRadius={52}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentModeData.map((entry, index) => (
                      <Cell key={`cell-pay-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-xs flex flex-col items-center">
                <IndianRupee className="w-6 h-6 mb-1 opacity-30" />
                <span>No payments</span>
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-gray-900">{orders.length}</span>
              <span className="text-[9px] text-gray-400">Total</span>
            </div>
          </div>

          <div className="space-y-1 text-xs pt-1 border-t border-gray-50">
            {paymentModeData.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-gray-600">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-xs">{p.name}</span>
                </div>
                <span className="font-semibold text-gray-800 text-xs">
                  {p.percent} ({p.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links (8 Action Cards Grid) */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-gray-900 mb-2.5">Quick Links</h3>

          <div className="grid grid-cols-4 gap-2 text-center">
            <button
              onClick={onPunchNewOrder}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 transition-colors border border-gray-100 group cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-tight truncate w-full">New Order</span>
            </button>

            <button
              onClick={() => onAssignOrder()}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-700 transition-colors border border-gray-100 group cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-tight truncate w-full">Assign Order</span>
            </button>

            <button
              onClick={() => onNavigateTab('delivery-boys')}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-purple-50 hover:text-purple-700 text-gray-700 transition-colors border border-gray-100 group cursor-pointer"
            >
              <Truck className="w-4 h-4 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-tight truncate w-full">Delivery Boys</span>
            </button>

            <button
              onClick={() => onNavigateTab('customers')}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-amber-50 hover:text-amber-700 text-gray-700 transition-colors border border-gray-100 group cursor-pointer"
            >
              <Users className="w-4 h-4 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-tight truncate w-full">Customers</span>
            </button>

            <button
              onClick={onOpenReports}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-teal-50 hover:text-teal-700 text-gray-700 transition-colors border border-gray-100 group cursor-pointer"
            >
              <BarChart className="w-4 h-4 text-teal-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-tight truncate w-full">Reports</span>
            </button>

            <button
              onClick={onSendNotification}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 transition-colors border border-gray-100 group cursor-pointer"
            >
              <Bell className="w-4 h-4 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-tight truncate w-full">Notifications</span>
            </button>

            <button
              onClick={() => onNavigateTab('zones')}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-rose-50 hover:text-rose-700 text-gray-700 transition-colors border border-gray-100 group cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-rose-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-tight truncate w-full">Zones</span>
            </button>

            <button
              onClick={() => onNavigateTab('settings')}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-slate-100 hover:text-slate-900 text-gray-700 transition-colors border border-gray-100 group cursor-pointer"
            >
              <SettingsIcon className="w-4 h-4 text-slate-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-tight truncate w-full">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Row 4: Live Order Tracking Table & Notifications Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Live Order Tracking Table */}
        <div className="lg:col-span-8 bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-sm font-bold text-gray-900">Live Order Tracking</h3>
            </div>
            <button
              onClick={() => onNavigateTab('order-tracking')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              Open Full Map
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {orders.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100 pb-2 font-medium">
                    <th className="pb-2 font-medium">Order ID</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Delivery Boy</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Location</th>
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 font-semibold text-gray-800">{order.order_number}</td>
                      <td className="py-2.5 text-gray-700 font-medium">{order.customer_name}</td>
                      <td className="py-2.5 text-gray-600">{order.assigned_delivery_boy_name || 'Unassigned'}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(order.order_status)}`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-500 truncate max-w-[150px]">
                        {order.delivery_address_text?.split(',')[0] || 'Lucknow'}
                      </td>
                      <td className="py-2.5 text-gray-400 text-[11px]">{order.time_display || 'Recent'}</td>
                      <td className="py-2.5 text-right">
                        {order.order_status === 'Out for Delivery' || order.order_status === 'Assigned' ? (
                          <button
                            onClick={() => onTrackOrder(order)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            Track
                          </button>
                        ) : (
                          <button
                            onClick={() => onViewOrder(order)}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 px-2 py-0.5 rounded hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-center p-6 text-gray-400 text-xs">
                <Truck className="w-8 h-8 mb-2 opacity-30 text-gray-400" />
                <p className="font-semibold text-gray-600">No active tracking records</p>
                <p className="text-[11px] text-gray-400 mt-1">Orders assigned to riders will appear here in real-time.</p>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Widget */}
        <div className="lg:col-span-4 bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
            <button
              onClick={() => onNavigateTab('notifications')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-3 text-xs flex-1">
            {notifications.length > 0 ? (
              notifications.slice(0, 4).map((n) => {
                let iconBg = 'bg-emerald-50 text-emerald-600';
                const nType = String(n.notification_type);
                if (nType === 'Payment') iconBg = 'bg-blue-50 text-blue-600';
                if (nType === 'Inventory') iconBg = 'bg-amber-50 text-amber-600';
                if (nType === 'Alert' || nType === 'System Alert') iconBg = 'bg-rose-50 text-rose-600';

                return (
                  <div key={n.id} className="flex items-start space-x-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-xs truncate leading-tight">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 text-xs">
                <Bell className="w-7 h-7 mb-2 opacity-30 text-gray-400" />
                <p className="font-semibold text-gray-600">No Notifications</p>
                <p className="text-[11px] text-gray-400 mt-1">System broadcasts and order alerts will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
