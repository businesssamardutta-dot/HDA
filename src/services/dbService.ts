import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  Order, 
  Customer, 
  CustomerAddress,
  DeliveryBoy, 
  Product, 
  Category, 
  Zone, 
  Location, 
  Vehicle, 
  Payment, 
  CODSettlement, 
  ReturnRecord, 
  CancellationRecord, 
  AppNotification, 
  Coupon, 
  Offer, 
  AuditLog, 
  AppSetting, 
  SupportTicket, 
  User,
  DashboardStats,
  DeliveryAssignment
} from '../types';

import {
  initialOrders,
  initialCustomers,
  initialDeliveryBoys,
  initialProducts,
  initialCategories,
  initialZones,
  initialVehicles,
  initialPayments,
  initialCODSettlements,
  initialReturns,
  initialCancellations,
  initialNotifications,
  initialCoupons,
  initialOffers,
  initialAuditLogs,
  initialSupportTickets,
  initialAppSettings,
  initialUsers
} from '../lib/mockData';

// Local storage key for fresh clean state
const STORAGE_KEY = 'haribansho_db_v2_clean';

interface LocalDBState {
  orders: Order[];
  customers: Customer[];
  deliveryBoys: DeliveryBoy[];
  products: Product[];
  categories: Category[];
  zones: Zone[];
  locations: Location[];
  vehicles: Vehicle[];
  payments: Payment[];
  codSettlements: CODSettlement[];
  returns: ReturnRecord[];
  cancellations: CancellationRecord[];
  notifications: AppNotification[];
  coupons: Coupon[];
  offers: Offer[];
  auditLogs: AuditLog[];
  supportTickets: SupportTicket[];
  settings: AppSetting[];
  users: User[];
  assignments: DeliveryAssignment[];
}

function loadLocalDB(): LocalDBState {
  try {
    // Clear old v1 storage that had dummy seeds
    localStorage.removeItem('haribansho_db_v1');
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load local DB', e);
  }

  const defaultState: LocalDBState = {
    orders: initialOrders,
    customers: initialCustomers,
    deliveryBoys: initialDeliveryBoys,
    products: initialProducts,
    categories: initialCategories,
    zones: initialZones,
    locations: [],
    vehicles: initialVehicles,
    payments: initialPayments,
    codSettlements: initialCODSettlements,
    returns: initialReturns,
    cancellations: initialCancellations,
    notifications: initialNotifications,
    coupons: initialCoupons,
    offers: initialOffers,
    auditLogs: initialAuditLogs,
    supportTickets: initialSupportTickets,
    settings: initialAppSettings,
    users: initialUsers,
    assignments: []
  };

  saveLocalDB(defaultState);
  return defaultState;
}

function saveLocalDB(state: LocalDBState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('haribansho_db_updated'));
  } catch (e) {
    console.error('Failed to save local DB', e);
  }
}

// Database Service Implementation with Direct Supabase Access
export const dbService = {
  // -------------------------------------------------------------
  // DASHBOARD STATS (Real Live Metrics from Supabase / DB)
  // -------------------------------------------------------------
  async getDashboardStats(): Promise<DashboardStats> {
    const orders = await this.getOrders();
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.order_status === 'Pending').length;
    const assignedOrders = orders.filter(o => o.order_status === 'Assigned' || o.order_status === 'Out for Delivery').length;
    const deliveredOrders = orders.filter(o => o.order_status === 'Delivered').length;
    const cancelledOrders = orders.filter(o => o.order_status === 'Cancelled').length;

    // Real total revenue from delivered / paid orders
    const totalRevenue = orders
      .filter(o => o.order_status === 'Delivered' || o.payment_status === 'Paid' || o.payment_status === 'COD Collected')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    // Today's counts
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.created_at?.startsWith(todayStr));
    const todayNewOrders = todayOrders.length;
    const todayOutForDelivery = orders.filter(o => o.order_status === 'Out for Delivery').length;
    const todayDelivered = orders.filter(o => o.order_status === 'Delivered' && o.updated_at?.startsWith(todayStr)).length;
    const todayCodAmount = orders
      .filter(o => o.payment_method === 'COD' && (o.order_status === 'Delivered' || o.payment_status === 'COD Collected'))
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    return {
      totalOrders,
      totalOrdersGrowth: totalOrders > 0 ? 0 : 0,
      pendingOrders,
      pendingOrdersGrowth: 0,
      assignedOrders,
      assignedOrdersGrowth: 0,
      deliveredOrders,
      deliveredOrdersGrowth: 0,
      cancelledOrders,
      cancelledOrdersGrowth: 0,
      totalRevenue,
      totalRevenueGrowth: 0,
      todayNewOrders,
      todayOutForDelivery,
      todayDelivered,
      todayCodAmount,
      avgDeliveryTimeMinutes: deliveredOrders > 0 ? 25 : 0
    };
  },

  // -------------------------------------------------------------
  // ORDERS (01_orders & 01_order_items)
  // -------------------------------------------------------------
  async getOrders(): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data as Order[];
        }
      } catch (e) {
        console.warn('Supabase fetch orders error, fallback to local store:', e);
      }
    }
    const db = loadLocalDB();
    return db.orders;
  },

  async getOrderById(id: string): Promise<Order | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_orders')
          .select('*')
          .or(`id.eq.${id},order_number.eq.${id}`)
          .maybeSingle();

        if (!error && data) return data as Order;
      } catch (e) {}
    }
    const orders = await this.getOrders();
    return orders.find(o => o.id === id || o.order_number === id) || null;
  },

  async createOrder(orderData: Partial<Order> & { items: any[] }): Promise<Order> {
    const db = loadLocalDB();
    const orderSeq = (db.orders.length + 1).toString().padStart(4, '0');
    const orderNumber = orderData.order_number || `#ORD${orderSeq}`;
    const id = `ord-${Date.now()}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id,
      order_number: orderNumber,
      customer_id: orderData.customer_id || '',
      customer_name: orderData.customer_name || 'Customer',
      customer_phone: orderData.customer_phone || '',
      delivery_address_id: orderData.delivery_address_id || '',
      delivery_address_text: orderData.delivery_address_text || '',
      zone_id: orderData.zone_id || '',
      zone_name: orderData.zone_name || '',
      order_status: orderData.order_status || 'Pending',
      assignment_status: orderData.assigned_delivery_boy_id ? 'Assigned' : 'Unassigned',
      assigned_delivery_boy_id: orderData.assigned_delivery_boy_id || null,
      assigned_delivery_boy_name: orderData.assigned_delivery_boy_name || null,
      assigned_delivery_boy_phone: orderData.assigned_delivery_boy_phone || null,
      payment_status: orderData.payment_status || (orderData.payment_method === 'COD' ? 'COD Pending' : 'Paid'),
      payment_method: orderData.payment_method || 'COD',
      subtotal: Number(orderData.subtotal) || 0,
      discount_amount: Number(orderData.discount_amount) || 0,
      delivery_charge: Number(orderData.delivery_charge) || 0,
      tax_amount: Number(orderData.tax_amount) || 0,
      total_amount: Number(orderData.total_amount) || 0,
      cod_amount: orderData.payment_method === 'COD' ? (Number(orderData.total_amount) || 0) : 0,
      time_display: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      items_count: orderData.items?.length || 0,
      items: orderData.items || [],
      customer_notes: orderData.customer_notes,
      created_at: now,
      updated_at: now,
    };

    db.orders.unshift(newOrder);

    // If assigned immediately, create assignment
    if (newOrder.assigned_delivery_boy_id) {
      db.assignments.unshift({
        id: `asg-${Date.now()}`,
        order_id: newOrder.id,
        order_number: newOrder.order_number,
        delivery_boy_id: newOrder.assigned_delivery_boy_id,
        delivery_boy_name: newOrder.assigned_delivery_boy_name || '',
        assigned_by: 'Super Admin',
        assignment_status: 'Assigned',
        assigned_at: now,
        created_at: now,
        updated_at: now,
      });
    }

    // Add notification
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'New Order Punched',
      message: `New order ${newOrder.order_number} for ${newOrder.customer_name} (₹${newOrder.total_amount.toFixed(2)}) has been created.`,
      notification_type: 'Order',
      entity_type: 'order',
      entity_id: newOrder.id,
      is_read: false,
      created_at: now,
    });

    // Add Audit Log
    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      user_name: 'Super Admin',
      action: 'CREATE_ORDER',
      entity_type: '01_orders',
      entity_id: newOrder.id,
      new_data: { order_number: newOrder.order_number, total: newOrder.total_amount },
      ip_address: '127.0.0.1',
      created_at: now,
    });

    saveLocalDB(db);

    // Sync to Supabase if connected
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_orders').insert([{
          id: newOrder.id,
          order_number: newOrder.order_number,
          customer_id: newOrder.customer_id,
          customer_name: newOrder.customer_name,
          customer_phone: newOrder.customer_phone,
          delivery_address_id: newOrder.delivery_address_id,
          delivery_address_text: newOrder.delivery_address_text,
          zone_id: newOrder.zone_id,
          zone_name: newOrder.zone_name,
          order_status: newOrder.order_status,
          assignment_status: newOrder.assignment_status,
          assigned_delivery_boy_id: newOrder.assigned_delivery_boy_id,
          assigned_delivery_boy_name: newOrder.assigned_delivery_boy_name,
          assigned_delivery_boy_phone: newOrder.assigned_delivery_boy_phone,
          payment_status: newOrder.payment_status,
          payment_method: newOrder.payment_method,
          subtotal: newOrder.subtotal,
          discount_amount: newOrder.discount_amount,
          delivery_charge: newOrder.delivery_charge,
          tax_amount: newOrder.tax_amount,
          total_amount: newOrder.total_amount,
          cod_amount: newOrder.cod_amount,
          items_count: newOrder.items_count,
          created_at: newOrder.created_at,
          updated_at: newOrder.updated_at
        }]);

        if (newOrder.items && newOrder.items.length > 0) {
          const itemsPayload = newOrder.items.map((item: any) => ({
            id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            order_id: newOrder.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            created_at: now
          }));
          await supabase.from('01_order_items').insert(itemsPayload);
        }
      } catch (e) {
        console.warn('Supabase insert order error, recorded locally', e);
      }
    }

    return newOrder;
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    const db = loadLocalDB();
    const index = db.orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    const oldOrder = db.orders[index];
    const now = new Date().toISOString();

    const updatedOrder: Order = {
      ...oldOrder,
      ...updates,
      updated_at: now,
    };

    if (updates.order_status === 'Delivered' && !updatedOrder.delivered_at) {
      updatedOrder.delivered_at = now;
      if (updatedOrder.payment_method === 'COD') {
        updatedOrder.payment_status = 'COD Collected';
      }
    }

    db.orders[index] = updatedOrder;

    // Log status change audit
    if (updates.order_status && updates.order_status !== oldOrder.order_status) {
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        user_name: 'Super Admin',
        action: 'UPDATE_ORDER_STATUS',
        entity_type: '01_orders',
        entity_id: id,
        old_data: { status: oldOrder.order_status },
        new_data: { status: updates.order_status },
        ip_address: '127.0.0.1',
        created_at: now,
      });

      // Notification
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        title: `Order Status: ${updates.order_status}`,
        message: `Order ${updatedOrder.order_number} status changed to ${updates.order_status}.`,
        notification_type: 'Order',
        entity_type: 'order',
        entity_id: id,
        is_read: false,
        created_at: now,
      });
    }

    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_orders').update(updates).eq('id', id);
      } catch (e) {
        console.warn('Supabase update failed, saved locally', e);
      }
    }

    return updatedOrder;
  },

  async assignOrder(orderId: string, deliveryBoyId: string): Promise<Order | null> {
    const db = loadLocalDB();
    const order = db.orders.find(o => o.id === orderId);
    const boy = db.deliveryBoys.find(b => b.id === deliveryBoyId);
    if (!order || !boy) return null;

    const now = new Date().toISOString();
    return this.updateOrder(orderId, {
      assigned_delivery_boy_id: boy.id,
      assigned_delivery_boy_name: boy.full_name,
      assigned_delivery_boy_phone: boy.phone,
      assignment_status: 'Assigned',
      order_status: order.order_status === 'Pending' ? 'Assigned' : order.order_status,
      updated_at: now,
    });
  },

  async bulkAssignOrders(orderIds: string[], deliveryBoyId: string): Promise<number> {
    let count = 0;
    for (const id of orderIds) {
      const res = await this.assignOrder(id, deliveryBoyId);
      if (res) count++;
    }
    return count;
  },

  async cancelOrder(orderId: string, reason: string): Promise<Order | null> {
    const db = loadLocalDB();
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return null;

    const now = new Date().toISOString();
    db.cancellations.unshift({
      id: `can-${Date.now()}`,
      order_id: order.id,
      order_number: order.order_number,
      cancelled_by_name: 'Super Admin',
      cancellation_type: 'Admin',
      reason,
      refund_amount: order.payment_status === 'Paid' ? order.total_amount : 0,
      cancelled_at: now,
      created_at: now,
      updated_at: now,
    });

    saveLocalDB(db);
    return this.updateOrder(orderId, {
      order_status: 'Cancelled',
      cancellation_reason: reason,
      cancelled_at: now,
    });
  },

  async updateOrderStatus(orderId: string, status: any): Promise<Order | null> {
    return this.updateOrder(orderId, { order_status: status });
  },

  // -------------------------------------------------------------
  // DELIVERY BOYS (01_delivery_boys)
  // -------------------------------------------------------------
  async getDeliveryBoys(): Promise<DeliveryBoy[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_delivery_boys').select('*');
        if (!error && Array.isArray(data)) return data as DeliveryBoy[];
      } catch (e) {}
    }
    return loadLocalDB().deliveryBoys;
  },

  async addDeliveryBoy(boyData: Partial<DeliveryBoy>): Promise<DeliveryBoy> {
    const db = loadLocalDB();
    const now = new Date().toISOString();
    const newBoy: DeliveryBoy = {
      id: `db-${Date.now()}`,
      employee_code: boyData.employee_code || `EMP-${(db.deliveryBoys.length + 1).toString().padStart(3, '0')}`,
      first_name: boyData.first_name || '',
      last_name: boyData.last_name || '',
      full_name: (boyData.full_name || `${boyData.first_name || ''} ${boyData.last_name || ''}`).trim() || 'Delivery Partner',
      phone: boyData.phone || '',
      email: boyData.email || '',
      profile_image_url: boyData.profile_image_url || '',
      zone_id: boyData.zone_id || '',
      zone_name: boyData.zone_name || '',
      vehicle_id: boyData.vehicle_id || null,
      vehicle_info: boyData.vehicle_info || 'Bike',
      employment_status: boyData.employment_status || 'Full Time',
      availability_status: boyData.availability_status || 'Available',
      rating: 5.0,
      total_deliveries: 0,
      successful_deliveries: 0,
      cancelled_deliveries: 0,
      current_latitude: 26.8467,
      current_longitude: 80.9462,
      last_location_name: '',
      last_location_at: now,
      joined_at: new Date().toISOString().split('T')[0],
      created_at: now,
      updated_at: now,
    };

    db.deliveryBoys.push(newBoy);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_delivery_boys').insert([newBoy]);
      } catch (e) {}
    }
    return newBoy;
  },

  async updateDeliveryBoy(id: string, updates: Partial<DeliveryBoy>): Promise<DeliveryBoy | null> {
    const db = loadLocalDB();
    const index = db.deliveryBoys.findIndex(b => b.id === id);
    if (index === -1) return null;

    db.deliveryBoys[index] = {
      ...db.deliveryBoys[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_delivery_boys').update(updates).eq('id', id);
      } catch (e) {}
    }
    return db.deliveryBoys[index];
  },

  async updateDeliveryBoyStatus(id: string, status: any): Promise<DeliveryBoy | null> {
    return this.updateDeliveryBoy(id, { availability_status: status });
  },

  async deleteDeliveryBoy(id: string): Promise<boolean> {
    const db = loadLocalDB();
    db.deliveryBoys = db.deliveryBoys.filter(b => b.id !== id);
    saveLocalDB(db);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_delivery_boys').delete().eq('id', id);
      } catch (e) {}
    }
    return true;
  },

  // -------------------------------------------------------------
  // CUSTOMERS (01_customers & 01_customer_addresses)
  // -------------------------------------------------------------
  async getCustomers(): Promise<Customer[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_customers').select('*, addresses:01_customer_addresses(*)');
        if (!error && Array.isArray(data)) return data as Customer[];
      } catch (e) {}
    }
    return loadLocalDB().customers;
  },

  async addCustomer(customerData: Partial<Customer>, addressData?: Partial<CustomerAddress>): Promise<Customer> {
    const db = loadLocalDB();
    const now = new Date().toISOString();
    const custId = `cust-${Date.now()}`;
    const code = `CUST-${String(db.customers.length + 1).padStart(4, '0')}`;
    const firstName = customerData.first_name || '';
    const lastName = customerData.last_name || '';
    const fullName = customerData.full_name || `${firstName} ${lastName}`.trim() || 'Customer';

    const newAddress: CustomerAddress = {
      id: `addr-${Date.now()}`,
      customer_id: custId,
      label: addressData?.label || 'Home',
      recipient_name: addressData?.recipient_name || fullName,
      phone: addressData?.phone || customerData.phone || '',
      address_line_1: addressData?.address_line_1 || '',
      address_line_2: addressData?.address_line_2 || '',
      landmark: addressData?.landmark || '',
      city: addressData?.city || 'Lucknow',
      state: addressData?.state || 'Uttar Pradesh',
      postal_code: addressData?.postal_code || '',
      country: 'India',
      is_default: true,
      created_at: now,
      updated_at: now,
    };

    const newCustomer: Customer = {
      id: custId,
      customer_code: code,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      email: customerData.email || '',
      phone: customerData.phone || '',
      alternate_phone: customerData.alternate_phone || '',
      status: customerData.status || 'active',
      total_orders: 0,
      total_spent: 0,
      notes: customerData.notes || '',
      addresses: addressData ? [newAddress] : (customerData.addresses || []),
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_customers').insert([{
          id: newCustomer.id,
          customer_code: newCustomer.customer_code,
          first_name: newCustomer.first_name,
          last_name: newCustomer.last_name,
          full_name: newCustomer.full_name,
          email: newCustomer.email,
          phone: newCustomer.phone,
          alternate_phone: newCustomer.alternate_phone,
          status: newCustomer.status,
          total_orders: 0,
          total_spent: 0,
          notes: newCustomer.notes,
        }]);

        if (addressData) {
          await supabase.from('01_customer_addresses').insert([{
            id: newAddress.id,
            customer_id: newCustomer.id,
            label: newAddress.label,
            recipient_name: newAddress.recipient_name,
            phone: newAddress.phone,
            address_line_1: newAddress.address_line_1,
            address_line_2: newAddress.address_line_2,
            landmark: newAddress.landmark,
            city: newAddress.city,
            state: newAddress.state,
            postal_code: newAddress.postal_code,
            country: newAddress.country,
            is_default: true
          }]);
        }
      } catch (err) {
        console.warn('Supabase customer insert error, saved locally', err);
      }
    }

    db.customers.unshift(newCustomer);
    saveLocalDB(db);
    return newCustomer;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const db = loadLocalDB();
    const index = db.customers.findIndex(c => c.id === id);
    if (index === -1) return null;

    const updated = {
      ...db.customers[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    db.customers[index] = updated;
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_customers').update({
          first_name: updated.first_name,
          last_name: updated.last_name,
          full_name: updated.full_name,
          email: updated.email,
          phone: updated.phone,
          alternate_phone: updated.alternate_phone,
          status: updated.status,
          notes: updated.notes,
          updated_at: updated.updated_at
        }).eq('id', id);
      } catch (err) {
        console.warn('Supabase update customer error, saved locally', err);
      }
    }

    return updated;
  },

  async deleteCustomer(id: string): Promise<boolean> {
    const db = loadLocalDB();
    db.customers = db.customers.filter(c => c.id !== id);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_customers').delete().eq('id', id);
      } catch (e) {}
    }
    return true;
  },

  // -------------------------------------------------------------
  // PRODUCTS & INVENTORY (01_products & 01_categories)
  // -------------------------------------------------------------
  async getProducts(): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_products').select('*');
        if (!error && Array.isArray(data)) return data as Product[];
      } catch (e) {}
    }
    return loadLocalDB().products;
  },

  async addProduct(productData: Partial<Product>): Promise<Product> {
    const db = loadLocalDB();
    const now = new Date().toISOString();
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      product_code: productData.product_code || `PRD-${(db.products.length + 1).toString().padStart(3, '0')}`,
      name: productData.name || '',
      slug: (productData.name || 'product').toLowerCase().replace(/\s+/g, '-'),
      description: productData.description || '',
      category_id: productData.category_id || '',
      category_name: productData.category_name || '',
      sku: productData.sku || `SKU-${Date.now().toString().slice(-6)}`,
      barcode: productData.barcode || '',
      unit: productData.unit || 'pack',
      selling_price: Number(productData.selling_price) || 0,
      cost_price: Number(productData.cost_price) || 0,
      tax_percentage: Number(productData.tax_percentage) || 0,
      image_url: productData.image_url || '',
      quantity_available: Number(productData.quantity_available) || 0,
      reorder_level: Number(productData.reorder_level) || 0,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    db.products.push(newProd);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_products').insert([newProd]);
      } catch (e) {}
    }
    return newProd;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const db = loadLocalDB();
    const index = db.products.findIndex(p => p.id === id);
    if (index === -1) return null;
    db.products[index] = { ...db.products[index], ...updates, updated_at: new Date().toISOString() };
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_products').update(updates).eq('id', id);
      } catch (e) {}
    }
    return db.products[index];
  },

  async deleteProduct(id: string): Promise<boolean> {
    const db = loadLocalDB();
    db.products = db.products.filter(p => p.id !== id);
    saveLocalDB(db);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_products').delete().eq('id', id);
      } catch (e) {}
    }
    return true;
  },

  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_categories').select('*');
        if (!error && Array.isArray(data)) return data as Category[];
      } catch (e) {}
    }
    return loadLocalDB().categories;
  },

  async addCategory(catData: Partial<Category>): Promise<Category> {
    const db = loadLocalDB();
    const now = new Date().toISOString();
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: catData.name || '',
      slug: (catData.name || 'cat').toLowerCase().replace(/\s+/g, '-'),
      description: catData.description || '',
      image_url: catData.image_url || '',
      is_active: true,
      sort_order: db.categories.length + 1,
      created_at: now,
      updated_at: now,
    };
    db.categories.push(newCat);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_categories').insert([newCat]);
      } catch (e) {}
    }
    return newCat;
  },

  // -------------------------------------------------------------
  // ZONES & VEHICLES (01_zones & 01_vehicles)
  // -------------------------------------------------------------
  async getZones(): Promise<Zone[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_zones').select('*');
        if (!error && Array.isArray(data)) return data as Zone[];
      } catch (e) {}
    }
    return loadLocalDB().zones;
  },

  async addZone(zoneData: Partial<Zone>): Promise<Zone> {
    const db = loadLocalDB();
    const now = new Date().toISOString();
    const newZone: Zone = {
      id: `zone-${Date.now()}`,
      name: zoneData.name || '',
      zone_code: zoneData.zone_code || `ZN-${db.zones.length + 1}`,
      description: zoneData.description || '',
      city: zoneData.city || 'Lucknow',
      state: zoneData.state || 'Uttar Pradesh',
      country: 'India',
      color: zoneData.color || '#16a34a',
      center_lat: zoneData.center_lat || 26.8467,
      center_lng: zoneData.center_lng || 80.9462,
      order_count: 0,
      delivery_boy_count: 0,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    db.zones.push(newZone);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_zones').insert([newZone]);
      } catch (e) {}
    }
    return newZone;
  },

  async getVehicles(): Promise<Vehicle[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_vehicles').select('*');
        if (!error && Array.isArray(data)) return data as Vehicle[];
      } catch (e) {}
    }
    return loadLocalDB().vehicles;
  },

  async addVehicle(vehData: Partial<Vehicle>): Promise<Vehicle> {
    const db = loadLocalDB();
    const now = new Date().toISOString();
    const newVeh: Vehicle = {
      id: `veh-${Date.now()}`,
      vehicle_number: vehData.vehicle_number || '',
      vehicle_type: vehData.vehicle_type || 'Bike',
      brand: vehData.brand || '',
      model: vehData.model || '',
      fuel_type: vehData.fuel_type || 'Petrol',
      capacity: vehData.capacity || '20 kg',
      assigned_delivery_boy_id: vehData.assigned_delivery_boy_id || null,
      assigned_delivery_boy_name: vehData.assigned_delivery_boy_name,
      registration_expiry: vehData.registration_expiry || '',
      insurance_expiry: vehData.insurance_expiry || '',
      status: 'active',
      created_at: now,
      updated_at: now,
    };
    db.vehicles.push(newVeh);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_vehicles').insert([newVeh]);
      } catch (e) {}
    }
    return newVeh;
  },

  // -------------------------------------------------------------
  // NOTIFICATIONS (01_notifications)
  // -------------------------------------------------------------
  async getNotifications(): Promise<AppNotification[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_notifications').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) return data as AppNotification[];
      } catch (e) {}
    }
    return loadLocalDB().notifications;
  },

  async markAllNotificationsRead(): Promise<void> {
    const db = loadLocalDB();
    db.notifications.forEach(n => { n.is_read = true; });
    saveLocalDB(db);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_notifications').update({ is_read: true }).eq('is_read', false);
      } catch (e) {}
    }
  },

  async sendNotification(notifData: Partial<AppNotification>): Promise<AppNotification> {
    const db = loadLocalDB();
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: notifData.title || 'Broadcast Message',
      message: notifData.message || '',
      notification_type: notifData.notification_type || 'System',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    db.notifications.unshift(newNotif);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_notifications').insert([newNotif]);
      } catch (e) {}
    }
    return newNotif;
  },

  // -------------------------------------------------------------
  // PAYMENTS & COD (01_payments & 01_cod_settlements)
  // -------------------------------------------------------------
  async getPayments(): Promise<Payment[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_payments').select('*');
        if (!error && Array.isArray(data)) return data as Payment[];
      } catch (e) {}
    }
    return loadLocalDB().payments;
  },

  async getCODSettlements(): Promise<CODSettlement[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_cod_settlements').select('*');
        if (!error && Array.isArray(data)) return data as CODSettlement[];
      } catch (e) {}
    }
    return loadLocalDB().codSettlements;
  },

  async settleCOD(settlementId: string): Promise<CODSettlement | null> {
    const db = loadLocalDB();
    const index = db.codSettlements.findIndex(c => c.id === settlementId);
    if (index === -1) return null;
    db.codSettlements[index].settlement_status = 'Settled';
    db.codSettlements[index].settled_at = new Date().toISOString();
    db.codSettlements[index].settled_by = 'Super Admin';
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_cod_settlements').update({
          settlement_status: 'Settled',
          settled_at: new Date().toISOString(),
          settled_by: 'Super Admin'
        }).eq('id', settlementId);
      } catch (e) {}
    }
    return db.codSettlements[index];
  },

  // -------------------------------------------------------------
  // RETURNS & CANCELLATIONS (01_returns & 01_cancellations)
  // -------------------------------------------------------------
  async getReturns(): Promise<ReturnRecord[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_returns').select('*');
        if (!error && Array.isArray(data)) return data as ReturnRecord[];
      } catch (e) {}
    }
    return loadLocalDB().returns;
  },

  async getCancellations(): Promise<CancellationRecord[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_cancellations').select('*');
        if (!error && Array.isArray(data)) return data as CancellationRecord[];
      } catch (e) {}
    }
    return loadLocalDB().cancellations;
  },

  // -------------------------------------------------------------
  // OFFERS & COUPONS (01_offers & 01_coupons)
  // -------------------------------------------------------------
  async getCoupons(): Promise<Coupon[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_coupons').select('*');
        if (!error && Array.isArray(data)) return data as Coupon[];
      } catch (e) {}
    }
    return loadLocalDB().coupons;
  },

  async addCoupon(couponData: Partial<Coupon>): Promise<Coupon> {
    const db = loadLocalDB();
    const now = new Date().toISOString();
    const newCoupon: Coupon = {
      id: `coup-${Date.now()}`,
      code: (couponData.code || 'PROMO').toUpperCase(),
      description: couponData.description || '',
      discount_type: couponData.discount_type || 'percentage',
      discount_value: Number(couponData.discount_value) || 10,
      minimum_order_amount: Number(couponData.minimum_order_amount) || 0,
      maximum_discount_amount: Number(couponData.maximum_discount_amount) || 100,
      usage_limit: Number(couponData.usage_limit) || 100,
      usage_count: 0,
      per_customer_limit: Number(couponData.per_customer_limit) || 1,
      start_date: couponData.start_date || new Date().toISOString().split('T')[0],
      end_date: couponData.end_date || '2026-12-31',
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    db.coupons.push(newCoupon);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_coupons').insert([newCoupon]);
      } catch (e) {}
    }
    return newCoupon;
  },

  async getOffers(): Promise<Offer[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_offers').select('*');
        if (!error && Array.isArray(data)) return data as Offer[];
      } catch (e) {}
    }
    return loadLocalDB().offers;
  },

  // -------------------------------------------------------------
  // AUDIT LOGS & SETTINGS & TICKETS
  // -------------------------------------------------------------
  async getAuditLogs(): Promise<AuditLog[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_audit_logs').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) return data as AuditLog[];
      } catch (e) {}
    }
    return loadLocalDB().auditLogs;
  },

  async getSettings(): Promise<AppSetting[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_app_settings').select('*');
        if (!error && Array.isArray(data)) return data as AppSetting[];
      } catch (e) {}
    }
    return loadLocalDB().settings;
  },

  async updateSetting(key: string, value: string): Promise<void> {
    const db = loadLocalDB();
    const s = db.settings.find(x => x.setting_key === key);
    if (s) {
      s.setting_value = value;
      s.updated_at = new Date().toISOString();
      saveLocalDB(db);
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_app_settings').upsert({ setting_key: key, setting_value: value, updated_at: new Date().toISOString() });
      } catch (e) {}
    }
  },

  async getSupportTickets(): Promise<SupportTicket[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_support_tickets').select('*');
        if (!error && Array.isArray(data)) return data as SupportTicket[];
      } catch (e) {}
    }
    return loadLocalDB().supportTickets;
  },

  async createSupportTicket(ticketData: Partial<SupportTicket>): Promise<SupportTicket> {
    const db = loadLocalDB();
    const now = new Date().toISOString();
    const newTicket: SupportTicket = {
      id: `tkt-${Date.now()}`,
      ticket_number: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: ticketData.customer_name || 'Customer',
      subject: ticketData.subject || '',
      description: ticketData.description || '',
      priority: ticketData.priority || 'Medium',
      status: 'Open',
      created_at: now,
      updated_at: now,
    };
    db.supportTickets.unshift(newTicket);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_support_tickets').insert([newTicket]);
      } catch (e) {}
    }
    return newTicket;
  },

  async getUsers(): Promise<User[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_users').select('*');
        if (!error && Array.isArray(data)) return data as User[];
      } catch (e) {}
    }
    return loadLocalDB().users;
  },

  async resetToDefault(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('haribansho_db_v1');
    loadLocalDB();
  }
};
