import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Search,
  Bike,
  User,
  MapPin,
  IndianRupee,
  ShoppingBag,
  Send,
  Printer,
  Copy,
  CheckCircle2,
  Database,
  ExternalLink,
  Navigation,
  Clock,
  Shield,
  Phone,
  AlertCircle
} from 'lucide-react';
import { 
  Order, 
  Customer, 
  DeliveryBoy, 
  Product, 
  Category,
  Zone, 
  AppNotification, 
  Coupon 
} from '../types';
import { dbService } from '../services/dbService';
import { isSupabaseConfigured, checkSupabaseConnection } from '../lib/supabase';

// -------------------------------------------------------------
// 1. PUNCH NEW ORDER MODAL
// -------------------------------------------------------------
interface PunchOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  products: Product[];
  zones: Zone[];
  coupons: Coupon[];
  deliveryBoys: DeliveryBoy[];
  onOrderCreated: (order: Order) => void;
}

export const PunchOrderModal: React.FC<PunchOrderModalProps> = ({
  isOpen,
  onClose,
  customers,
  products,
  zones,
  coupons,
  deliveryBoys,
  onOrderCreated,
}) => {
  if (!isOpen) return null;

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [manualZoneName, setManualZoneName] = useState('North Zone');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online' | 'UPI' | 'Card'>('COD');
  const [customerNotes, setCustomerNotes] = useState('');
  const [assignedBoyId, setAssignedBoyId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Line items
  const [items, setItems] = useState<Array<{ product: Product; quantity: number }>>([
    { product: products[0] || {} as Product, quantity: 1 }
  ]);

  const selectedCustomer = customers.find(c => c.id === customerId);
  const selectedBoy = deliveryBoys.find(b => b.id === assignedBoyId);

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (item.product.selling_price * item.quantity), 0);
  const deliveryCharge = subtotal > 499 ? 0 : 40;
  const totalAmount = Math.max(0, subtotal + deliveryCharge - discountAmount);

  const handleAddItem = () => {
    if (products.length > 0) {
      setItems([...items, { product: products[0], quantity: 1 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], product: prod };
      setItems(newItems);
    }
  };

  const handleQuantityChange = (index: number, qty: number) => {
    if (qty >= 1) {
      const newItems = [...items];
      newItems[index].quantity = qty;
      setItems(newItems);
    }
  };

  const handleApplyCoupon = () => {
    const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.is_active);
    if (coupon) {
      if (subtotal < coupon.minimum_order_amount) {
        alert(`Minimum order amount for this coupon is ₹${coupon.minimum_order_amount}`);
        return;
      }
      let disc = 0;
      if (coupon.discount_type === 'percentage') {
        disc = (subtotal * coupon.discount_value) / 100;
        if (coupon.maximum_discount_amount) {
          disc = Math.min(disc, coupon.maximum_discount_amount);
        }
      } else {
        disc = coupon.discount_value;
      }
      setDiscountAmount(disc);
      setCouponApplied(true);
    } else {
      alert('Invalid or expired coupon code');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const orderItems = items.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      order_id: '',
      product_id: item.product.id,
      product_name: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      unit_price: item.product.selling_price,
      discount_amount: 0,
      tax_amount: (item.product.selling_price * item.quantity * item.product.tax_percentage) / 100,
      total_amount: item.product.selling_price * item.quantity,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const createdOrder = await dbService.createOrder({
      customer_id: selectedCustomer?.id,
      customer_name: selectedCustomer?.full_name || 'Walk-in Customer',
      customer_phone: selectedCustomer?.phone || '+91 98765 43210',
      delivery_address_id: selectedCustomer?.addresses?.[0]?.id || 'addr-1',
      delivery_address_text: selectedCustomer?.addresses?.[0]
        ? `${selectedCustomer.addresses[0].address_line_1}, ${selectedCustomer.addresses[0].city}`
        : 'Hazratganj Main, Lucknow',
      zone_id: 'zone-' + manualZoneName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      zone_name: manualZoneName.trim(),
      assigned_delivery_boy_id: selectedBoy?.id || null,
      assigned_delivery_boy_name: selectedBoy?.full_name || null,
      assigned_delivery_boy_phone: selectedBoy?.phone || null,
      order_status: selectedBoy ? 'Assigned' : 'Pending',
      payment_method: paymentMethod,
      subtotal,
      discount_amount: discountAmount,
      delivery_charge: deliveryCharge,
      tax_amount: 0,
      total_amount: totalAmount,
      customer_notes: customerNotes,
      items: orderItems,
    });

    onOrderCreated(createdOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Punch New Order</h2>
              <p className="text-xs text-gray-500">Create a delivery order and dispatch to riders</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-4 space-y-4 text-xs flex-1">
          {/* Customer & Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-gray-700 font-semibold">Select Customer *</label>
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(true)}
                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1 text-[11px] cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ New Customer</span>
                </button>
              </div>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Delivery Zone *</label>
              <input
                type="text"
                value={manualZoneName}
                onChange={(e) => setManualZoneName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="e.g. North Zone, Lucknow"
                required
              />
            </div>
          </div>

          {/* Product Items Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-700 font-semibold">Order Items *</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  <select
                    value={item.product.id}
                    onChange={(e) => handleProductChange(idx, e.target.value)}
                    className="flex-1 bg-white px-2.5 py-1.5 border border-gray-200 rounded-md focus:outline-none text-xs"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ₹{p.selling_price} (Stock: {p.quantity_available})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                      className="w-16 bg-white px-2 py-1.5 border border-gray-200 rounded-md text-center text-xs"
                    />
                  </div>

                  <span className="w-20 text-right font-bold text-gray-800">
                    ₹{(item.product.selling_price * item.quantity).toFixed(2)}
                  </span>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Coupon Code & Assign Driver */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Coupon Code</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. WELCOME50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-3 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-black"
                >
                  Apply
                </button>
              </div>
              {couponApplied && (
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  ✓ Coupon applied! Saved ₹{discountAmount.toFixed(2)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Direct Assign Rider (Optional)</label>
              <select
                value={assignedBoyId}
                onChange={(e) => setAssignedBoyId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">-- Unassigned (Dispatch Later) --</option>
                {deliveryBoys.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.full_name} ({b.zone_name}) - {b.availability_status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              >
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="Online">Online / Card</option>
                <option value="UPI">UPI / GooglePay / PhonePe</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Customer / Delivery Notes</label>
              <input
                type="text"
                placeholder="e.g. Leave package with security"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Charge</span>
              <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-900 font-bold text-sm pt-1.5 border-t border-emerald-200">
              <span>Total Payable</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg font-bold shadow-md cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Punch Order</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sub-modal to add new customer directly */}
      <CustomerFormModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        zones={zones}
        onCustomerSaved={(newCust) => {
          setCustomerId(newCust.id);
          setIsAddCustomerOpen(false);
        }}
      />
    </div>
  );
};

// -------------------------------------------------------------
// 2. ASSIGN ORDER MODAL
// -------------------------------------------------------------
interface AssignOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  deliveryBoys: DeliveryBoy[];
  preselectedOrder?: Order;
  onAssigned: () => void;
}

export const AssignOrderModal: React.FC<AssignOrderModalProps> = ({
  isOpen,
  onClose,
  orders,
  deliveryBoys,
  preselectedOrder,
  onAssigned,
}) => {
  if (!isOpen) return null;

  const unassignedOrders = orders.filter(o => o.order_status === 'Pending' || o.order_status === 'Assigned');
  const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrder?.id || unassignedOrders[0]?.id || '');
  const [selectedBoyId, setSelectedBoyId] = useState(deliveryBoys[0]?.id || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedOrderId || !selectedBoyId) return;
    setIsLoading(true);
    await dbService.assignOrder(selectedOrderId, selectedBoyId);
    setIsLoading(false);
    onAssigned();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Assign Delivery Order</h2>
              <p className="text-xs text-gray-500">Dispatch order to nearby active courier</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Select Order to Dispatch *</label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
            >
              {unassignedOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_number} - {o.customer_name} ({o.zone_name}) - ₹{o.total_amount}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Select Delivery Boy *</label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {deliveryBoys.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBoyId(b.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedBoyId === b.id
                      ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {b.profile_image_url ? (
                      <img
                        src={b.profile_image_url}
                        alt={b.full_name}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs ring-1 ring-emerald-200">
                        {b.full_name?.charAt(0) || 'R'}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-gray-900">{b.full_name}</div>
                      <div className="text-[11px] text-gray-500">{b.zone_name} • {b.vehicle_info}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      b.availability_status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {b.availability_status}
                    </span>
                    <div className="text-[10px] text-gray-400 mt-1">{b.total_deliveries} Delivered</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={isLoading || !selectedOrderId}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md cursor-pointer"
            >
              {isLoading ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. SEND NOTIFICATION MODAL
// -------------------------------------------------------------
interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationSent: () => void;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
  isOpen,
  onClose,
  onNotificationSent,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'Order' | 'Delivery' | 'Alert' | 'System'>('System');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    await dbService.sendNotification({
      title,
      message,
      notification_type: type as any,
    });

    onNotificationSent();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Send Notification</h2>
              <p className="text-xs text-gray-500">Broadcast alert to app users and drivers</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Notification Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <option value="System">System Announcement</option>
              <option value="Delivery">Delivery / Courier Alert</option>
              <option value="Alert">Urgent Operational Alert</option>
              <option value="Order">Order Broadcast</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Title *</label>
            <input
              type="text"
              placeholder="e.g. Flash Promo / Monsoon Rush Alert"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Message Content *</label>
            <textarea
              rows={3}
              placeholder="Enter message text..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-md"
            >
              Send Broadcast
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. SUPABASE SETUP & SQL SCHEMA MODAL
// -------------------------------------------------------------
interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    const res = await checkSupabaseConnection();
    setTestResult(res);
    setTesting(false);
  };

  const handleSyncToSupabase = async () => {
    if (window.confirm('Would you like to synchronize and upload all offline categories, products, zones, partners, and orders to your live Supabase database? This will populate your empty tables instantly.')) {
      setSyncing(true);
      setSyncStatus(null);
      const res = await dbService.syncLocalStateToSupabase();
      setSyncStatus(res);
      setSyncing(false);
    }
  };

  const copySqlSchema = () => {
    const sqlText = `-- HARIBANSHO DELIVERY APP - 01_* SUPABASE MIGRATION
-- Copy and run in Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public."01_users" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'super_admin',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."01_customers" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  total_orders INT NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."01_orders" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES public."01_customers"(id),
  order_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;
    navigator.clipboard.writeText(sqlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Supabase Integration & 01_* Schema</h2>
              <p className="text-xs text-gray-500">PostgreSQL database connection and migrations</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Status banner */}
          <div className={`p-3.5 rounded-xl border flex items-start space-x-3 ${
            isSupabaseConfigured
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">
                {isSupabaseConfigured ? 'Supabase Credentials Detected' : 'Zero-Latency Offline Store Active'}
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                {isSupabaseConfigured
                  ? 'Your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. All operations query and persist directly to your 01_* tables.'
                  : 'Haribansho is operating in high-performance local store mode with full CRUD, real-time events, and schema simulation. You can provide Supabase keys in .env whenever you wish to connect live.'}
              </p>
            </div>
          </div>

          {/* Test Connection Button */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div>
              <div className="font-bold text-gray-900">Test Supabase Connection</div>
              <div className="text-gray-500 text-[11px]">Ping database & check 01_* table access</div>
            </div>
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-3.5 py-1.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-black"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {testResult && (
            <div className={`p-2.5 rounded-lg text-[11px] font-medium ${
              testResult.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {testResult.ok ? '✓ ' : '✕ '} {testResult.message}
            </div>
          )}

          {/* Synchronize Data Section */}
          {isSupabaseConfigured && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 space-y-2">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="font-bold text-emerald-900">Upload Offline / Mock Data to Supabase</div>
                  <div className="text-emerald-700 text-[11px] leading-relaxed mt-0.5">
                    Your Supabase database starts completely empty. Click below to instantly upload all categories, products, zones, partners, and orders to your live PostgreSQL tables.
                  </div>
                </div>
                <button
                  onClick={handleSyncToSupabase}
                  disabled={syncing}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-300 text-white rounded-lg font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
                >
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
              {syncStatus && (
                <div className={`p-2 rounded-lg text-[11px] font-semibold leading-relaxed ${
                  syncStatus.ok ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}>
                  {syncStatus.ok ? '✓ ' : '✕ '} {syncStatus.message}
                </div>
              )}
            </div>
          )}

          {/* Migration File Reference */}
          <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] space-y-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span>src/lib/databaseSchema.sql</span>
              <button
                onClick={copySqlSchema}
                className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-bold"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy SQL Script'}</span>
              </button>
            </div>
            <div className="text-slate-400 text-[10px]">
              Contains all 28 tables starting strictly with <span className="text-emerald-400">"01_"</span>, UUIDs, triggers, foreign keys, RLS security policies, and indexes.
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 5. ORDER DETAILS & INVOICE MODAL
// -------------------------------------------------------------
interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (status: any) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-gray-900">{order.order_number}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {order.order_status}
              </span>
            </div>
            <p className="text-xs text-gray-500">Placed on {order.created_at ? new Date(order.created_at).toLocaleString() : 'Recent'}</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto py-4 space-y-4 text-xs flex-1">
          {/* Customer & Delivery Driver info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer Details</span>
              <div className="font-bold text-gray-900 text-sm mt-0.5">{order.customer_name}</div>
              <div className="text-gray-600 mt-0.5">{order.customer_phone}</div>
              <div className="text-gray-500 mt-1 flex items-start space-x-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <span>{order.delivery_address_text} ({order.zone_name})</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned Driver</span>
              <div className="font-bold text-gray-900 text-sm mt-0.5">
                {order.assigned_delivery_boy_name || 'Unassigned'}
              </div>
              {order.assigned_delivery_boy_phone && (
                <div className="text-gray-600 mt-0.5">{order.assigned_delivery_boy_phone}</div>
              )}
              <div className="text-gray-500 mt-1">
                Payment: <strong className="text-gray-800">{order.payment_method}</strong> ({order.payment_status})
              </div>
            </div>
          </div>

          {/* Itemized list */}
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Order Items</h4>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-gray-600 font-medium">
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Price</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3 font-medium text-gray-800">{item.product_name}</td>
                      <td className="py-2.5 px-3 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">₹{item.unit_price.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                        ₹{(item.unit_price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing summary */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge:</span>
                <span>₹{order.delivery_charge.toFixed(2)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount:</span>
                  <span>-₹{order.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-900 font-bold text-sm pt-1.5 border-t border-gray-200">
                <span>Grand Total:</span>
                <span>₹{order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status update actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-700">Quick Change Status:</span>
            <div className="flex space-x-1.5">
              <button
                onClick={() => onStatusChange('Delivered')}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium"
              >
                Mark Delivered
              </button>
              <button
                onClick={() => onStatusChange('Out for Delivery')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              >
                Mark Out for Delivery
              </button>
              <button
                onClick={() => onStatusChange('Cancelled')}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-medium"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 6. LIVE TRACKING MODAL
// -------------------------------------------------------------
interface LiveTrackingModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Live GPS Tracker: {order.order_number}</h2>
              <p className="text-xs text-gray-500">Live route telemetry & delivery ETA</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map visualization */}
        <div className="relative h-64 bg-slate-900 overflow-hidden flex items-center justify-center">
          {/* Animated map simulation */}
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Road vector simulation */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M 80 180 Q 200 60, 360 140 T 560 80"
              fill="none"
              stroke="#059669"
              strokeWidth="4"
              strokeDasharray="6,6"
              className="animate-pulse"
            />
          </svg>

          {/* Store / Hub marker */}
          <div className="absolute left-16 bottom-10 flex flex-col items-center">
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg ring-4 ring-blue-500/30">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded mt-1">
              Store Hub
            </span>
          </div>

          {/* Courier Pin in Transit */}
          <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl ring-4 ring-emerald-400/50">
              <Bike className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-emerald-300 bg-slate-900/90 border border-emerald-500/50 px-2 py-0.5 rounded-full mt-1">
              {order.assigned_delivery_boy_name || 'Ravi Kumar'} (28 km/h)
            </span>
          </div>

          {/* Customer Destination Marker */}
          <div className="absolute right-12 top-14 flex flex-col items-center">
            <div className="w-7 h-7 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-lg ring-4 ring-rose-500/30">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded mt-1 truncate max-w-[120px]">
              {order.customer_name}
            </span>
          </div>
        </div>

        {/* Status card below map */}
        <div className="p-5 space-y-3 text-xs bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-900 text-sm">Estimated Arrival: ~12 mins</div>
              <div className="text-gray-500">Destination: {order.delivery_address_text}</div>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold">
              {order.order_status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-gray-100">
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="text-gray-400 text-[10px]">Distance Left</div>
              <div className="font-bold text-gray-800 mt-0.5">2.4 km</div>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="text-gray-400 text-[10px]">Courier Phone</div>
              <div className="font-bold text-gray-800 mt-0.5">{order.assigned_delivery_boy_phone || '+91 98111 22334'}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="text-gray-400 text-[10px]">Order Value</div>
              <div className="font-bold text-emerald-700 mt-0.5">₹{order.total_amount.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 7. GLOBAL SEARCH PALETTE (Cmd+K)
// -------------------------------------------------------------
interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  customers: Customer[];
  products: Product[];
  deliveryBoys: DeliveryBoy[];
  onSelectOrder: (order: Order) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  orders,
  customers,
  products,
  deliveryBoys,
  onSelectOrder,
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  const filteredOrders = orders.filter(
    o => o.order_number.toLowerCase().includes(query.toLowerCase()) ||
         o.customer_name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    c => c.full_name.toLowerCase().includes(query.toLowerCase()) ||
         c.phone.includes(query)
  );

  const filteredProducts = products.filter(
    p => p.name.toLowerCase().includes(query.toLowerCase()) ||
         p.sku.toLowerCase().includes(query.toLowerCase())
  );

  const filteredDrivers = deliveryBoys.filter(
    d => d.full_name.toLowerCase().includes(query.toLowerCase()) ||
         d.phone.includes(query)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400 mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Search orders, customers, delivery boys, products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm focus:outline-none text-gray-800 placeholder:text-gray-400"
            autoFocus
          />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-3 space-y-3 text-xs">
          {/* Orders Results */}
          {filteredOrders.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1">Orders</div>
              <div className="space-y-1">
                {filteredOrders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => { onSelectOrder(o); onClose(); }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-gray-800">{o.order_number}</span>
                      <span className="text-gray-500">• {o.customer_name}</span>
                    </div>
                    <span className="font-bold text-gray-900">₹{o.total_amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Results */}
          {filteredCustomers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1">Customers</div>
              <div className="space-y-1">
                {filteredCustomers.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-gray-800">{c.full_name}</span>
                      <span className="text-gray-500">• {c.phone}</span>
                    </div>
                    <span className="text-[11px] text-gray-400">{c.total_orders} Orders</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Boys Results */}
          {filteredDrivers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1">Delivery Boys</div>
              <div className="space-y-1">
                {filteredDrivers.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <Bike className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-gray-800">{d.full_name}</span>
                      <span className="text-gray-500">• {d.zone_name}</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-medium">{d.availability_status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products Results */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1">Products</div>
              <div className="space-y-1">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-800">{p.name}</span>
                      <span className="text-gray-400">({p.sku})</span>
                    </div>
                    <span className="font-bold text-gray-900">₹{p.selling_price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================
// 8. CUSTOMER FORM MODAL (01_customers & 01_customer_addresses)
// =============================================================
interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
  zones?: Zone[];
  onCustomerSaved: (customer: Customer) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
  zones = [],
  onCustomerSaved,
}) => {
  if (!isOpen) return null;

  const isEdit = !!customerToEdit;
  const initialAddr = customerToEdit?.addresses?.[0];

  const [firstName, setFirstName] = useState(customerToEdit?.first_name || '');
  const [lastName, setLastName] = useState(customerToEdit?.last_name || '');
  const [phone, setPhone] = useState(customerToEdit?.phone || '');
  const [email, setEmail] = useState(customerToEdit?.email || '');
  const [alternatePhone, setAlternatePhone] = useState(customerToEdit?.alternate_phone || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(customerToEdit?.status === 'inactive' ? 'inactive' : 'active');
  const [notes, setNotes] = useState(customerToEdit?.notes || '');

  // Address
  const [addressLabel, setAddressLabel] = useState(initialAddr?.label || 'Home');
  const [addressLine1, setAddressLine1] = useState(initialAddr?.address_line_1 || '');
  const [addressLine2, setAddressLine2] = useState(initialAddr?.address_line_2 || '');
  const [landmark, setLandmark] = useState(initialAddr?.landmark || '');
  const [city, setCity] = useState(initialAddr?.city || 'Lucknow');
  const [state, setState] = useState(initialAddr?.state || 'Uttar Pradesh');
  const [postalCode, setPostalCode] = useState(initialAddr?.postal_code || '226001');
  const [zoneId, setZoneId] = useState(zones[0]?.id || 'zone-1');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !phone.trim()) {
      alert('Please provide customer first name and phone number.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEdit && customerToEdit) {
        const updated = await dbService.updateCustomer(customerToEdit.id, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          phone: phone.trim(),
          email: email.trim(),
          alternate_phone: alternatePhone.trim(),
          status,
          notes: notes.trim(),
        });
        if (updated) {
          onCustomerSaved(updated);
        }
      } else {
        const created = await dbService.addCustomer(
          {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            phone: phone.trim(),
            email: email.trim(),
            alternate_phone: alternatePhone.trim(),
            status,
            notes: notes.trim(),
          },
          {
            label: addressLabel,
            recipient_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            phone: phone.trim(),
            address_line_1: addressLine1.trim() || 'Main Market Road',
            address_line_2: addressLine2.trim(),
            landmark: landmark.trim(),
            city: city.trim(),
            state: state.trim(),
            postal_code: postalCode.trim(),
          }
        );
        onCustomerSaved(created);
      }
      onClose();
    } catch (err) {
      console.error('Error saving customer:', err);
      alert('Failed to save customer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {isEdit ? 'Edit Customer Profile' : 'Add New Customer'}
              </h2>
              <p className="text-xs text-gray-500">
                Save to <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">01_customers</code> and <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">01_customer_addresses</code>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-4 space-y-4 text-xs flex-1">
          {/* Section 1: Customer Personal Details */}
          <div>
            <h3 className="font-bold text-gray-800 mb-2 uppercase text-[10px] tracking-wider text-emerald-800">
              1. Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sharma"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 01001"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Alternate Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 01002"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Account Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="active">Active Customer</option>
                  <option value="inactive">Inactive / Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div className="pt-3 border-t border-gray-100">
            <h3 className="font-bold text-gray-800 mb-2 uppercase text-[10px] tracking-wider text-emerald-800 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>2. Primary Delivery Address</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Address Label</label>
                <select
                  value={addressLabel}
                  onChange={(e) => setAddressLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work / Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Area / Delivery Zone</label>
                <input
                  type="text"
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  placeholder="e.g. Hazratganj"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-gray-700 font-semibold mb-1">Flat / House / Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 42B, Hazratganj Shopping Complex Road"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Area / Colony / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Near Metro Station"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">City</label>
                <input
                  type="text"
                  placeholder="e.g. Lucknow"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">State</label>
                <input
                  type="text"
                  placeholder="e.g. Uttar Pradesh"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Postal Code (PIN)</label>
                <input
                  type="text"
                  placeholder="e.g. 226001"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Notes */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-gray-700 font-semibold mb-1">Customer Internal Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. VIP Customer, prefers calling before delivery."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg font-bold shadow-md cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : isEdit ? 'Update Customer' : 'Save Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================
// 9. PRODUCT FORM MODAL (01_products)
// =============================================================
interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  categories: Category[];
  onProductSaved: (product: Product) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  categories,
  onProductSaved,
}) => {
  if (!isOpen) return null;

  const isEdit = !!productToEdit;
  const [name, setName] = useState(productToEdit?.name || '');
  const [categoryId, setCategoryId] = useState(productToEdit?.category_id || categories[0]?.id || 'cat-1');
  const [sellingPrice, setSellingPrice] = useState<string | number>(productToEdit ? productToEdit.selling_price : '');
  const [costPrice, setCostPrice] = useState<string | number>(productToEdit ? productToEdit.cost_price : '');
  const [mrp, setMrp] = useState<string | number>(productToEdit ? productToEdit.mrp : '');
  const [taxPercentage, setTaxPercentage] = useState<string | number>(productToEdit ? productToEdit.tax_percentage : '');
  const [unit, setUnit] = useState(productToEdit?.unit || '');
  const [stock, setStock] = useState<string | number>(productToEdit ? productToEdit.quantity_available : '');
  const [sku, setSku] = useState(productToEdit?.sku || '');
  const [imageUrl, setImageUrl] = useState(productToEdit?.image_url || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const selectedCat = categories.find(c => c.id === categoryId);
      if (isEdit && productToEdit) {
        const updated = await dbService.updateProduct(productToEdit.id, {
          name: name.trim(),
          category_id: categoryId,
          category_name: selectedCat?.name || 'Groceries',
          selling_price: Number(sellingPrice) || 0,
          cost_price: Number(costPrice) || 0,
          mrp: Number(mrp) || Number(sellingPrice) || 0,
          tax_percentage: Number(taxPercentage) || 0,
          unit: unit.trim() || 'unit',
          quantity_available: Number(stock) || 0,
          sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
          image_url: imageUrl.trim(),
        });
        if (updated) onProductSaved(updated);
      } else {
        const created = await dbService.addProduct({
          name: name.trim(),
          category_id: categoryId,
          category_name: selectedCat?.name || 'Groceries',
          selling_price: Number(sellingPrice) || 0,
          cost_price: Number(costPrice) || 0,
          mrp: Number(mrp) || Number(sellingPrice) || 0,
          tax_percentage: Number(taxPercentage) || 0,
          unit: unit.trim() || 'unit',
          quantity_available: Number(stock) || 0,
          sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
          image_url: imageUrl.trim(),
        });
        onProductSaved(created);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error saving product');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
              <p className="text-xs text-gray-500">Catalog & Inventory Management</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-4 space-y-3.5 text-xs flex-1">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Product Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Aashirvaad Superior MP Sharbati Atta 5kg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Unit of Measure</label>
              <input
                type="text"
                placeholder="e.g. 5kg, 1L, pack"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 100"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none font-bold text-emerald-700"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">MRP Price (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 120"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Initial Stock (Qty) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 50"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Tax / GST (%)</label>
              <input
                type="number"
                min="0"
                max="28"
                placeholder="e.g. 5"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Product Image URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none text-[11px]"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg font-bold shadow-md cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================
// 10. DELIVERY BOY FORM MODAL (01_delivery_boys)
// =============================================================
interface DeliveryBoyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: Zone[];
  onDeliveryBoySaved: (boy: DeliveryBoy) => void;
}

export const DeliveryBoyFormModal: React.FC<DeliveryBoyFormModalProps> = ({
  isOpen,
  onClose,
  zones,
  onDeliveryBoySaved,
}) => {
  if (!isOpen) return null;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [appUsername, setAppUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('Rider@123');
  const [showPassword, setShowPassword] = useState(false);
  const [manualZoneName, setManualZoneName] = useState('North Zone');
  const [vehicleInfo, setVehicleInfo] = useState('Hero Splendor (UP 32 AB 1234)');
  const [availability, setAvailability] = useState<any>('Available');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !phone.trim()) return;

    setIsSaving(true);
    try {
      const created = await dbService.addDeliveryBoy({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        phone: phone.trim(),
        email: email.trim() || `${firstName.toLowerCase().replace(/\s+/g, '')}@haribansho.com`,
        app_username: appUsername.trim() || phone.trim(),
        login_password: loginPassword.trim() || 'Rider@123',
        zone_id: 'zone-' + manualZoneName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        zone_name: manualZoneName.trim(),
        vehicle_info: vehicleInfo.trim(),
        availability_status: availability,
      });
      onDeliveryBoySaved(created);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error registering delivery partner');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Add Delivery Partner</h2>
              <p className="text-xs text-gray-500">Register rider in <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">01_delivery_boys</code></p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-4 space-y-3.5 text-xs flex-1">
          {/* Rider Personal Info */}
          <div>
            <h3 className="font-bold text-gray-800 uppercase text-[10px] tracking-wider text-emerald-800 mb-2">
              1. Personal & Contact Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="e.g. Singh"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Phone Number (Login ID) *</label>
            <input
              type="tel"
              required
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (!appUsername) setAppUsername(e.target.value);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Email Address (Optional)</label>
            <input
              type="email"
              placeholder="e.g. vikram.singh@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Android App Login Credentials Section */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
              <Shield className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>2. Android App Login Credentials</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-snug">
              Set the account User ID & Password so the rider can log in to their mobile app.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">App Login User ID *</label>
                <input
                  type="text"
                  required
                  placeholder="Mobile / Username"
                  value={appUsername || phone}
                  onChange={(e) => setAppUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-semibold text-emerald-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">App Password / PIN *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Set Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-xs text-emerald-700 font-bold hover:text-emerald-900"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Fleet Operational Details */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <h3 className="font-bold text-gray-800 uppercase text-[10px] tracking-wider text-emerald-800">
              3. Fleet & Zone Assignment
            </h3>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Assigned Delivery Zone</label>
              <input
                type="text"
                value={manualZoneName}
                onChange={(e) => setManualZoneName(e.target.value)}
                placeholder="e.g. North Zone, Lucknow"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Vehicle Details</label>
              <input
                type="text"
                placeholder="e.g. Honda Activa 6G (UP 32 CD 5678)"
                value={vehicleInfo}
                onChange={(e) => setVehicleInfo(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Initial Duty Status</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              >
                <option value="Available">Available (Ready for Dispatch)</option>
                <option value="Offline">Offline</option>
                <option value="On Break">On Break</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#15803d] hover:bg-[#166534] text-white rounded-lg font-bold shadow-md cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Registering...' : 'Register Rider'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
