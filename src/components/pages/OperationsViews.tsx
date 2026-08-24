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
  Edit2
} from 'lucide-react';
import { DeliveryBoy, Customer, Product, Category, Zone, Vehicle, Order } from '../../types';

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

  const filteredOrders = pendingOrders.filter(
    o => selectedZone === 'All' || o.zone_name === selectedZone
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dispatch & Assign Orders</h2>
        <p className="text-xs text-gray-500">Quickly allocate open orders to available riders by zone</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Orders Queue */}
        <div className="lg:col-span-7 bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900">
              Pending Dispatch ({filteredOrders.length})
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
            {filteredOrders.map((order) => (
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
                        {b.full_name} ({b.zone_name}) - {b.availability_status}
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
                  <img
                    src={boy.profile_image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                    alt={boy.full_name}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200"
                  />
                  <div>
                    <div className="font-bold text-gray-900">{boy.full_name}</div>
                    <div className="text-[11px] text-gray-500">{boy.zone_name} • {boy.vehicle_info}</div>
                    <div className="flex items-center space-x-1 text-amber-600 font-semibold mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{boy.rating.toFixed(1)}</span>
                      <span className="text-gray-400 text-[10px]">({boy.total_deliveries} deliveries)</span>
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
}

export const DeliveryBoysView: React.FC<DeliveryBoysViewProps> = ({
  deliveryBoys,
  onToggleStatus,
  onAddDeliveryBoy,
}) => {
  const [search, setSearch] = useState('');

  const filtered = deliveryBoys.filter(
    b => b.full_name.toLowerCase().includes(search.toLowerCase()) ||
         b.phone.includes(search) ||
         b.zone_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Delivery Fleet & Riders</h2>
          <p className="text-xs text-gray-500">Manage delivery boys, active shifts, ratings and zones</p>
        </div>

        <button
          onClick={onAddDeliveryBoy}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Delivery Boy</span>
        </button>
      </div>

      {/* Search and Grid */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search delivery boys by name, phone, zone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Total Riders: <strong>{deliveryBoys.length}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((boy) => (
          <div key={boy.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={boy.profile_image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                  alt={boy.full_name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-100"
                />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{boy.full_name}</h3>
                  <p className="text-xs text-gray-500">{boy.phone}</p>
                  <div className="flex items-center space-x-1 text-amber-500 font-semibold text-xs mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{boy.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                boy.availability_status === 'Available'
                  ? 'bg-emerald-100 text-emerald-800'
                  : boy.availability_status === 'On Delivery'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {boy.availability_status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg">
              <div>
                <span className="text-gray-400 text-[10px]">Assigned Zone:</span>
                <div className="font-semibold text-gray-800">{boy.zone_name}</div>
              </div>
              <div>
                <span className="text-gray-400 text-[10px]">Vehicle:</span>
                <div className="font-semibold text-gray-800">{boy.vehicle_info}</div>
              </div>
              <div>
                <span className="text-gray-400 text-[10px]">Total Delivered:</span>
                <div className="font-semibold text-gray-800">{boy.total_deliveries} orders</div>
              </div>
              <div>
                <span className="text-gray-400 text-[10px]">Commission Earned:</span>
                <div className="font-semibold text-emerald-700">₹{(boy.total_deliveries * 35).toLocaleString()}</div>
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
    </div>
  );
};

// ==========================================
// 3. CUSTOMERS VIEW
// ==========================================
interface CustomersViewProps {
  customers: Customer[];
  onAddCustomer: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ customers, onAddCustomer }) => {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    c => c.full_name.toLowerCase().includes(search.toLowerCase()) ||
         c.phone.includes(search) ||
         c.customer_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Customer Directory</h2>
          <p className="text-xs text-gray-500">Manage client profiles, delivery addresses and order history</p>
        </div>

        <button
          onClick={onAddCustomer}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm pl-3 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Primary Address</th>
                <th className="py-3 px-4">Total Orders</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-gray-600">{c.customer_code}</td>
                  <td className="py-3 px-4 font-bold text-gray-900">{c.full_name}</td>
                  <td className="py-3 px-4 text-gray-600">{c.phone}</td>
                  <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                    {c.addresses?.[0]?.address_line_1 || 'Hazratganj'}, {c.addresses?.[0]?.city || 'Lucknow'}
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-800">{c.total_orders}</td>
                  <td className="py-3 px-4 font-bold text-emerald-700">₹{c.total_spent.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {c.status}
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
// 4. PRODUCTS & CATEGORIES VIEW
// ==========================================
interface ProductsViewProps {
  products: Product[];
  categories: Category[];
  onAddProduct: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  categories,
  onAddProduct,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'All' || p.category_id === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Product Catalogue</h2>
          <p className="text-xs text-gray-500">Manage grocery items, inventory stock, MRP, and pricing</p>
        </div>

        <button
          onClick={onAddProduct}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search products by title or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none"
          />
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <span className="text-xs text-gray-500 font-medium">
          Showing <strong>{filtered.length}</strong> items
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((prod) => (
          <div key={prod.id} className="bg-white rounded-xl border border-gray-100 shadow-xs p-3.5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  {prod.sku}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  prod.quantity_available > 20
                    ? 'bg-emerald-100 text-emerald-800'
                    : prod.quantity_available > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  Stock: {prod.quantity_available} {prod.unit_of_measure || prod.unit || 'units'}
                </span>
              </div>

              <h4 className="font-bold text-gray-900 text-sm">{prod.name}</h4>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{prod.description}</p>
            </div>

            <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
              <div>
                {(prod.mrp || prod.selling_price * 1.2) > prod.selling_price && (
                  <span className="text-[10px] text-gray-400 line-through mr-1">
                    ₹{prod.mrp || Math.round(prod.selling_price * 1.25)}
                  </span>
                )}
                <span className="text-sm font-bold text-emerald-700">₹{prod.selling_price}</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">
                {prod.mrp 
                  ? `${Math.round(((prod.mrp - prod.selling_price) / prod.mrp) * 100)}% OFF`
                  : 'Special Price'}
              </span>
            </div>
          </div>
        ))}
      </div>
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
