import React, { useState } from 'react';
import { Order } from '../../types';
import { Search, RotateCcw, AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react';
import { dbService } from '../../services/dbService';

interface ReturnsRefundsViewProps {
  orders: Order[];
  onRefresh: () => void;
}

export const ReturnsRefundsView: React.FC<ReturnsRefundsViewProps> = ({ orders, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'quality_check' | 'refunded'>('pending');
  const [search, setSearch] = useState('');
  
  // We mock the return statuses by mapping specific order_status states 
  // or just showing Cancelled/Failed orders as part of the returns workflow.
  // In a real DB, you'd have a specific `return_status` field.
  const returnOrders = orders.filter(o => o.order_status === 'Cancelled' || o.order_status === 'Failed' || (o as any).return_status);

  const getFilteredOrders = () => {
    return returnOrders.filter(o => {
      const matchesSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) ||
                            o.customer_name.toLowerCase().includes(search.toLowerCase());
                            
      const status = (o as any).return_status || 'pending';
      return matchesSearch && status === activeTab;
    });
  };

  const updateReturnStatus = async (orderId: string, status: string) => {
    // We can simulate saving the return status in order's notes or metadata
    // Since our mock DB doesn't have `return_status`, we just call updateOrderStatus to trigger a save
    // and patch the object in place for the UI.
    const order = returnOrders.find(o => o.id === orderId);
    if (order) {
      (order as any).return_status = status;
    }
    await dbService.updateOrderStatus(orderId, 'Cancelled'); // trigger update
    onRefresh();
  };

  const filtered = getFilteredOrders();

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {(['pending', 'quality_check', 'refunded'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === tab 
                  ? 'bg-white text-gray-900 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search return orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="py-3 px-4 font-semibold">Order</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Reason</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-900">{order.order_number}</div>
                    <div className="text-[11px] text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-gray-800">{order.customer_name}</div>
                    <div className="text-[11px] text-gray-500">{order.customer_phone}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    ₹{order.total_amount}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-md">Customer Request</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {activeTab === 'pending' && (
                      <button
                        onClick={() => updateReturnStatus(order.id, 'quality_check')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 ml-auto"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        <span>Pickup / Receive</span>
                      </button>
                    )}
                    {activeTab === 'quality_check' && (
                      <button
                        onClick={() => updateReturnStatus(order.id, 'refunded')}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 ml-auto"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Pass Quality & Refund</span>
                      </button>
                    )}
                    {activeTab === 'refunded' && (
                      <span className="inline-flex items-center space-x-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-md">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Refunded to Wallet</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                    No return items in this stage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
