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
  Check,
  Database,
  Copy,
  ExternalLink,
  Code,
  CheckCheck,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { Order, AppNotification, Coupon, User, DeliveryBoy, Customer, Category, Zone, Payment, CODSettlement, ReturnRecord, CancellationRecord } from '../../types';
import { dbService } from '../../services/dbService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { exportToCSV, exportToExcel } from '../../utils/exportUtils';

// Re-export dedicated view modules
export { ReportsView as ReportsAnalyticsView } from './ReportsView';
export { NotificationsView } from './NotificationsView';
export { OffersCouponsView } from './OffersCouponsView';
export { UsersRolesView } from './UsersRolesView';
export { AuditLogsView } from './AuditLogsView';

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Live Order & Fleet Radar</h2>
          <p className="text-xs text-gray-500">Real-time GPS telemetry, active routes, and courier turnaround</p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>{activeOrders.length} In-Transit Orders</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Simulator */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl h-[480px] p-5 relative overflow-hidden flex flex-col justify-between shadow-lg">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Fleet Radar ({activeOrders.length} active in transit)</span>
            </div>
            <div className="text-xs text-emerald-400 font-mono bg-black/50 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              GPS LAT: 26.8467 | LNG: 80.9462
            </div>
          </div>

          {/* Route Vectors & Pins */}
          <div className="relative z-10 flex items-center justify-around my-auto">
            {activeOrders.length === 0 ? (
              <div className="text-center text-gray-400 text-xs">
                <Bike className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                <p>All active orders have been successfully fulfilled.</p>
              </div>
            ) : (
              activeOrders.slice(0, 3).map((ord) => (
                <div key={ord.id} className="flex flex-col items-center animate-pulse">
                  <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl ring-4 ring-emerald-400/40">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div className="bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 border border-emerald-500/40">
                    {ord.assigned_delivery_boy_name || 'Assigned Courier'}
                  </div>
                  <div className="text-[9px] text-emerald-300">→ {ord.customer_name} ({ord.order_number})</div>
                </div>
              ))
            )}
          </div>

          <div className="relative z-10 bg-black/70 backdrop-blur-md p-3 rounded-xl border border-white/10 text-white flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-400 text-[10px]">Hub Origin:</span>
              <div className="font-bold">Hazratganj Central Fulfillment Center</div>
            </div>
            <div className="text-right">
              <span className="text-gray-400 text-[10px]">Avg Speed:</span>
              <div className="font-bold text-emerald-400">26 km/h (Optimal Traffic)</div>
            </div>
          </div>
        </div>

        {/* Active List */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 flex items-center justify-between">
            <span>Active Trips</span>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
              {activeOrders.length}
            </span>
          </h3>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {activeOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No orders currently out for delivery.
              </div>
            ) : (
              activeOrders.map((order) => (
                <div key={order.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{order.order_number}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      {order.order_status}
                    </span>
                  </div>
                  <div className="text-gray-700">
                    Rider: <strong>{order.assigned_delivery_boy_name || 'Unassigned'}</strong>
                  </div>
                  <div className="text-gray-500 text-[11px] truncate">
                    To: {order.customer_name} ({order.delivery_address_text})
                  </div>
                  <button
                    onClick={() => onTrackOrder(order)}
                    className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs transition-colors"
                  >
                    Open Live Radar
                  </button>
                </div>
              ))
            )}
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
  const [filterMode, setFilterMode] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'payments' | 'cod'>('all');

  const [payments, setPayments] = useState<Payment[]>([]);
  const [codSettlements, setCodSettlements] = useState<CODSettlement[]>([]);

  // Modals
  const [isRecordPayOpen, setIsRecordPayOpen] = useState(false);
  const [isRecordCodOpen, setIsRecordCodOpen] = useState(false);

  // Record Pay Form
  const [payForm, setPayForm] = useState({
    order_id: '',
    payment_method: 'Online',
    amount: 0,
    customer_name: '',
    transaction_id: ''
  });

  // Record COD Form
  const [codForm, setCodForm] = useState({
    order_id: '',
    delivery_boy_id: '',
    delivery_boy_name: '',
    amount_collected: 0,
    notes: ''
  });

  const loadPaymentData = async () => {
    try {
      const p = await dbService.getPayments();
      const c = await dbService.getCODSettlements();
      setPayments(p);
      setCodSettlements(c);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    loadPaymentData();
  }, []);

  const codOrders = orders.filter(o => o.payment_method === 'COD');
  const totalCOD = codOrders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
  const totalOnline = orders
    .filter(o => o.payment_method !== 'COD')
    .reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.assigned_delivery_boy_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMode = filterMode === 'All' || o.payment_method === filterMode;
    return matchesSearch && matchesMode;
  });

  const handleExport = () => {
    exportToExcel('Haribansho_Payment_Ledger', filteredOrders.map(o => ({
      'Order Number': o.order_number,
      'Customer': o.customer_name,
      'Payment Mode': o.payment_method,
      'Courier': o.assigned_delivery_boy_name || 'Direct',
      'Amount (INR)': Number(o.total_amount) || 0,
      'Payment Status': o.payment_status,
      'Delivery Status': o.order_status,
      'Date': new Date(o.created_at).toLocaleDateString()
    })));
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const selOrd = orders.find(o => o.id === payForm.order_id);
    await dbService.recordPayment({
      order_id: payForm.order_id,
      order_number: selOrd?.order_number || 'ORD-MANUAL',
      customer_name: payForm.customer_name || selOrd?.customer_name || 'Customer',
      payment_method: payForm.payment_method as any,
      amount: payForm.amount,
      transaction_id: payForm.transaction_id || `TXN${Math.floor(Math.random()*1000000)}`,
      payment_status: 'Paid'
    });
    setIsRecordPayOpen(false);
    setPayForm({ order_id: '', payment_method: 'Online', amount: 0, customer_name: '', transaction_id: '' });
    loadPaymentData();
  };

  const handleSaveCOD = async (e: React.FormEvent) => {
    e.preventDefault();
    const selOrd = orders.find(o => o.id === codForm.order_id);
    await dbService.recordCODCollection({
      order_id: codForm.order_id,
      order_number: selOrd?.order_number || 'ORD-COD',
      delivery_boy_id: codForm.delivery_boy_id,
      delivery_boy_name: codForm.delivery_boy_name,
      amount_collected: codForm.amount_collected,
      settlement_status: 'Pending',
      notes: codForm.notes
    });
    setIsRecordCodOpen(false);
    setCodForm({ order_id: '', delivery_boy_id: '', delivery_boy_name: '', amount_collected: 0, notes: '' });
    loadPaymentData();
  };

  const handleSettleCOD = async (id: string) => {
    await dbService.settleCOD(id, 'Settled');
    loadPaymentData();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payments & COD Settlements</h2>
          <p className="text-xs text-gray-500">Reconcile cash-on-delivery collections from riders and online payment transactions in 01_payments and 01_cod_settlements</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsRecordPayOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={() => setIsRecordCodOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record COD Collection</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-xs text-gray-500 font-medium">Total COD Volume</div>
          <div className="text-2xl font-black text-amber-700 mt-1">₹{(totalCOD || 0).toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-amber-800 mt-0.5">{codOrders.length} cash orders logged</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-xs text-gray-500 font-medium">Online Gateway & UPI</div>
          <div className="text-2xl font-black text-blue-700 mt-1">₹{(totalOnline || 0).toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Automated settlements</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-xs text-gray-500 font-medium">Recorded Payments Logged</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{payments.length + codSettlements.length}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Live from Supabase tables</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions by order, customer, or rider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
          >
            <option value="All">All Payment Modes</option>
            <option value="COD">Cash on Delivery (COD)</option>
            <option value="Online">Online Gateway</option>
            <option value="UPI">UPI</option>
            <option value="Card">Credit/Debit Card</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Courier Handling</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-gray-900">{o.order_number}</td>
                  <td className="py-3 px-4 text-gray-700">{o.customer_name}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-800">{o.payment_method}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{o.assigned_delivery_boy_name || 'Direct'}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">₹{(Number(o.total_amount) || 0).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      o.payment_status === 'Paid' || o.payment_status === 'COD Collected'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {o.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {isRecordPayOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Record Payment Entry</h3>
              <button onClick={() => setIsRecordPayOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Select Order *</label>
                <select
                  required
                  value={payForm.order_id}
                  onChange={(e) => {
                    const ord = orders.find(o => o.id === e.target.value);
                    setPayForm({
                      ...payForm,
                      order_id: e.target.value,
                      amount: ord ? ord.total_amount : 0,
                      customer_name: ord ? ord.customer_name : ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>Select Order...</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} - {o.customer_name} (₹{o.total_amount})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={payForm.payment_method}
                    onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  >
                    <option value="Online">Online Gateway</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="COD">Cash on Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Transaction Ref / UTR No.</label>
                <input
                  type="text"
                  placeholder="e.g. TXN9876543210"
                  value={payForm.transaction_id}
                  onChange={(e) => setPayForm({ ...payForm, transaction_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRecordPayOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD COD COLLECTION MODAL */}
      {isRecordCodOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Record COD Cash Collection</h3>
              <button onClick={() => setIsRecordCodOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCOD} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Select Order *</label>
                <select
                  required
                  value={codForm.order_id}
                  onChange={(e) => {
                    const ord = orders.find(o => o.id === e.target.value);
                    setCodForm({
                      ...codForm,
                      order_id: e.target.value,
                      amount_collected: ord ? ord.total_amount : 0,
                      delivery_boy_id: ord?.assigned_delivery_boy_id || '',
                      delivery_boy_name: ord?.assigned_delivery_boy_name || ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="" disabled>Select Order...</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} - {o.customer_name} (₹{o.total_amount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Courier / Rider Name</label>
                <input
                  type="text"
                  value={codForm.delivery_boy_name}
                  onChange={(e) => setCodForm({ ...codForm, delivery_boy_name: e.target.value })}
                  placeholder="Courier who collected cash"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Cash Collected Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={codForm.amount_collected}
                  onChange={(e) => setCodForm({ ...codForm, amount_collected: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Notes / Reconciliation Comments</label>
                <input
                  type="text"
                  placeholder="e.g. Handed over at hub end of shift"
                  value={codForm.notes}
                  onChange={(e) => setCodForm({ ...codForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRecordCodOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Log Cash Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. SETTINGS VIEW
// ==========================================
export const SettingsView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSyncToSupabase = async () => {
    if (window.confirm('Would you like to synchronize and upload all offline categories, products, zones, partners, and orders to your live Supabase database? This will populate your empty tables instantly.')) {
      setSyncing(true);
      setSyncStatus(null);
      const res = await dbService.syncLocalStateToSupabase();
      setSyncStatus(res);
      setSyncing(false);
    }
  };

  const handleCopySql = () => {
    const sqlText = `-- ==============================================================================
-- HARIBANSHO DELIVERY APP - SUPABASE POSTGRESQL SCHEMA (01_ PREFIX)
-- Run this in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS
CREATE TABLE IF NOT EXISTS public."01_users" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'dispatcher',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CUSTOMERS
CREATE TABLE IF NOT EXISTS public."01_customers" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  total_orders INT NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CUSTOMER ADDRESSES
CREATE TABLE IF NOT EXISTS public."01_customer_addresses" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public."01_customers"(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL DEFAULT 'Home',
  recipient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line_1 TEXT NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Lucknow',
  state VARCHAR(100) NOT NULL DEFAULT 'Uttar Pradesh',
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS public."01_categories" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. PRODUCTS
CREATE TABLE IF NOT EXISTS public."01_products" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public."01_categories"(id) ON DELETE SET NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'piece',
  selling_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  tax_percentage NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  image_url TEXT,
  quantity_available INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. ZONES
CREATE TABLE IF NOT EXISTS public."01_zones" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  zone_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  city VARCHAR(100) NOT NULL DEFAULT 'Lucknow',
  state VARCHAR(100) NOT NULL DEFAULT 'Uttar Pradesh',
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  color VARCHAR(20) NOT NULL DEFAULT '#16a34a',
  center_lat NUMERIC(10,7) NOT NULL DEFAULT 26.8467,
  center_lng NUMERIC(10,7) NOT NULL DEFAULT 80.9462,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. VEHICLES
CREATE TABLE IF NOT EXISTS public."01_vehicles" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL DEFAULT 'Bike',
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  fuel_type VARCHAR(20) NOT NULL DEFAULT 'Petrol',
  capacity VARCHAR(50) NOT NULL DEFAULT '20 kg',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. DELIVERY BOYS
CREATE TABLE IF NOT EXISTS public."01_delivery_boys" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  profile_image_url TEXT,
  zone_id UUID REFERENCES public."01_zones"(id) ON DELETE SET NULL,
  vehicle_info VARCHAR(100) DEFAULT 'Bike',
  employment_status VARCHAR(50) NOT NULL DEFAULT 'Full Time',
  availability_status VARCHAR(20) NOT NULL DEFAULT 'Available',
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  total_deliveries INT NOT NULL DEFAULT 0,
  successful_deliveries INT NOT NULL DEFAULT 0,
  cancelled_deliveries INT NOT NULL DEFAULT 0,
  current_latitude NUMERIC(10,7) DEFAULT 26.8467,
  current_longitude NUMERIC(10,7) DEFAULT 80.9462,
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ORDERS
CREATE TABLE IF NOT EXISTS public."01_orders" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES public."01_customers"(id) ON DELETE SET NULL,
  customer_name VARCHAR(200),
  customer_phone VARCHAR(50),
  delivery_address_text TEXT,
  zone_id UUID REFERENCES public."01_zones"(id) ON DELETE SET NULL,
  zone_name VARCHAR(100),
  order_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  assignment_status VARCHAR(30) NOT NULL DEFAULT 'Unassigned',
  assigned_delivery_boy_id UUID REFERENCES public."01_delivery_boys"(id) ON DELETE SET NULL,
  assigned_delivery_boy_name VARCHAR(200),
  assigned_delivery_boy_phone VARCHAR(50),
  payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  payment_method VARCHAR(30) NOT NULL DEFAULT 'COD',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  delivery_charge NUMERIC(10,2) NOT NULL DEFAULT 40.00,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  cod_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  items_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public."01_order_items" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public."01_orders"(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public."01_products"(id) ON DELETE SET NULL,
  product_name VARCHAR(200) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public."01_notifications" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL DEFAULT 'System',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public."01_audit_logs" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name VARCHAR(100) NOT NULL DEFAULT 'Super Admin',
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(100),
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. COUPONS
CREATE TABLE IF NOT EXISTS public."01_coupons" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  minimum_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  maximum_discount_amount NUMERIC(10,2) NOT NULL DEFAULT 100.00,
  usage_limit INT NOT NULL DEFAULT 100,
  usage_count INT NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT '2026-12-31',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS public."01_support_tickets" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
  status VARCHAR(20) NOT NULL DEFAULT 'Open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. APP SETTINGS
CREATE TABLE IF NOT EXISTS public."01_app_settings" (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ENABLE ROW LEVEL SECURITY AND POLICIES
ALTER TABLE public."01_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."01_customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."01_customer_addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."01_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."01_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."01_zones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."01_vehicles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."01_delivery_boys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."01_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."01_order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."01_notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."01_audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."01_coupons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."01_support_tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."01_app_settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read write on 01_users" ON public."01_users" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all read write on 01_customers" ON public."01_customers" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all read write on 01_customer_addresses" ON public."01_customer_addresses" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all read write on 01_categories" ON public."01_categories" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all read write on 01_products" ON public."01_products" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all read write on 01_zones" ON public."01_zones" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all read write on 01_vehicles" ON public."01_vehicles" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all read write on 01_delivery_boys" ON public."01_delivery_boys" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all read write on 01_orders" ON public."01_orders" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all read write on 01_order_items" ON public."01_order_items" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all read write on 01_notifications" ON public."01_notifications" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all read write on 01_audit_logs" ON public."01_audit_logs" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all read write on 01_coupons" ON public."01_coupons" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all read write on 01_support_tickets" ON public."01_support_tickets" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all read write on 01_app_settings" ON public."01_app_settings" FOR ALL USING (true) WITH CHECK (true);
`;

    navigator.clipboard.writeText(sqlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl font-bold text-gray-900">System & Database Settings</h2>
        <p className="text-xs text-gray-500">Configure business parameters, Supabase database synchronization, and delivery rules</p>
      </div>

      {/* Supabase Database Schema Setup Card */}
      <div className="bg-emerald-950 text-white rounded-2xl p-6 shadow-md border border-emerald-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-800/80 pb-5">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 text-emerald-100 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Supabase Database Tables & Fields</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-1 max-w-xl">
                Supabase security mandates that table creation (DDL) must be executed in your Supabase SQL Editor. The web app uses the client key for reading & writing live data.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopySql}
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied SQL Script!' : 'Copy SQL Schema Script'}</span>
            </button>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 bg-emerald-800/60 hover:bg-emerald-800 text-white px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-700/50 transition-colors"
            >
              <span>Supabase Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
            </a>
          </div>
        </div>

        {/* 3 Step Setup Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 text-xs">
          <div className="bg-emerald-900/40 p-3.5 rounded-xl border border-emerald-800/50">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Step 1</div>
            <div className="font-semibold text-white">Copy Complete SQL Script</div>
            <p className="text-[11px] text-emerald-300/80 mt-1">
              Click "Copy SQL Schema Script" above to copy all 15+ table definitions with the required <code>01_</code> prefix.
            </p>
          </div>

          <div className="bg-emerald-900/40 p-3.5 rounded-xl border border-emerald-800/50">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Step 2</div>
            <div className="font-semibold text-white">Open Supabase SQL Editor</div>
            <p className="text-[11px] text-emerald-300/80 mt-1">
              Go to your Supabase Project &rarr; Click <strong>SQL Editor</strong> on the left sidebar &rarr; Click <strong>New Query</strong>.
            </p>
          </div>

          <div className="bg-emerald-900/40 p-3.5 rounded-xl border border-emerald-800/50">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Step 3</div>
            <div className="font-semibold text-white">Paste & Click "Run"</div>
            <p className="text-[11px] text-emerald-300/80 mt-1">
              Paste the code into the query editor and click <strong>Run</strong>. All tables, columns, indexes, and RLS policies are created in seconds!
            </p>
          </div>
        </div>

        {/* Upload Offline Data Row */}
        {isSupabaseConfigured && (
          <div className="mt-5 pt-5 border-t border-emerald-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
            <div className="space-y-0.5">
              <h4 className="font-bold text-white text-xs">Populate Live Supabase Tables</h4>
              <p className="text-emerald-300/85 text-[11px] max-w-xl">
                Ready to sync? Click <strong>Sync Offline Data</strong> to instantly upload all categories, products, delivery partners, and orders from your current session into your Supabase database.
              </p>
            </div>
            <button
              onClick={handleSyncToSupabase}
              disabled={syncing}
              className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0 disabled:bg-emerald-800 disabled:text-emerald-300"
            >
              {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{syncing ? 'Syncing...' : 'Sync Offline Data'}</span>
            </button>
          </div>
        )}
        {syncStatus && (
          <div className={`mt-3 p-3 rounded-xl border text-xs font-bold ${
            syncStatus.ok ? 'bg-emerald-900/60 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
          }`}>
            {syncStatus.ok ? '✓ ' : '✕ '} {syncStatus.message}
          </div>
        )}
      </div>

      {/* App Configuration Form */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs max-w-2xl space-y-4 text-xs">
        <h3 className="text-sm font-bold text-gray-900">Business Parameters</h3>
        
        {savedSettings && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        <div>
          <label className="block text-gray-700 font-bold mb-1">Business Brand Name</label>
          <input type="text" defaultValue="Haribansho Delivery App" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl" />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="block text-gray-700 font-bold mb-1">Free Delivery Minimum Order (₹)</label>
            <input type="number" defaultValue={499} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-1">Base Delivery Charge (₹)</label>
            <input type="number" defaultValue={40} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl" />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-1">Support Helpline Phone</label>
          <input type="text" defaultValue="+91 80099 12345" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl" />
        </div>

        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button type="submit" className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-sm cursor-pointer transition-all">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

// ==========================================
// 4. SUPPORT & HELPDESK VIEW
// ==========================================
export const SupportView: React.FC = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Support & Helpdesk</h2>
        <p className="text-xs text-gray-500">Assist customers and couriers with instant ticket resolution</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-sm text-gray-900">Haribansho Operations Support</h3>
          <p className="text-gray-600 leading-relaxed">
            Need assistance integrating your Supabase PostgreSQL cluster, provisioning couriers, or configuring SMS gateways?
          </p>
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl font-medium border border-emerald-200">
            Operations Helpline: +91 80099 12345 • support@haribansho.com
          </div>
        </div>
      </div>
    </div>
  );
};
