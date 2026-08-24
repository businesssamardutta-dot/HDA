import React, { useState } from 'react';
import {
  FileText,
  Inbox,
  UserCheck,
  PackageCheck,
  XCircle,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
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
  Sparkles,
  ShoppingBag,
  Users,
  Settings as SettingsIcon,
  Bell,
  Star,
  Layers,
  ArrowRight
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

// Trend chart data (11 May - 17 May)
const trendData = [
  { day: '11 May', orders: 120 },
  { day: '12 May', orders: 380 },
  { day: '13 May', orders: 320 },
  { day: '14 May', orders: 540 },
  { day: '15 May', orders: 480 },
  { day: '16 May', orders: 670 },
  { day: '17 May', orders: 810 },
];

// Order Overview Donut Data
const orderOverviewData = [
  { name: 'Delivered', value: 1032, color: '#16a34a', percent: '82.7%' },
  { name: 'Pending', value: 156, color: '#f59e0b', percent: '12.5%' },
  { name: 'Assigned', value: 532, color: '#3b82f6', percent: '42.6%' },
  { name: 'Cancelled', value: 64, color: '#ef4444', percent: '5.1%' },
];

// Delivery Status Bar Data
const deliveryStatusData = [
  { status: 'Delivered', count: 1032, fill: '#16a34a' },
  { status: 'On The Way', count: 320, fill: '#3b82f6' },
  { status: 'Assigned', count: 532, fill: '#f97316' },
  { status: 'Pending', count: 156, fill: '#eab308' },
  { status: 'Cancelled', count: 64, fill: '#ef4444' },
];

// Payment Mode Donut Data
const paymentModeData = [
  { name: 'COD', value: 812, percent: '65%', color: '#16a34a' },
  { name: 'Online', value: 375, percent: '30%', color: '#3b82f6' },
  { name: 'Card', value: 61, percent: '5%', color: '#f97316' },
];

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
  const [selectedTimeRange, setSelectedTimeRange] = useState('This Week');

  // Format currency
  const formatINR = (val: number) => {
    return '₹' + val.toLocaleString('en-IN');
  };

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'On The Way':
      case 'Out for Delivery':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Assigned':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Pending':
        return 'bg-yellow-50 text-yellow-800 border border-yellow-200';
      case 'Cancelled':
      case 'Failed':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-200">
      {/* 1. Sub-Header: Welcome banner & 4 Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 bg-transparent">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Welcome, Super Admin! <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Here's what's happening with your business today.
          </p>
        </div>

        {/* 4 Action Buttons matching exact colors and labels in screenshot */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            id="btn-punch-order"
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

      {/* 2. Top 6 KPI Statistic Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Total Orders */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white mb-2.5">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-xs text-gray-500 font-medium">Total Orders</div>
          <div className="text-xl font-bold text-gray-900 mt-1">1,248</div>
          <div className="flex items-center text-[11px] font-semibold text-emerald-600 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>18.5% from yesterday</span>
          </div>
        </div>

        {/* Card 2: Pending Orders */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white mb-2.5">
            <Inbox className="w-5 h-5" />
          </div>
          <div className="text-xs text-gray-500 font-medium">Pending Orders</div>
          <div className="text-xl font-bold text-gray-900 mt-1">156</div>
          <div className="flex items-center text-[11px] font-semibold text-emerald-600 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>12.3% from yesterday</span>
          </div>
        </div>

        {/* Card 3: Assigned Orders */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-white mb-2.5">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-gray-500 font-medium">Assigned Orders</div>
          <div className="text-xl font-bold text-gray-900 mt-1">532</div>
          <div className="flex items-center text-[11px] font-semibold text-emerald-600 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>15.8% from yesterday</span>
          </div>
        </div>

        {/* Card 4: Delivered Orders */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center text-white mb-2.5">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-gray-500 font-medium">Delivered Orders</div>
          <div className="text-xl font-bold text-gray-900 mt-1">1,032</div>
          <div className="flex items-center text-[11px] font-semibold text-emerald-600 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>20.4% from yesterday</span>
          </div>
        </div>

        {/* Card 5: Cancelled Orders */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white mb-2.5">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="text-xs text-gray-500 font-medium">Cancelled Orders</div>
          <div className="text-xl font-bold text-gray-900 mt-1">64</div>
          <div className="flex items-center text-[11px] font-semibold text-rose-500 mt-1">
            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            <span>5.6% from yesterday</span>
          </div>
        </div>

        {/* Card 6: Total Revenue */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-pink-500 flex items-center justify-center text-white mb-2.5">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="text-xs text-gray-500 font-medium">Total Revenue</div>
          <div className="text-xl font-bold text-gray-900 mt-1">₹2,45,890</div>
          <div className="flex items-center text-[11px] font-semibold text-emerald-600 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>22.7% from yesterday</span>
          </div>
        </div>
      </div>

      {/* 3. Row 2: Order Overview | Orders Trend | Recent Orders | Today's Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Order Overview (Donut Chart) */}
        <div className="lg:col-span-3 bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900">Order Overview</h3>
            <div className="flex items-center text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">
              <span>This Week</span>
              <ChevronDown className="w-3 h-3 ml-1 text-gray-400" />
            </div>
          </div>

          <div className="relative h-44 flex items-center justify-center my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderOverviewData}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-bold text-gray-900">1,248</span>
              <span className="text-[10px] text-gray-400 font-medium">Total Orders</span>
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
                  {item.value.toLocaleString()} ({item.percent})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders Trend (Line Chart) */}
        <div className="lg:col-span-3 bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900">Orders Trend</h3>
            <div className="flex items-center text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">
              <span>This Week</span>
              <ChevronDown className="w-3 h-3 ml-1 text-gray-400" />
            </div>
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
                    <td className="py-2.5 font-semibold text-gray-800">₹{order.total_amount.toFixed(2)}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(order.order_status)}`}>
                        {order.order_status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-gray-400 text-[11px]">{order.time_display || '10:30 AM'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              <span className="font-bold text-gray-900 text-sm">245</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50/60 border border-gray-100">
              <div className="flex items-center space-x-2 text-gray-700">
                <Truck className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Out for Delivery</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">320</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50/60 border border-gray-100">
              <div className="flex items-center space-x-2 text-gray-700">
                <PackageCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">Delivered</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">186</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50/60 border border-gray-100">
              <div className="flex items-center space-x-2 text-gray-700">
                <IndianRupee className="w-4 h-4 text-pink-600" />
                <span className="font-medium">COD Amount</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">₹1,25,600</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50/60 border border-gray-100">
              <div className="flex items-center space-x-2 text-gray-700">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="font-medium">Avg. Delivery Time</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">28 mins</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Row 3: Top Delivery Boys | Orders by Zone | Delivery Status | Order by Payment Mode | Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Top Delivery Boys */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Top Delivery Boys</h3>
            <div className="flex items-center text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">
              <span>This Week</span>
              <ChevronDown className="w-3 h-3 ml-1 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2.5">
            {deliveryBoys.slice(0, 5).map((boy, i) => (
              <div key={boy.id} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center space-x-2.5">
                  <img
                    src={boy.profile_image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                    alt={boy.full_name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 leading-tight">{boy.full_name}</div>
                    <div className="text-[10px] text-gray-400">{boy.total_deliveries} Deliveries</div>
                  </div>
                </div>
                <div className="flex items-center text-xs font-semibold text-amber-600">
                  <span>{boy.rating.toFixed(1)}</span>
                  <Star className="w-3 h-3 ml-0.5 fill-amber-400 text-amber-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by Zone (Map / Zone Visualizer) */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Orders by Zone</h3>

          <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
            {/* Interactive Map Visual */}
            <div className="relative w-full sm:w-1/2 h-36 bg-emerald-50/50 rounded-lg border border-emerald-100 overflow-hidden flex items-center justify-center p-2">
              {/* Stylized Lucknow Map representation */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:10px_10px]" />
              
              {/* Zone Pins */}
              <div className="absolute top-4 left-6 flex flex-col items-center">
                <div className="w-3.5 h-3.5 bg-blue-500 rounded-full ring-4 ring-blue-200 animate-pulse" />
                <span className="text-[8px] font-bold text-blue-800 bg-white/80 px-1 rounded mt-0.5">North</span>
              </div>
              <div className="absolute bottom-5 left-8 flex flex-col items-center">
                <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full ring-4 ring-emerald-200 animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-800 bg-white/80 px-1 rounded mt-0.5">South</span>
              </div>
              <div className="absolute top-7 right-5 flex flex-col items-center">
                <div className="w-3.5 h-3.5 bg-orange-500 rounded-full ring-4 ring-orange-200 animate-pulse" />
                <span className="text-[8px] font-bold text-orange-800 bg-white/80 px-1 rounded mt-0.5">East</span>
              </div>
              <div className="absolute bottom-6 right-8 flex flex-col items-center">
                <div className="w-3.5 h-3.5 bg-purple-500 rounded-full ring-4 ring-purple-200 animate-pulse" />
                <span className="text-[8px] font-bold text-purple-800 bg-white/80 px-1 rounded mt-0.5">West</span>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-4 h-4 bg-rose-500 rounded-full ring-4 ring-rose-200 animate-ping" />
                <span className="text-[8px] font-bold text-rose-800 bg-white/90 px-1 rounded mt-0.5 shadow-xs">Central</span>
              </div>
            </div>

            {/* Zone breakdown list */}
            <div className="w-full sm:w-1/2 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-[11px] text-gray-700">North Zone</span>
                </div>
                <span className="font-semibold text-gray-900 text-xs">320 Orders</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-gray-700">South Zone</span>
                </div>
                <span className="font-semibold text-gray-900 text-xs">280 Orders</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="text-[11px] text-gray-700">East Zone</span>
                </div>
                <span className="font-semibold text-gray-900 text-xs">260 Orders</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-[11px] text-gray-700">West Zone</span>
                </div>
                <span className="font-semibold text-gray-900 text-xs">210 Orders</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-[11px] text-gray-700">Central Zone</span>
                </div>
                <span className="font-semibold text-gray-900 text-xs">178 Orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Status (Bar Chart) */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900">Delivery Status</h3>
            <div className="flex items-center text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">
              <span>This Week</span>
              <ChevronDown className="w-3 h-3 ml-1 text-gray-400" />
            </div>
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
          <h3 className="text-sm font-bold text-gray-900 mb-2">Order by Payment Mode</h3>

          <div className="relative h-32 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentModeData}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-gray-900">1,248</span>
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
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 transition-colors border border-gray-100 group"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-tight truncate w-full">New Order</span>
            </button>

            <button
              onClick={() => onAssignOrder()}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-700 transition-colors border border-gray-100 group"
            >
              <UserCheck className="w-4 h-4 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-tight truncate w-full">Assign Order</span>
            </button>

            <button
              onClick={() => onNavigateTab('delivery-boys')}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-purple-50 hover:text-purple-700 text-gray-700 transition-colors border border-gray-100 group"
            >
              <Truck className="w-4 h-4 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-tight truncate w-full">Delivery Boys</span>
            </button>

            <button
              onClick={() => onNavigateTab('customers')}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-amber-50 hover:text-amber-700 text-gray-700 transition-colors border border-gray-100 group"
            >
              <Users className="w-4 h-4 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-tight truncate w-full">Customers</span>
            </button>

            <button
              onClick={onOpenReports}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-teal-50 hover:text-teal-700 text-gray-700 transition-colors border border-gray-100 group"
            >
              <BarChart className="w-4 h-4 text-teal-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-tight truncate w-full">Reports</span>
            </button>

            <button
              onClick={onSendNotification}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 transition-colors border border-gray-100 group"
            >
              <Bell className="w-4 h-4 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-tight truncate w-full">Notifications</span>
            </button>

            <button
              onClick={() => onNavigateTab('zones')}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-rose-50 hover:text-rose-700 text-gray-700 transition-colors border border-gray-100 group"
            >
              <MapPin className="w-4 h-4 text-rose-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium leading-tight truncate w-full">Zones</span>
            </button>

            <button
              onClick={() => onNavigateTab('settings')}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-slate-100 hover:text-slate-900 text-gray-700 transition-colors border border-gray-100 group"
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
                      {order.delivery_address_text.split(',')[0]}
                    </td>
                    <td className="py-2.5 text-gray-400 text-[11px]">{order.time_display || '10:30 AM'}</td>
                    <td className="py-2.5 text-right">
                      {order.order_status === 'Out for Delivery' || order.order_status === 'Assigned' ? (
                        <button
                          onClick={() => onTrackOrder(order)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors"
                        >
                          Track
                        </button>
                      ) : (
                        <button
                          onClick={() => onViewOrder(order)}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 px-2 py-0.5 rounded hover:bg-emerald-50 transition-colors"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

          <div className="space-y-3 text-xs">
            {notifications.slice(0, 4).map((n) => {
              let iconBg = 'bg-emerald-50 text-emerald-600';
              if (n.notification_type === 'Payment') iconBg = 'bg-blue-50 text-blue-600';
              if (n.notification_type === 'Inventory') iconBg = 'bg-amber-50 text-amber-600';
              if (n.notification_type === 'Alert') iconBg = 'bg-rose-50 text-rose-600';

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
                  <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">
                    2 mins ago
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
