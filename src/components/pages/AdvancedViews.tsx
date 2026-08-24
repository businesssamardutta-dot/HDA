import React, { useState } from 'react';
import {
  Compass,
  CreditCard,
  BarChart3,
  Bell,
  TicketPercent,
  Settings,
  ShieldCheck,
  FileSpreadsheet,
  HelpCircle,
  Plus,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Download,
  IndianRupee,
  Bike,
  MapPin,
  Clock,
  Send,
  Eye,
  Check
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import { Order, AppNotification, Coupon } from '../../types';

// ==========================================
// 1. ORDER TRACKING VIEW
// ==========================================
interface OrderTrackingViewProps {
  orders: Order[];
  onTrackOrder: (order: Order) => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({ orders, onTrackOrder }) => {
  const activeOrders = orders.filter(o => o.order_status === 'Out for Delivery' || o.order_status === 'Assigned');

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Live Order & Fleet Tracking</h2>
        <p className="text-xs text-gray-500">Real-time GPS telemetry and delivery progress</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Simulator */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl h-[480px] p-4 relative overflow-hidden flex flex-col justify-between shadow-lg">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Fleet Radar ({activeOrders.length} active in transit)</span>
            </div>
          </div>

          {/* Route Vectors & Pins */}
          <div className="relative z-10 flex items-center justify-around my-auto">
            {activeOrders.slice(0, 3).map((ord, idx) => (
              <div key={ord.id} className="flex flex-col items-center animate-pulse">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl ring-4 ring-emerald-400/40">
                  <Bike className="w-5 h-5" />
                </div>
                <div className="bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 border border-emerald-500/40">
                  {ord.assigned_delivery_boy_name}
                </div>
                <div className="text-[9px] text-emerald-300">→ {ord.customer_name}</div>
              </div>
            ))}
          </div>

          <div className="relative z-10 bg-black/70 backdrop-blur-md p-3 rounded-xl border border-white/10 text-white flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-400 text-[10px]">Hub Origin:</span>
              <div className="font-bold">Hazratganj Central Fulfillment Center</div>
            </div>
            <div className="text-right">
              <span className="text-gray-400 text-[10px]">Avg Speed:</span>
              <div className="font-bold text-emerald-400">26 km/h</div>
            </div>
          </div>
        </div>

        {/* Active List */}
        <div className="lg:col-span-4 bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100">
            Active Trips ({activeOrders.length})
          </h3>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {activeOrders.map((order) => (
              <div key={order.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{order.order_number}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    {order.order_status}
                  </span>
                </div>
                <div className="text-gray-700">
                  Rider: <strong>{order.assigned_delivery_boy_name}</strong>
                </div>
                <div className="text-gray-500 text-[11px] truncate">
                  To: {order.customer_name} ({order.delivery_address_text})
                </div>
                <button
                  onClick={() => onTrackOrder(order)}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs"
                >
                  Open Radar View
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. PAYMENTS & COD SETTLEMENTS
// ==========================================
interface PaymentsCODViewProps {
  orders: Order[];
}

export const PaymentsCODView: React.FC<PaymentsCODViewProps> = ({ orders }) => {
  const codOrders = orders.filter(o => o.payment_method === 'COD');
  const totalCOD = codOrders.reduce((acc, o) => acc + o.total_amount, 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Payments & COD Settlements</h2>
        <p className="text-xs text-gray-500">Reconcile cash-on-delivery collections from riders and online gateway logs</p>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <div className="text-xs text-gray-500">Total COD Collected</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">₹{totalCOD.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{codOrders.length} cash orders</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <div className="text-xs text-gray-500">Pending Rider Handover</div>
          <div className="text-xl font-bold text-amber-600 mt-1">₹42,500.00</div>
          <div className="text-[11px] text-amber-700 mt-0.5">8 riders active</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <div className="text-xs text-gray-500">Online & UPI Settled</div>
          <div className="text-xl font-bold text-blue-700 mt-1">₹1,20,390.00</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Auto-deposited to bank</div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-gray-100 font-bold text-sm text-gray-900">
          Payment Ledger
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Rider Handled</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold text-gray-900">{o.order_number}</td>
                  <td className="py-3 px-4 text-gray-700">{o.customer_name}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-800">{o.payment_method}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{o.assigned_delivery_boy_name || 'Direct'}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">₹{o.total_amount.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {o.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. REPORTS & ANALYTICS
// ==========================================
export const ReportsAnalyticsView: React.FC = () => {
  const revenueTrend = [
    { month: 'Jan', revenue: 145000 },
    { month: 'Feb', revenue: 180000 },
    { month: 'Mar', revenue: 210000 },
    { month: 'Apr', revenue: 235000 },
    { month: 'May', revenue: 245890 },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reports & Business Analytics</h2>
        <p className="text-xs text-gray-500">Executive revenue insights, delivery turnaround times, and zone heatmaps</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Monthly Revenue Growth (INR)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#16a34a" fill="#dcfce7" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Operational Highlights</h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <span className="text-gray-600">On-Time Delivery Rate:</span>
              <span className="font-bold text-emerald-700">96.4%</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <span className="text-gray-600">Average Order Turnaround:</span>
              <span className="font-bold text-gray-900">28 minutes</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <span className="text-gray-600">Customer Satisfaction Rating:</span>
              <span className="font-bold text-amber-600">4.8 / 5.0 ★</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <span className="text-gray-600">Repeat Customer Rate:</span>
              <span className="font-bold text-blue-700">68.2%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. NOTIFICATIONS CENTER
// ==========================================
interface NotificationsViewProps {
  notifications: AppNotification[];
  onSendNotification: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onSendNotification,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Notification Center</h2>
          <p className="text-xs text-gray-500">Live operational alerts, courier notifications and broadcasts</p>
        </div>

        <button
          onClick={onSendNotification}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Broadcast Notification</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-xs divide-y divide-gray-100">
        {notifications.map((n) => (
          <div key={n.id} className="p-4 hover:bg-gray-50/70 transition-colors flex items-start space-x-3 text-xs">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 text-sm">{n.title}</h4>
                <span className="text-[11px] text-gray-400">Just now</span>
              </div>
              <p className="text-gray-600 mt-1">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 5. OFFERS & COUPONS
// ==========================================
interface OffersCouponsViewProps {
  coupons: Coupon[];
}

export const OffersCouponsView: React.FC<OffersCouponsViewProps> = ({ coupons }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Offers & Promo Coupons</h2>
        <p className="text-xs text-gray-500">Create discount codes, flash sales and delivery freebies</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div key={c.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {c.code}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Active
              </span>
            </div>

            <div className="text-xs text-gray-600">
              {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT OFF`} on orders above ₹{c.minimum_order_amount}
            </div>

            <div className="text-[10px] text-gray-400 pt-2 border-t border-gray-100">
              Valid until: <strong>{new Date(c.end_date).toLocaleDateString()}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 6. SETTINGS VIEW
// ==========================================
export const SettingsView: React.FC = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
        <p className="text-xs text-gray-500">Configure business parameters, delivery thresholds, and SMS/push gateways</p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-xs max-w-2xl space-y-4 text-xs">
        <div>
          <label className="block text-gray-700 font-bold mb-1">Business Brand Name</label>
          <input type="text" defaultValue="Haribansho Delivery App" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="block text-gray-700 font-bold mb-1">Free Delivery Minimum Order (₹)</label>
            <input type="number" defaultValue={499} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-1">Base Delivery Charge (₹)</label>
            <input type="number" defaultValue={40} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-1">Support Helpline Phone</label>
          <input type="text" defaultValue="+91 80099 12345" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg" />
        </div>

        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button className="px-5 py-2 bg-[#15803d] hover:bg-[#166534] text-white font-bold rounded-lg shadow-sm cursor-pointer">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 7. USERS & ROLES VIEW
// ==========================================
export const UsersRolesView: React.FC = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Users & RBAC Access Control</h2>
        <p className="text-xs text-gray-500">Manage administrator roles, permissions, and dispatch staff</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="hover:bg-gray-50">
              <td className="py-3 px-4 font-bold text-gray-900">Super Admin</td>
              <td className="py-3 px-4 text-gray-600">admin@haribansho.com</td>
              <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Super User</span></td>
              <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Active</span></td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-3 px-4 font-bold text-gray-900">Dispatch Officer</td>
              <td className="py-3 px-4 text-gray-600">dispatch@haribansho.com</td>
              <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Dispatcher</span></td>
              <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Active</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// 8. AUDIT LOGS VIEW
// ==========================================
export const AuditLogsView: React.FC = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Audit & Security Logs</h2>
        <p className="text-xs text-gray-500">Immutable chronological records of order assignments, state transitions, and user actions</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-4 space-y-3 text-xs font-mono">
        <div className="p-2.5 bg-gray-50 rounded-lg flex items-center justify-between text-gray-700">
          <span>[2025-05-17 10:30:15] ORDER_CREATED: #ORD1251 by Super Admin</span>
          <span className="text-emerald-600 font-bold">SUCCESS</span>
        </div>
        <div className="p-2.5 bg-gray-50 rounded-lg flex items-center justify-between text-gray-700">
          <span>[2025-05-17 10:15:02] ORDER_ASSIGNED: #ORD1249 to Ravi Kumar</span>
          <span className="text-blue-600 font-bold">SUCCESS</span>
        </div>
        <div className="p-2.5 bg-gray-50 rounded-lg flex items-center justify-between text-gray-700">
          <span>[2025-05-17 09:50:44] STATUS_UPDATED: #ORD1250 marked Delivered</span>
          <span className="text-emerald-600 font-bold">SUCCESS</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 9. SUPPORT & HELPDESK VIEW
// ==========================================
export const SupportView: React.FC = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Support & Helpdesk</h2>
        <p className="text-xs text-gray-500">Assist customers and couriers with instant resolution</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-sm text-gray-900">Haribansho Help Center</h3>
          <p className="text-gray-600">Need help integrating your Supabase PostgreSQL cluster, provisioning couriers, or configuring SMS gateways?</p>
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg font-medium">
            Contact 24/7 Operations Hotline: +91 80099 12345
          </div>
        </div>
      </div>
    </div>
  );
};
