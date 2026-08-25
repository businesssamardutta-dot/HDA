import React, { useState } from 'react';
import {
  Bike,
  Users,
  Package,
  Tags,
  MapPin,
  Truck,
  Plus,
  Search,
  Star,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Trash2,
  Edit2,
  LayoutGrid,
  List,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { DeliveryBoy, Customer, Product, Category, Zone, Vehicle, Order } from '../../types';
import { dbService } from '../../services/dbService';

// ==========================================
// 1. ASSIGN ORDERS VIEW
// ==========================================
interface AssignOrdersViewProps {
  orders: Order[];
  deliveryBoys: DeliveryBoy[];
  onAssign: (orderId: string, deliveryBoyId: string) => void;
}

export const AssignOrdersView: React.FC<AssignOrdersViewProps> = ({
  orders,
  deliveryBoys,
  onAssign,
}) => {
  const pendingOrders = orders.filter(o => o.order_status === 'Pending' || o.order_status === 'Assigned');
  const [selectedZone, setSelectedZone] = useState('All');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(false);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizedRoute(true);
    }, 1500); // Simulate routing algorithm delay
  };

  const filteredOrders = pendingOrders.filter(
    o => selectedZone === 'All' || o.zone_name === selectedZone
  );

  // If optimized, we sort them by a mock logic (e.g. alphabetical zone) to simulate a route
  const displayOrders = optimizedRoute 
    ? [...filteredOrders].sort((a, b) => a.zone_name.localeCompare(b.zone_name))
    : filteredOrders;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dispatch & Assign Orders</h2>
          <p className="text-xs text-gray-500">Quickly allocate open orders to available riders by zone</p>
        </div>
        <button 
          onClick={handleOptimize}
          disabled={isOptimizing || filteredOrders.length < 2}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          <MapPin className={`w-4 h-4 ${isOptimizing ? 'animate-bounce' : ''}`} />
          <span>{isOptimizing ? 'Calculating optimal routes...' : 'Optimize Routes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Orders Queue */}
        <div className="lg:col-span-7 bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900">
              Pending Dispatch ({displayOrders.length})
              {optimizedRoute && <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold uppercase tracking-wider">Optimized Route</span>}
            </h3>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1"
            >
              <option value="All">All Zones</option>
              <option value="North Zone">North Zone</option>
              <option value="South Zone">South Zone</option>
              <option value="East Zone">East Zone</option>
              <option value="West Zone">West Zone</option>
              <option value="Central Zone">Central Zone</option>
            </select>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {displayOrders.map((order) => (
              <div key={order.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900 text-xs">{order.order_number}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                      {order.order_status}
                    </span>
                    <span className="text-[11px] font-medium text-emerald-700">₹{order.total_amount}</span>
                  </div>
                  <div className="text-xs text-gray-700 font-medium mt-1">{order.customer_name} • {order.customer_phone}</div>
                  <div className="text-[11px] text-gray-500 flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>{order.delivery_address_text} ({order.zone_name})</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <select
                    onChange={(e) => {
                      if (e.target.value) onAssign(order.id, e.target.value);
                    }}
                    defaultValue={order.assigned_delivery_boy_id || ''}
                    className="text-xs bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="" disabled>Select Driver...</option>
                    {deliveryBoys.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.full_name} - {b.availability_status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Riders List */}
        <div className="lg:col-span-5 bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100">
            Active Riders Fleet ({deliveryBoys.length})
          </h3>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {deliveryBoys.map((boy) => (
              <div key={boy.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  {boy.profile_image_url ? (
                    <img
                      src={boy.profile_image_url}
                      alt={boy.full_name}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs ring-1 ring-emerald-200">
                      {boy.full_name?.charAt(0) || 'R'}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-gray-900">{boy.full_name}</div>
                    <div className="text-[11px] text-gray-500">{boy.zone_name} • {boy.vehicle_info}</div>
                    <div className="flex items-center space-x-1 text-amber-600 font-semibold mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{(boy.rating || 5.0).toFixed(1)}</span>
                      <span className="text-gray-400 text-[10px]">({boy.total_deliveries || 0} deliveries)</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    boy.availability_status === 'Available'
                      ? 'bg-emerald-100 text-emerald-800'
                      : boy.availability_status === 'On Delivery'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {boy.availability_status}
                  </span>
                  <div className="text-[10px] text-gray-400 mt-1">{boy.phone}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. DELIVERY BOYS VIEW
// ==========================================
interface DeliveryBoysViewProps {
  deliveryBoys: DeliveryBoy[];
  onToggleStatus: (id: string, status: any) => void;
  onAddDeliveryBoy: () => void;
  onEditDeliveryBoy?: (boy: DeliveryBoy) => void;
  onDeleteDeliveryBoy?: (id: string) => void;
}

export const DeliveryBoysView: React.FC<DeliveryBoysViewProps> = ({
  deliveryBoys,
  onToggleStatus,
  onAddDeliveryBoy,
  onEditDeliveryBoy,
  onDeleteDeliveryBoy,
}) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const filtered = deliveryBoys.filter(
    b => b.full_name.toLowerCase().includes(search.toLowerCase()) ||
         b.phone.includes(search) ||
         (b.zone_name && b.zone_name.toLowerCase().includes(search.toLowerCase())) ||
         (b.app_username && b.app_username.toLowerCase().includes(search.toLowerCase())) ||
         (b.employee_code && b.employee_code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Delivery Fleet & Riders</h2>
          <p className="text-xs text-gray-500">Manage delivery partners, active shifts, app credentials, ratings and zones</p>
        </div>

        <button
          onClick={onAddDeliveryBoy}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Delivery Partner</span>
        </button>
      </div>

      {/* Toolbar: Search, Count & View Switcher */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search delivery boys by name, phone, zone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-xs text-gray-500 font-medium">
            Total Riders: <strong className="text-gray-900">{deliveryBoys.length}</strong>
          </div>

          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Delivery Partner</th>
                  <th className="py-3 px-4">Availability / Shift</th>
                  <th className="py-3 px-4">Employment & License</th>
                  <th className="py-3 px-4">Deliveries & Earnings</th>
                  <th className="py-3 px-4">Android App Access</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 italic">
                      No delivery partners found matching "{search}"
                    </td>
                  </tr>
                ) : (
                  filtered.map((boy) => (
                    <tr key={boy.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Delivery Partner */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm ring-2 ring-emerald-200/60 shrink-0">
                            {boy.full_name?.charAt(0) || 'R'}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                              <span>{boy.full_name}</span>
                              {boy.employee_code && (
                                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                                  {boy.employee_code}
                                </span>
                              )}
                            </div>
                            <div className="text-gray-500 font-mono text-[11px]">{boy.phone}</div>
                            <div className="flex items-center space-x-1 text-amber-500 font-semibold text-[11px] mt-0.5">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{(boy.rating || 5.0).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Availability & Shift */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              boy.availability_status === 'Available'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : boy.availability_status === 'On Delivery' || boy.availability_status === 'Busy'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                boy.availability_status === 'Available'
                                  ? 'bg-emerald-500'
                                  : boy.availability_status === 'On Delivery' || boy.availability_status === 'Busy'
                                  ? 'bg-blue-500'
                                  : 'bg-gray-400'
                              }`} />
                              <span>{boy.availability_status}</span>
                            </span>
                          </div>
                          <button
                            onClick={() => onToggleStatus(boy.id, boy.availability_status === 'Available' ? 'Offline' : 'Available')}
                            className={`px-2 py-0.5 rounded border font-medium text-[11px] transition-colors cursor-pointer ${
                              boy.availability_status === 'Available'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            Set {boy.availability_status === 'Available' ? 'Offline' : 'Available'}
                          </button>
                        </div>
                      </td>

                      {/* Employment & License */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-gray-800">{boy.employment_status || 'Full Time'}</div>
                          <div className="text-gray-500 text-[11px]">
                            License: <span className="font-mono text-gray-700">{boy.license_number || 'N/A'}</span>
                          </div>
                          {boy.zone_name && (
                            <div className="text-[10px] text-emerald-700 bg-emerald-50/80 px-1.5 py-0.5 rounded inline-block font-medium mt-0.5">
                              {boy.zone_name}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Deliveries & Earnings */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-gray-900">{boy.total_deliveries || 0} orders</div>
                          <div className="text-emerald-700 font-semibold text-[11px]">
                            ₹{((boy.total_deliveries || 0) * 35).toLocaleString('en-IN')}
                            <span className="text-[10px] text-gray-400 font-normal ml-1">(Commission)</span>
                          </div>
                        </div>
                      </td>

                      {/* Android App Credentials */}
                      <td className="py-3.5 px-4">
                        <div className="p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-[11px] space-y-1 max-w-[210px]">
                          <div className="flex items-center justify-between text-emerald-800 font-bold text-[10px] uppercase tracking-wider">
                            <span className="flex items-center space-x-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>ANDROID APP ACCESS</span>
                            </span>
                            <span className="text-emerald-700 bg-emerald-100 px-1 rounded font-mono text-[9px]">RIDER ROLE</span>
                          </div>
                          <div className="font-mono text-gray-700 text-[11px] space-y-0.5">
                            <div>User ID: <strong className="text-gray-900">{boy.app_username || boy.phone}</strong></div>
                            <div>Pass: <strong className="text-gray-900">{boy.login_password || '1234'}</strong></div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {onEditDeliveryBoy && (
                            <button
                              onClick={() => onEditDeliveryBoy(boy)}
                              title="Edit Rider & Credentials"
                              className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {onDeleteDeliveryBoy && (
                            <button
                              onClick={() => onDeleteDeliveryBoy(boy.id)}
                              title="Delete Rider"
                              className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((boy) => (
            <div key={boy.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm ring-2 ring-emerald-200">
                    {boy.full_name?.charAt(0) || 'R'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{boy.full_name}</h3>
                    <p className="text-xs text-gray-500">{boy.phone}</p>
                    <div className="flex items-center space-x-1 text-amber-500 font-semibold text-xs mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{(boy.rating || 5.0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    boy.availability_status === 'Available'
                      ? 'bg-emerald-100 text-emerald-800'
                      : boy.availability_status === 'On Delivery'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {boy.availability_status}
                  </span>
                  {onEditDeliveryBoy && (
                    <button
                      onClick={() => onEditDeliveryBoy(boy)}
                      title="Edit Rider & Credentials"
                      className="p-1 text-gray-400 hover:text-emerald-700 rounded transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDeleteDeliveryBoy && (
                    <button
                      onClick={() => onDeleteDeliveryBoy(boy.id)}
                      title="Delete Rider"
                      className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg">
                <div>
                  <span className="text-gray-400 text-[10px]">Employment:</span>
                  <div className="font-semibold text-gray-800">{boy.employment_status || 'Full Time'}</div>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px]">License:</span>
                  <div className="font-semibold text-gray-800 font-mono text-[11px]">{boy.license_number || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px]">Total Delivered:</span>
                  <div className="font-semibold text-gray-800">{boy.total_deliveries || 0} orders</div>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px]">Commission Earned:</span>
                  <div className="font-semibold text-emerald-700">₹{((boy.total_deliveries || 0) * 35).toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Android App Login Credentials Card */}
              <div className="p-2 bg-emerald-50/60 border border-emerald-100 rounded-lg text-[11px] space-y-1">
                <div className="flex items-center justify-between text-emerald-800 font-bold text-[10px] uppercase tracking-wider">
                  <span className="flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ANDROID APP ACCESS</span>
                  </span>
                  <span className="text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono">Rider Role</span>
                </div>
                <div className="flex items-center justify-between font-mono text-gray-700">
                  <span>User ID: <strong className="text-gray-900">{boy.app_username || boy.phone}</strong></span>
                  <span>Pass: <strong className="text-gray-900">{boy.login_password || '1234'}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-gray-500">Toggle Status:</span>
                <button
                  onClick={() => onToggleStatus(boy.id, boy.availability_status === 'Available' ? 'Offline' : 'Available')}
                  className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors ${
                    boy.availability_status === 'Available'
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Set {boy.availability_status === 'Available' ? 'Offline' : 'Available'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. CUSTOMERS VIEW
// ==========================================
interface CustomersViewProps {
  customers: Customer[];
  onAddCustomer: () => void;
  onEditCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (id: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);

  const filtered = customers.filter(c => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.customer_code.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Customer Directory</h2>
          <p className="text-xs text-gray-500">
            Registered customers in <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">01_customers</code> and <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">01_customer_addresses</code>
          </p>
        </div>

        <button
          onClick={onAddCustomer}
          className="flex items-center space-x-1.5 px-4 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-3 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 w-full sm:w-auto flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by customer name, phone, code or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive</option>
            </select>
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
              {filtered.length} customers
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Primary Address</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => {
                const addr = c.addresses?.[0];
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-gray-600 font-semibold">{c.customer_code}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div>{c.full_name}</div>
                      {c.notes && (
                        <div className="text-[10px] text-gray-400 font-normal truncate max-w-xs">{c.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="font-mono">{c.phone}</div>
                      {c.email && <div className="text-[11px] text-gray-400">{c.email}</div>}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs">
                      {addr ? (
                        <div>
                          <span className="inline-block px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded text-[9px] font-bold mr-1">
                            {addr.label || 'Home'}
                          </span>
                          <span className="truncate">{addr.address_line_1}, {addr.city}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No address registered</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{c.total_orders || 0}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">₹{(c.total_spent || 0).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {onEditCustomer && (
                          <button
                            onClick={() => onEditCustomer(c)}
                            title="Edit Customer"
                            className="p-1 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteCustomer && (
                          <button
                            onClick={() => onDeleteCustomer(c.id)}
                            title="Delete Customer"
                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. PRODUCTS & CATEGORIES VIEW
// ==========================================
interface ProductsViewProps {
  products: Product[];
  categories: Category[];
  onAddProduct: () => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (id: string) => void;
  onRefreshData?: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  categories,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onRefreshData,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'name' | 'sku' | 'selling_price' | 'quantity_available' | 'category' | null>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // Seeding simulation state
  const [isSeeding, setIsSeeding] = useState(false);

  // Compute stats on overall product pool
  const totalSKUs = products.length;
  const outOfStockCount = products.filter(p => p.quantity_available <= 0).length;
  const lowStockCount = products.filter(p => p.quantity_available > 0 && p.quantity_available <= 15).length;
  const totalCategories = categories.length;

  // 1. Filtering Logic
  const filtered = React.useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
      
      const matchesCat = selectedCat === 'All' || p.category_id === selectedCat || p.category_name === selectedCat;
      
      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = p.quantity_available > 0 && p.quantity_available <= 15;
      } else if (stockFilter === 'out') {
        matchesStock = p.quantity_available <= 0;
      }

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, search, selectedCat, stockFilter]);

  // 2. Sorting Logic
  const sorted = React.useMemo(() => {
    if (!sortBy) return filtered;

    return [...filtered].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (sortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortBy === 'sku') {
        valA = a.sku.toLowerCase();
        valB = b.sku.toLowerCase();
      } else if (sortBy === 'selling_price') {
        valA = a.selling_price;
        valB = b.selling_price;
      } else if (sortBy === 'quantity_available') {
        valA = a.quantity_available;
        valB = b.quantity_available;
      } else if (sortBy === 'category') {
        valA = (a.category_name || '').toLowerCase();
        valB = (b.category_name || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortBy, sortOrder]);

  // Reset pagination on filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCat, stockFilter, sortBy, sortOrder, pageSize]);

  // 3. Slice for Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginatedProducts = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sorted.slice(startIndex, startIndex + pageSize);
  }, [sorted, currentPage, pageSize]);

  const handleSort = (field: 'name' | 'sku' | 'selling_price' | 'quantity_available' | 'category') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSeed5000 = async () => {
    if (window.confirm('Would you like to instantly seed 5,000 realistic products across multiple categories into your workspace database to test layout performance? This will keep any custom items you manually added.')) {
      setIsSeeding(true);
      try {
        await dbService.seed5000Products(categories);
        if (onRefreshData) {
          onRefreshData();
        } else {
          // Fallback location reload if no prop is supplied
          window.location.reload();
        }
      } catch (err) {
        console.error('Failed to seed products:', err);
        alert('Could not complete database seeding simulation.');
      } finally {
        setIsSeeding(false);
      }
    }
  };

  const handleClearSeed = async () => {
    if (window.confirm('Are you sure you want to remove all seeded demo products (SKUs starting with SKU-SEED-) and restore your original items?')) {
      setIsSeeding(true);
      try {
        const db = (window as any).localStorage.getItem('haribansho_db_v2_clean');
        if (db) {
          const parsed = JSON.parse(db);
          if (parsed.products) {
            parsed.products = parsed.products.filter((p: any) => !p.sku.startsWith('SKU-SEED-'));
            (window as any).localStorage.setItem('haribansho_db_v2_clean', JSON.stringify(parsed));
          }
        }
        if (onRefreshData) {
          onRefreshData();
        } else {
          window.location.reload();
        }
      } catch (err) {
        console.error('Failed to clear seed:', err);
      } finally {
        setIsSeeding(false);
      }
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <span>Product Catalogue & SKU Ledger</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Ready for 5K+ items
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Bulk pricing controls, live inventory levels, and immediate SKU index
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Simulation Tools */}
          <button
            onClick={handleSeed5000}
            disabled={isSeeding}
            className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 hover:from-purple-100 hover:to-indigo-100 text-purple-800 rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all disabled:opacity-50"
            title="Generates 5,000 real-world store items across category catalogs"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            <span>{isSeeding ? 'Generating 5k...' : 'Simulate 5,000 Items'}</span>
          </button>

          {products.some(p => p.sku.startsWith('SKU-SEED-')) && (
            <button
              onClick={handleClearSeed}
              disabled={isSeeding}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium cursor-pointer transition-all disabled:opacity-50"
              title="Clears mock-seeded SKU codes and returns database to clean state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Seeding</span>
            </button>
          )}

          <button
            onClick={onAddProduct}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Insights Dashboard (Top of Products View) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Total SKUs Listed</div>
            <div className="text-xl font-bold text-gray-900">{totalSKUs.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Out of Stock</div>
            <div className="text-xl font-bold text-rose-600">{outOfStockCount}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Low Stock Warning</div>
            <div className="text-xl font-bold text-amber-600">{lowStockCount}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Tags className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Catalog Categories</div>
            <div className="text-xl font-bold text-blue-600">{totalCategories}</div>
          </div>
        </div>
      </div>

      {/* 3. Search and Advanced Filtering Panel */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-2xl">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by title, SKU, or specs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* Stock Filter Segment */}
          <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-[11px] font-medium">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${stockFilter === 'all' ? 'bg-white shadow-xs text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-900'}`}
            >
              All Stock
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${stockFilter === 'low' ? 'bg-white shadow-xs text-amber-700 font-bold' : 'text-gray-500 hover:text-gray-900'}`}
              title="Quantity available between 1 and 15"
            >
              Low ({lowStockCount})
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${stockFilter === 'out' ? 'bg-white shadow-xs text-rose-700 font-bold' : 'text-gray-500 hover:text-gray-900'}`}
              title="Quantity available is 0"
            >
              Out ({outOfStockCount})
            </button>
          </div>
        </div>

        {/* Layout controls + Pagination size selector */}
        <div className="flex items-center justify-between sm:justify-end gap-3 border-t lg:border-t-0 pt-2 lg:pt-0 border-gray-100">
          
          {/* Sizing dropdown */}
          <div className="flex items-center space-x-1.5 text-xs text-gray-500">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
            <span className="hidden sm:inline">per page</span>
          </div>

          <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>

          {/* Grid vs Table Toggles */}
          <div className="flex items-center rounded-lg border border-gray-200 p-0.5 bg-gray-50">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md cursor-pointer transition-all ${viewMode === 'table' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-400 hover:text-gray-600'}`}
              title="Compact Table List Layout (Highly Recommended for 5,000 items)"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md cursor-pointer transition-all ${viewMode === 'grid' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-400 hover:text-gray-600'}`}
              title="Visual Card Grid Layout"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Seeding Loading screen */}
      {isSeeding && (
        <div className="bg-white border border-purple-100 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 shadow-xs animate-pulse">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <h4 className="font-bold text-gray-800">Seeding 5,000 Realistic Products...</h4>
            <p className="text-xs text-gray-500 max-w-md mt-1">
              Constructing catalog arrays, configuring SKUs, setting up selling prices and reorder benchmarks in local IndexedDB. This will render in less than a second.
            </p>
          </div>
        </div>
      )}

      {/* 4. Products Render Body */}
      {!isSeeding && (
        <>
          {paginatedProducts.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center max-w-md mx-auto space-y-3.5 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">No items found matching criteria</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Try adjusting search strings, resetting active filters, or clear search queries to return to standard list.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCat('All');
                  setStockFilter('all');
                }}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : viewMode === 'table' ? (
            
            /* COMPACT TABLE VIEW */
            <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[11px] text-gray-400 font-bold uppercase tracking-wider select-none">
                      <th 
                        onClick={() => handleSort('sku')}
                        className="py-3 px-4 cursor-pointer hover:bg-gray-100 text-gray-500 font-bold"
                      >
                        <div className="flex items-center space-x-1">
                          <span>SKU Code</span>
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('name')}
                        className="py-3 px-4 cursor-pointer hover:bg-gray-100 text-gray-500 font-bold"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Product Details</span>
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('category')}
                        className="py-3 px-4 cursor-pointer hover:bg-gray-100 text-gray-500 font-bold"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Category</span>
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('selling_price')}
                        className="py-3 px-4 cursor-pointer hover:bg-gray-100 text-gray-500 font-bold"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Selling Price & MRP</span>
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('quantity_available')}
                        className="py-3 px-4 cursor-pointer hover:bg-gray-100 text-gray-500 font-bold"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Stock Level</span>
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-center font-bold text-gray-500">Status</th>
                      <th className="py-3 px-4 text-right font-bold text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {paginatedProducts.map((prod) => {
                      const isLowStock = prod.quantity_available > 0 && prod.quantity_available <= 15;
                      const isOutOfStock = prod.quantity_available <= 0;
                      
                      return (
                        <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                          {/* SKU Column */}
                          <td className="py-3 px-4 font-mono font-medium text-gray-500">
                            {prod.sku}
                          </td>
                          
                          {/* Name and Description Column */}
                          <td className="py-3 px-4 max-w-sm">
                            <div className="font-bold text-gray-900 truncate" title={prod.name}>
                              {prod.name}
                            </div>
                            <div className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                              {prod.description || 'No product details configured.'}
                            </div>
                          </td>
                          
                          {/* Category Column */}
                          <td className="py-3 px-4">
                            <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {prod.category_name || 'General'}
                            </span>
                          </td>
                          
                          {/* Price Column */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-emerald-700">₹{prod.selling_price}</span>
                              {prod.mrp && prod.mrp > prod.selling_price && (
                                <span className="text-[10px] text-gray-400 line-through">
                                  ₹{prod.mrp}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              Unit: {prod.unit || prod.unit_of_measure || 'units'}
                            </div>
                          </td>
                          
                          {/* Stock Level Column */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-1.5">
                              <span className={`font-semibold ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                                {prod.quantity_available} {prod.unit || prod.unit_of_measure || 'units'}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              Min Alert Level: {prod.reorder_level || 15}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOutOfStock 
                                ? 'bg-rose-100 text-rose-800' 
                                : isLowStock 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'Active / OK'}
                            </span>
                          </td>
                          
                          {/* Actions Column */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {onEditProduct && (
                                <button
                                  onClick={() => onEditProduct(prod)}
                                  title="Edit Product Details"
                                  className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {onDeleteProduct && (
                                <button
                                  onClick={() => onDeleteProduct(prod.id)}
                                  title="Remove Product"
                                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            
            /* VISUAL CARD GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedProducts.map((prod) => (
                <div key={prod.id} className="bg-white rounded-xl border border-gray-100 shadow-xs p-3.5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {prod.sku}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        prod.quantity_available > 15
                          ? 'bg-emerald-100 text-emerald-800'
                          : prod.quantity_available > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        Stock: {prod.quantity_available} {prod.unit || prod.unit_of_measure || 'units'}
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-sm leading-snug">{prod.name}</h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{prod.description}</p>
                    
                    <div className="mt-2.5">
                      <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {prod.category_name || 'General'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      {prod.mrp && prod.mrp > prod.selling_price && (
                        <span className="text-[10px] text-gray-400 line-through mr-1">
                          ₹{prod.mrp}
                        </span>
                      )}
                      <span className="text-sm font-bold text-emerald-700">₹{prod.selling_price}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {onEditProduct && (
                        <button
                          onClick={() => onEditProduct(prod)}
                          title="Edit Product"
                          className="p-1 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteProduct && (
                        <button
                          onClick={() => onDeleteProduct(prod.id)}
                          title="Delete Product"
                          className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. Pagination Ledger Footer */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
            <div>
              Showing <strong className="text-gray-900">
                {Math.min(sorted.length, (currentPage - 1) * pageSize + 1)}
              </strong> to <strong className="text-gray-900">
                {Math.min(sorted.length, currentPage * pageSize)}
              </strong> of <strong className="text-gray-900">{sorted.length}</strong> items 
              {sorted.length !== products.length && (
                <span> (filtered from total <strong className="text-gray-900">{products.length}</strong>)</span>
              )}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                  title="First Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5 double-chevron" />
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Page number markers (max 5 around current) */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  // Guard range
                  if (pageNum < 1 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        currentPage === pageNum 
                          ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-xs' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                  title="Last Page"
                >
                  <ChevronRight className="w-3.5 h-3.5 double-chevron" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 5. LOCATIONS & ZONES VIEW
// ==========================================
interface ZonesViewProps {
  zones: Zone[];
}

export const ZonesView: React.FC<ZonesViewProps> = ({ zones }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Delivery Zones & Coverage</h2>
        <p className="text-xs text-gray-500">Configure geofenced delivery zones, delivery fees, and order caps</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((z) => (
          <div key={z.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{z.name}</h3>
                  <p className="text-xs text-gray-500">{z.city}, {z.state}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg">
              <div>
                <span className="text-gray-400 text-[10px]">Delivery Fee:</span>
                <div className="font-bold text-gray-800">₹{z.base_delivery_charge ?? 40}</div>
              </div>
              <div>
                <span className="text-gray-400 text-[10px]">Min. Order:</span>
                <div className="font-bold text-gray-800">₹{z.minimum_order_amount ?? 199}</div>
              </div>
            </div>

            <div className="text-[11px] text-gray-500">
              Coverage Pincodes: <strong className="text-gray-700">{z.pincodes ? z.pincodes.join(', ') : '226001, 226002'}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
