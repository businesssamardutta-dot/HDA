import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Eye, 
  UserCheck, 
  Trash2, 
  Printer, 
  CheckCircle,
  Clock,
  Bike
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';

interface OrdersViewProps {
  orders: Order[];
  onPunchOrder: () => void;
  onViewOrder: (order: Order) => void;
  onAssignOrder: (order: Order) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onPunchOrder,
  onViewOrder,
  onAssignOrder,
  onStatusChange,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = [
    'All',
    'Pending',
    'Assigned',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
  ];

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = activeFilter === 'All' ? true : o.order_status === activeFilter;
    const matchesSearch = 
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.zone_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const exportCSV = () => {
    const headers = ['Order Number', 'Customer', 'Zone', 'Status', 'Total', 'Payment', 'Driver', 'Created At'];
    const rows = filteredOrders.map(o => [
      o.order_number,
      o.customer_name,
      o.zone_name,
      o.order_status,
      o.total_amount,
      o.payment_method,
      o.assigned_delivery_boy_name || 'Unassigned',
      o.created_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `haribansho_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Out for Delivery':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Assigned':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Pending':
        return 'bg-yellow-50 text-yellow-800 border border-yellow-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Order Management</h2>
          <p className="text-xs text-gray-500">View, dispatch, update, and manage customer orders</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onPunchOrder}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Punch Order</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeFilter === tab
                  ? 'bg-[#15803d] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab} {tab === 'All' ? `(${orders.length})` : `(${orders.filter(o => o.order_status === tab).length})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Zone / Address</th>
                <th className="py-3 px-4">Driver</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-gray-900">{order.order_number}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-800">{order.customer_name}</div>
                    <div className="text-[11px] text-gray-500">{order.customer_phone}</div>
                  </td>
                  <td className="py-3 px-4 max-w-[200px]">
                    <div className="font-semibold text-gray-800">{order.zone_name}</div>
                    <div className="text-[11px] text-gray-500 truncate">{order.delivery_address_text}</div>
                  </td>
                  <td className="py-3 px-4">
                    {order.assigned_delivery_boy_name ? (
                      <div className="flex items-center space-x-1.5">
                        <Bike className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-medium text-gray-800">{order.assigned_delivery_boy_name}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAssignOrder(order)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Assign</span>
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900">₹{order.total_amount.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-700">{order.payment_method}</span>
                    <span className="text-[10px] text-gray-400 block">{order.payment_status}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(order.order_status)}`}>
                      {order.order_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => onViewOrder(order)}
                        className="p-1 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onAssignOrder(order)}
                        className="p-1 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                        title="Assign Courier"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    </div>
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
