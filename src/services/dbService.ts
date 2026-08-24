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
  UserRole,
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
  initialUsers,
  initialRoles
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
  roles: UserRole[];
  assignments: DeliveryAssignment[];
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function cleanUUID(str?: string | null): string | null {
  if (!str || typeof str !== 'string' || str.trim() === '') return null;
  if (isValidUUID(str)) return str;
  return null;
}

/**
 * Reconcile Supabase dataset with Local Storage dataset.
 * Guarantees that locally created items that haven't synced to Supabase (or failed Supabase insert)
 * are NEVER lost or discarded from the UI dashboards.
 */
function reconcileLocalAndSupabase<T extends { id: string }>(
  supabaseItems: T[],
  localItems: T[]
): T[] {
  const mergedMap = new Map<string, T>();

  // 1. Add Supabase items to map
  for (const item of supabaseItems) {
    if (item && item.id) {
      mergedMap.set(item.id, item);
    }
  }

  // 2. Add local items that aren't in Supabase or have local updates
  for (const item of localItems) {
    if (item && item.id) {
      if (!mergedMap.has(item.id)) {
        mergedMap.set(item.id, item);
      } else {
        const existing = mergedMap.get(item.id)!;
        mergedMap.set(item.id, { ...existing, ...item });
      }
    }
  }

  return Array.from(mergedMap.values());
}

function loadLocalDB(): LocalDBState {
  try {
    localStorage.removeItem('haribansho_db_v1');
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.roles || parsed.roles.length === 0) {
        parsed.roles = initialRoles;
      }
      if (!parsed.users || parsed.users.length === 0) {
        parsed.users = initialUsers;
      }
      return parsed;
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
    roles: initialRoles,
    assignments: []
  };

  saveLocalDB(defaultState);
  return defaultState;
}

function saveLocalDB(state: LocalDBState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save local DB', e);
  }
}

// Data service with automatic dual-store reconciliation
export const dbService = {
  // -------------------------------------------------------------
  // DASHBOARD STATS
  // -------------------------------------------------------------
  async getDashboardStats(): Promise<DashboardStats> {
    const orders = await this.getOrders();
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.order_status === 'Pending').length;
    const assignedOrders = orders.filter(o => o.order_status === 'Assigned' || o.order_status === 'Out for Delivery').length;
    const deliveredOrders = orders.filter(o => o.order_status === 'Delivered').length;
    const cancelledOrders = orders.filter(o => o.order_status === 'Cancelled').length;

    const totalRevenue = orders
      .filter(o => o.order_status === 'Delivered')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

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
      totalOrdersGrowth: 0,
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
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<Order>(data as Order[], db.orders);
          db.orders = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_orders] getOrders warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch orders error, using local dataset:', e);
      }
    }
    return db.orders;
  },

  async getOrderById(id: string): Promise<Order | null> {
    const orders = await this.getOrders();
    return orders.find(o => o.id === id || o.order_number === id) || null;
  },

  async createOrder(orderData: Partial<Order> & { items?: any[] }): Promise<Order> {
    const db = loadLocalDB();
    const orderSeq = (db.orders.length + 1).toString().padStart(4, '0');
    const orderNumber = orderData.order_number || `#ORD${orderSeq}`;
    const id = generateUUID();
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

    if (newOrder.assigned_delivery_boy_id) {
      db.assignments.unshift({
        id: generateUUID(),
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

    db.notifications.unshift({
      id: generateUUID(),
      title: 'New Order Punched',
      message: `New order ${newOrder.order_number} for ${newOrder.customer_name} (₹${newOrder.total_amount.toFixed(2)}) has been created.`,
      notification_type: 'Order',
      entity_type: 'order',
      entity_id: newOrder.id,
      is_read: false,
      created_at: now,
    });

    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: newOrder.id,
          order_number: newOrder.order_number,
          customer_id: cleanUUID(newOrder.customer_id),
          customer_name: newOrder.customer_name,
          customer_phone: newOrder.customer_phone,
          delivery_address_id: cleanUUID(newOrder.delivery_address_id),
          delivery_address_text: newOrder.delivery_address_text,
          zone_id: cleanUUID(newOrder.zone_id),
          zone_name: newOrder.zone_name,
          order_status: newOrder.order_status,
          assignment_status: newOrder.assignment_status,
          assigned_delivery_boy_id: cleanUUID(newOrder.assigned_delivery_boy_id),
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
        };

        console.log('[Supabase 01_orders] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_orders').insert([payload]).select();
        if (error) {
          console.error('❌ [Supabase 01_orders] insert Error:', error.message, 'Code:', error.code, 'Details:', error.details, 'Hint:', error.hint);
        } else {
          console.log('✅ [Supabase 01_orders] insert Response Success:', data);
        }

        if (newOrder.items && newOrder.items.length > 0) {
          const itemsPayload = newOrder.items.map((item: any) => ({
            id: generateUUID(),
            order_id: newOrder.id,
            product_id: cleanUUID(item.product_id),
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price || (item.unit_price * item.quantity),
            created_at: now
          }));
          console.log('[Supabase 01_order_items] insert Request Payload:', itemsPayload);
          const { data: itemsData, error: itemsErr } = await supabase.from('01_order_items').insert(itemsPayload).select();
          if (itemsErr) {
            console.error('❌ [Supabase 01_order_items] insert Error:', itemsErr.message, 'Details:', itemsErr.details);
          } else {
            console.log('✅ [Supabase 01_order_items] insert Response Success:', itemsData);
          }
        }
      } catch (e) {
        console.error('❌ [Supabase 01_orders] insert exception:', e);
      }
    }

    return newOrder;
  },

  async addOrder(orderData: Partial<Order> & { items?: any[] }): Promise<Order> {
    return this.createOrder(orderData);
  },

  async updateOrderStatus(orderId: string, status: Order['order_status'], driverNotes?: string): Promise<Order | null> {
    const db = loadLocalDB();
    const idx = db.orders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;

    const now = new Date().toISOString();
    db.orders[idx].order_status = status;
    db.orders[idx].updated_at = now;
    if (driverNotes) db.orders[idx].customer_notes = driverNotes;

    if (status === 'Delivered' && db.orders[idx].payment_method === 'COD') {
      db.orders[idx].payment_status = 'COD Collected';
      db.codSettlements.unshift({
        id: generateUUID(),
        order_id: db.orders[idx].id,
        order_number: db.orders[idx].order_number,
        delivery_boy_id: db.orders[idx].assigned_delivery_boy_id || '',
        delivery_boy_name: db.orders[idx].assigned_delivery_boy_name || 'Driver',
        amount_collected: db.orders[idx].total_amount,
        collected_at: now,
        settlement_status: 'Pending',
        created_at: now,
        updated_at: now,
      });
    }

    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const updatePayload: any = {
          order_status: status,
          updated_at: now
        };
        if (status === 'Delivered' && db.orders[idx].payment_method === 'COD') {
          updatePayload.payment_status = 'COD Collected';
        }
        console.log('[Supabase 01_orders] updateOrderStatus Request Payload:', { orderId, updatePayload });
        const { data, error } = await supabase.from('01_orders').update(updatePayload).eq('id', orderId).select();
        if (error) {
          console.error('❌ [Supabase 01_orders] status update Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_orders] status update Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_orders] status update exception:', e);
      }
    }

    return db.orders[idx];
  },

  async assignOrder(orderId: string, deliveryBoyId: string): Promise<Order | null> {
    const db = loadLocalDB();
    const order = db.orders.find(o => o.id === orderId);
    const boy = db.deliveryBoys.find(b => b.id === deliveryBoyId);
    if (!order || !boy) return null;

    const now = new Date().toISOString();
    order.assigned_delivery_boy_id = boy.id;
    order.assigned_delivery_boy_name = boy.full_name;
    order.assigned_delivery_boy_phone = boy.phone;
    order.assignment_status = 'Assigned';
    if (order.order_status === 'Pending') {
      order.order_status = 'Assigned';
    }
    order.updated_at = now;

    db.assignments.unshift({
      id: generateUUID(),
      order_id: order.id,
      order_number: order.order_number,
      delivery_boy_id: boy.id,
      delivery_boy_name: boy.full_name,
      assigned_by: 'Super Admin',
      assignment_status: 'Assigned',
      assigned_at: now,
      created_at: now,
      updated_at: now,
    });

    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('01_orders').update({
          assigned_delivery_boy_id: cleanUUID(boy.id),
          assigned_delivery_boy_name: boy.full_name,
          assigned_delivery_boy_phone: boy.phone,
          assignment_status: 'Assigned',
          order_status: order.order_status,
          updated_at: now
        }).eq('id', orderId);
        if (error) console.warn('[Supabase 01_orders] assign error:', error.message);
      } catch (e) {
        console.warn('Supabase assign order error:', e);
      }
    }

    return order;
  },

  async bulkAssignOrders(orderIds: string[], deliveryBoyId: string): Promise<number> {
    let count = 0;
    for (const oid of orderIds) {
      const res = await this.assignOrder(oid, deliveryBoyId);
      if (res) count++;
    }
    return count;
  },

  // -------------------------------------------------------------
  // DELIVERY BOYS (01_delivery_boys)
  // -------------------------------------------------------------
  async getDeliveryBoys(): Promise<DeliveryBoy[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_delivery_boys')
          .select('*')
          .order('full_name', { ascending: true });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<DeliveryBoy>(data as DeliveryBoy[], db.deliveryBoys);
          db.deliveryBoys = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_delivery_boys] getDeliveryBoys warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch delivery boys error, using local dataset:', e);
      }
    }
    return db.deliveryBoys;
  },

  async getDeliveryBoyById(id: string): Promise<DeliveryBoy | null> {
    const boys = await this.getDeliveryBoys();
    return boys.find(b => b.id === id) || null;
  },

  async addDeliveryBoy(boyData: Partial<DeliveryBoy>): Promise<DeliveryBoy> {
    const db = loadLocalDB();
    const seq = (db.deliveryBoys.length + 1).toString().padStart(3, '0');
    const employeeCode = boyData.employee_code || `DB-${seq}`;
    const id = generateUUID();
    const now = new Date().toISOString();

    const fullName = `${boyData.first_name || ''} ${boyData.last_name || ''}`.trim() || boyData.full_name || 'Courier Partner';

    const newBoy: DeliveryBoy = {
      id,
      employee_code: employeeCode,
      first_name: boyData.first_name || 'Rider',
      last_name: boyData.last_name || '',
      full_name: fullName,
      phone: boyData.phone || '+91 98000 00000',
      email: boyData.email || '',
      app_username: boyData.app_username || boyData.phone || 'rider_' + Date.now().toString().slice(-4),
      login_password: boyData.login_password || 'Rider@123',
      profile_image_url: boyData.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      zone_id: boyData.zone_id || 'zone-1',
      zone_name: boyData.zone_name || 'North Zone',
      vehicle_id: boyData.vehicle_id || 'veh-1',
      vehicle_info: boyData.vehicle_info || 'Hero Splendor (UP32 AB 1234)',
      employment_status: boyData.employment_status || 'Active',
      availability_status: boyData.availability_status || 'Available',
      rating: 4.8,
      total_deliveries: 0,
      successful_deliveries: 0,
      cancelled_deliveries: 0,
      current_latitude: 26.8467,
      current_longitude: 80.9462,
      last_location_name: 'Hazratganj Main, Lucknow',
      last_location_at: now,
      joined_at: now,
      created_at: now,
      updated_at: now,
    };

    db.deliveryBoys.unshift(newBoy);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: newBoy.id,
          employee_code: newBoy.employee_code,
          first_name: newBoy.first_name,
          last_name: newBoy.last_name,
          full_name: newBoy.full_name,
          phone: newBoy.phone,
          email: newBoy.email || null,
          profile_image_url: newBoy.profile_image_url,
          zone_id: cleanUUID(newBoy.zone_id),
          zone_name: newBoy.zone_name,
          vehicle_id: cleanUUID(newBoy.vehicle_id),
          vehicle_info: newBoy.vehicle_info,
          employment_status: newBoy.employment_status,
          availability_status: newBoy.availability_status,
          rating: newBoy.rating,
          total_deliveries: newBoy.total_deliveries,
          successful_deliveries: newBoy.successful_deliveries,
          cancelled_deliveries: newBoy.cancelled_deliveries,
          current_latitude: newBoy.current_latitude,
          current_longitude: newBoy.current_longitude,
          last_location_name: newBoy.last_location_name,
          last_location_at: newBoy.last_location_at,
          joined_at: newBoy.joined_at,
          created_at: newBoy.created_at,
          updated_at: newBoy.updated_at
        };

        console.log('[Supabase 01_delivery_boys] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_delivery_boys').insert([payload]).select();
        if (error) {
          console.error('❌ [Supabase 01_delivery_boys] insert Error:', error.message, 'Code:', error.code, 'Details:', error.details, 'Hint:', error.hint);
        } else {
          console.log('✅ [Supabase 01_delivery_boys] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_delivery_boys] insert exception:', e);
      }
    }

    return newBoy;
  },

  async updateDeliveryBoy(id: string, updates: Partial<DeliveryBoy>): Promise<DeliveryBoy | null> {
    const db = loadLocalDB();
    const idx = db.deliveryBoys.findIndex(b => b.id === id);
    if (idx === -1) return null;

    db.deliveryBoys[idx] = {
      ...db.deliveryBoys[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_delivery_boys] update Request Payload:', { id, updates });
        const { data, error } = await supabase.from('01_delivery_boys').update(updates).eq('id', id).select();
        if (error) {
          console.error('❌ [Supabase 01_delivery_boys] update Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_delivery_boys] update Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_delivery_boys] update exception:', e);
      }
    }

    return db.deliveryBoys[idx];
  },

  async updateDeliveryBoyStatus(id: string, status: DeliveryBoy['availability_status']): Promise<DeliveryBoy | null> {
    return this.updateDeliveryBoy(id, { availability_status: status });
  },

  async deleteDeliveryBoy(id: string): Promise<boolean> {
    const db = loadLocalDB();
    db.deliveryBoys = db.deliveryBoys.filter(b => b.id !== id);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_delivery_boys] delete Request ID:', id);
        const { data, error } = await supabase.from('01_delivery_boys').delete().eq('id', id).select();
        if (error) {
          console.error('❌ [Supabase 01_delivery_boys] delete Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_delivery_boys] delete Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_delivery_boys] delete exception:', e);
      }
    }

    return true;
  },

  // -------------------------------------------------------------
  // CUSTOMERS (01_customers & 01_customer_addresses)
  // -------------------------------------------------------------
  async getCustomers(): Promise<Customer[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_customers')
          .select('*, addresses:01_customer_addresses(*)')
          .order('full_name', { ascending: true });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<Customer>(data as Customer[], db.customers);
          db.customers = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_customers] getCustomers warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch customers error, using local dataset:', e);
      }
    }
    return db.customers;
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const customers = await this.getCustomers();
    return customers.find(c => c.id === id) || null;
  },

  async addCustomer(customerData: Partial<Customer>, addressData?: Partial<CustomerAddress>): Promise<Customer> {
    const db = loadLocalDB();
    const seq = (db.customers.length + 1).toString().padStart(4, '0');
    const id = generateUUID();
    const now = new Date().toISOString();

    const fullName = `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() || customerData.full_name || 'Customer';

    const addrId = generateUUID();
    const createdAddress: CustomerAddress = {
      id: addrId,
      customer_id: id,
      label: addressData?.label || 'Home',
      recipient_name: addressData?.recipient_name || fullName,
      phone: addressData?.phone || customerData.phone || '',
      address_line_1: addressData?.address_line_1 || 'Main Street Road',
      address_line_2: addressData?.address_line_2 || '',
      landmark: addressData?.landmark || '',
      city: addressData?.city || 'Lucknow',
      state: addressData?.state || 'Uttar Pradesh',
      postal_code: addressData?.postal_code || '226001',
      country: addressData?.country || 'India',
      is_default: true,
      created_at: now,
      updated_at: now,
    };

    const newCustomer: Customer = {
      id,
      customer_code: customerData.customer_code || `CUST-${seq}`,
      first_name: customerData.first_name || 'Customer',
      last_name: customerData.last_name || '',
      full_name: fullName,
      email: customerData.email || '',
      phone: customerData.phone || '+91 98000 00000',
      alternate_phone: customerData.alternate_phone || '',
      status: customerData.status || 'active',
      total_orders: 0,
      total_spent: 0,
      notes: customerData.notes || '',
      addresses: [createdAddress],
      created_at: now,
      updated_at: now,
    };

    db.customers.unshift(newCustomer);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: newCustomer.id,
          customer_code: newCustomer.customer_code,
          first_name: newCustomer.first_name,
          last_name: newCustomer.last_name,
          full_name: newCustomer.full_name,
          email: newCustomer.email || null,
          phone: newCustomer.phone,
          alternate_phone: newCustomer.alternate_phone || null,
          status: newCustomer.status,
          total_orders: newCustomer.total_orders,
          total_spent: newCustomer.total_spent,
          notes: newCustomer.notes || null,
          created_at: newCustomer.created_at,
          updated_at: newCustomer.updated_at
        };

        console.log('[Supabase 01_customers] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_customers').insert([payload]).select();
        if (error) {
          console.error('❌ [Supabase 01_customers] insert Error:', error.message, 'Code:', error.code, 'Details:', error.details, 'Hint:', error.hint);
        } else {
          console.log('✅ [Supabase 01_customers] insert Response Success:', data);
        }

        const addrPayload = {
          id: createdAddress.id,
          customer_id: newCustomer.id,
          label: createdAddress.label,
          recipient_name: createdAddress.recipient_name,
          phone: createdAddress.phone,
          address_line_1: createdAddress.address_line_1,
          address_line_2: createdAddress.address_line_2 || null,
          landmark: createdAddress.landmark || null,
          city: createdAddress.city,
          state: createdAddress.state,
          postal_code: createdAddress.postal_code,
          country: createdAddress.country,
          is_default: true,
          created_at: now,
          updated_at: now
        };

        console.log('[Supabase 01_customer_addresses] insert Request Payload:', addrPayload);
        const { data: addrData, error: addrErr } = await supabase.from('01_customer_addresses').insert([addrPayload]).select();
        if (addrErr) {
          console.error('❌ [Supabase 01_customer_addresses] insert Error:', addrErr.message, 'Details:', addrErr.details);
        } else {
          console.log('✅ [Supabase 01_customer_addresses] insert Response Success:', addrData);
        }

      } catch (e) {
        console.error('❌ [Supabase 01_customers] insert exception:', e);
      }
    }

    return newCustomer;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const db = loadLocalDB();
    const idx = db.customers.findIndex(c => c.id === id);
    if (idx === -1) return null;

    db.customers[idx] = {
      ...db.customers[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const { addresses, ...dbUpdates } = updates as any;
        console.log('[Supabase 01_customers] update Request Payload:', { id, dbUpdates });
        const { data, error } = await supabase.from('01_customers').update(dbUpdates).eq('id', id).select();
        if (error) {
          console.error('❌ [Supabase 01_customers] update Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_customers] update Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_customers] update exception:', e);
      }
    }

    return db.customers[idx];
  },

  async deleteCustomer(id: string): Promise<boolean> {
    const db = loadLocalDB();
    db.customers = db.customers.filter(c => c.id !== id);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_customers] delete Request ID:', id);
        await supabase.from('01_customer_addresses').delete().eq('customer_id', id);
        const { data, error } = await supabase.from('01_customers').delete().eq('id', id).select();
        if (error) {
          console.error('❌ [Supabase 01_customers] delete Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_customers] delete Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_customers] delete exception:', e);
      }
    }

    return true;
  },

  // -------------------------------------------------------------
  // PRODUCTS (01_products)
  // -------------------------------------------------------------
  async getProducts(): Promise<Product[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_products')
          .select('*')
          .order('name', { ascending: true });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<Product>(data as Product[], db.products);
          db.products = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_products] getProducts warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch products error, using local dataset:', e);
      }
    }
    return db.products;
  },

  async getProductById(id: string): Promise<Product | null> {
    const prods = await this.getProducts();
    return prods.find(p => p.id === id) || null;
  },

  async addProduct(productData: Partial<Product>): Promise<Product> {
    const db = loadLocalDB();
    const seq = (db.products.length + 1).toString().padStart(3, '0');
    const id = generateUUID();
    const now = new Date().toISOString();

    const name = productData.name || 'New Product';
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newProduct: Product = {
      id,
      product_code: productData.product_code || `PRD-${seq}`,
      name,
      slug,
      description: productData.description || '',
      category_id: productData.category_id || 'cat-1',
      category_name: productData.category_name || 'Grocery',
      sku: productData.sku || `SKU-${seq}`,
      barcode: productData.barcode || `890${seq}`,
      unit: productData.unit || 'Kg',
      selling_price: Number(productData.selling_price) || 100,
      cost_price: Number(productData.cost_price) || 80,
      tax_percentage: Number(productData.tax_percentage) || 5,
      image_url: productData.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300',
      quantity_available: Number(productData.quantity_available) || 50,
      reorder_level: Number(productData.reorder_level) || 10,
      is_active: productData.is_active !== false,
      created_at: now,
      updated_at: now,
    };

    db.products.unshift(newProduct);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: newProduct.id,
          product_code: newProduct.product_code,
          name: newProduct.name,
          slug: newProduct.slug,
          description: newProduct.description,
          category_id: cleanUUID(newProduct.category_id),
          category_name: newProduct.category_name,
          sku: newProduct.sku,
          barcode: newProduct.barcode,
          unit: newProduct.unit,
          selling_price: newProduct.selling_price,
          cost_price: newProduct.cost_price,
          tax_percentage: newProduct.tax_percentage,
          image_url: newProduct.image_url,
          quantity_available: newProduct.quantity_available,
          reorder_level: newProduct.reorder_level,
          is_active: newProduct.is_active,
          created_at: newProduct.created_at,
          updated_at: newProduct.updated_at
        };

        console.log('[Supabase 01_products] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_products').insert([payload]).select();
        if (error) {
          console.error('❌ [Supabase 01_products] insert Error:', error.message, 'Code:', error.code, 'Details:', error.details, 'Hint:', error.hint);
        } else {
          console.log('✅ [Supabase 01_products] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_products] insert exception:', e);
      }
    }

    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const db = loadLocalDB();
    const idx = db.products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    db.products[idx] = {
      ...db.products[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_products] update Request Payload:', { id, updates });
        const { data, error } = await supabase.from('01_products').update(updates).eq('id', id).select();
        if (error) {
          console.error('❌ [Supabase 01_products] update Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_products] update Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_products] update exception:', e);
      }
    }

    return db.products[idx];
  },

  async deleteProduct(id: string): Promise<boolean> {
    const db = loadLocalDB();
    db.products = db.products.filter(p => p.id !== id);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_products] delete Request ID:', id);
        const { data, error } = await supabase.from('01_products').delete().eq('id', id).select();
        if (error) {
          console.error('❌ [Supabase 01_products] delete Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_products] delete Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_products] delete exception:', e);
      }
    }

    return true;
  },

  // -------------------------------------------------------------
  // CATEGORIES (01_categories)
  // -------------------------------------------------------------
  async getCategories(): Promise<Category[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_categories')
          .select('*')
          .order('name', { ascending: true });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<Category>(data as Category[], db.categories);
          db.categories = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_categories] getCategories warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch categories error, using local dataset:', e);
      }
    }
    return db.categories;
  },

  async addCategory(catData: Partial<Category>): Promise<Category> {
    const db = loadLocalDB();
    const id = generateUUID();
    const now = new Date().toISOString();
    const name = catData.name || 'New Category';

    const newCategory: Category = {
      id,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: catData.description || '',
      image_url: catData.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300',
      is_active: catData.is_active !== false,
      sort_order: catData.sort_order || db.categories.length + 1,
      created_at: now,
      updated_at: now,
    };

    db.categories.push(newCategory);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: newCategory.id,
          name: newCategory.name,
          slug: newCategory.slug,
          description: newCategory.description || null,
          image_url: newCategory.image_url || null,
          is_active: newCategory.is_active,
          sort_order: newCategory.sort_order,
          created_at: newCategory.created_at,
          updated_at: newCategory.updated_at
        };

        console.log('[Supabase 01_categories] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_categories').insert([payload]).select();
        if (error) {
          console.error('❌ [Supabase 01_categories] insert Error:', error.message, 'Code:', error.code, 'Details:', error.details, 'Hint:', error.hint);
        } else {
          console.log('✅ [Supabase 01_categories] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_categories] insert exception:', e);
      }
    }

    return newCategory;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const db = loadLocalDB();
    const idx = db.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;

    db.categories[idx] = {
      ...db.categories[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_categories] update Request Payload:', { id, updates });
        const { data, error } = await supabase.from('01_categories').update(updates).eq('id', id).select();
        if (error) {
          console.error('❌ [Supabase 01_categories] update Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_categories] update Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_categories] update exception:', e);
      }
    }

    return db.categories[idx];
  },

  async deleteCategory(id: string): Promise<boolean> {
    const db = loadLocalDB();
    db.categories = db.categories.filter(c => c.id !== id);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_categories] delete Request ID:', id);
        const { data, error } = await supabase.from('01_categories').delete().eq('id', id).select();
        if (error) {
          console.error('❌ [Supabase 01_categories] delete Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_categories] delete Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_categories] delete exception:', e);
      }
    }

    return true;
  },

  // -------------------------------------------------------------
  // ZONES & LOCATIONS (01_zones & 01_locations)
  // -------------------------------------------------------------
  async getZones(): Promise<Zone[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_zones')
          .select('*')
          .order('name', { ascending: true });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<Zone>(data as Zone[], db.zones);
          db.zones = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_zones] getZones warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch zones error, using local dataset:', e);
      }
    }
    return db.zones;
  },

  async addZone(zoneData: Partial<Zone>): Promise<Zone> {
    const db = loadLocalDB();
    const id = generateUUID();
    const now = new Date().toISOString();

    const newZone: Zone = {
      id,
      name: zoneData.name || 'New Sector',
      zone_code: zoneData.zone_code || `ZN-${Math.floor(10 + Math.random() * 89)}`,
      description: zoneData.description || 'Lucknow Urban Zone',
      city: zoneData.city || 'Lucknow',
      state: zoneData.state || 'Uttar Pradesh',
      country: 'India',
      color: zoneData.color || '#10b981',
      center_lat: Number(zoneData.center_lat) || 26.8467,
      center_lng: Number(zoneData.center_lng) || 80.9462,
      base_delivery_charge: Number(zoneData.base_delivery_charge) || 40,
      minimum_order_amount: Number(zoneData.minimum_order_amount) || 199,
      pincodes: zoneData.pincodes || ['226001', '226002'],
      order_count: 0,
      delivery_boy_count: 0,
      is_active: zoneData.is_active !== false,
      created_at: now,
      updated_at: now,
    };

    db.zones.push(newZone);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: newZone.id,
          name: newZone.name,
          zone_code: newZone.zone_code,
          description: newZone.description || null,
          city: newZone.city,
          state: newZone.state,
          country: newZone.country,
          color: newZone.color,
          center_lat: newZone.center_lat,
          center_lng: newZone.center_lng,
          base_delivery_charge: newZone.base_delivery_charge,
          minimum_order_amount: newZone.minimum_order_amount,
          pincodes: newZone.pincodes,
          order_count: newZone.order_count,
          delivery_boy_count: newZone.delivery_boy_count,
          is_active: newZone.is_active,
          created_at: newZone.created_at,
          updated_at: newZone.updated_at
        };

        console.log('[Supabase 01_zones] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_zones').insert([payload]).select();
        if (error) {
          console.error('❌ [Supabase 01_zones] insert Error:', error.message, 'Code:', error.code, 'Details:', error.details, 'Hint:', error.hint);
        } else {
          console.log('✅ [Supabase 01_zones] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_zones] insert exception:', e);
      }
    }

    return newZone;
  },

  async updateZone(id: string, updates: Partial<Zone>): Promise<Zone | null> {
    const db = loadLocalDB();
    const idx = db.zones.findIndex(z => z.id === id);
    if (idx === -1) return null;

    db.zones[idx] = {
      ...db.zones[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('01_zones').update(updates).eq('id', id);
        if (error) console.warn('[Supabase 01_zones] update error:', error.message);
      } catch (e) {
        console.warn('Supabase update zone error:', e);
      }
    }

    return db.zones[idx];
  },

  async deleteZone(id: string): Promise<boolean> {
    const db = loadLocalDB();
    db.zones = db.zones.filter(z => z.id !== id);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('01_zones').delete().eq('id', id);
        if (error) console.warn('[Supabase 01_zones] delete error:', error.message);
      } catch (e) {
        console.warn('Supabase delete zone error:', e);
      }
    }

    return true;
  },

  async getLocations(): Promise<Location[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_locations')
          .select('*')
          .order('name', { ascending: true });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<Location>(data as Location[], db.locations);
          db.locations = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_locations] getLocations warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch locations error, using local dataset:', e);
      }
    }
    return db.locations;
  },

  async addLocation(locData: Partial<Location>): Promise<Location> {
    const db = loadLocalDB();
    const id = generateUUID();
    const now = new Date().toISOString();

    const newLoc: Location = {
      id,
      zone_id: locData.zone_id || 'zone-1',
      zone_name: locData.zone_name || 'Central Zone',
      name: locData.name || 'Hazratganj Hub',
      address: locData.address || 'Main Road Chowk',
      city: locData.city || 'Lucknow',
      state: locData.state || 'Uttar Pradesh',
      postal_code: locData.postal_code || '226001',
      latitude: Number(locData.latitude) || 26.8467,
      longitude: Number(locData.longitude) || 80.9462,
      is_active: locData.is_active !== false,
      created_at: now,
      updated_at: now,
    };

    db.locations.push(newLoc);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: newLoc.id,
          zone_id: cleanUUID(newLoc.zone_id),
          zone_name: newLoc.zone_name,
          name: newLoc.name,
          address: newLoc.address,
          city: newLoc.city,
          state: newLoc.state,
          postal_code: newLoc.postal_code,
          latitude: newLoc.latitude,
          longitude: newLoc.longitude,
          is_active: newLoc.is_active,
          created_at: newLoc.created_at,
          updated_at: newLoc.updated_at
        };
        console.log('[Supabase 01_locations] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_locations').insert([payload]).select();
        if (error) {
          console.error('❌ [Supabase 01_locations] insert Error:', error.message, 'Code:', error.code, 'Details:', error.details, 'Hint:', error.hint);
        } else {
          console.log('✅ [Supabase 01_locations] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_locations] insert exception:', e);
      }
    }

    return newLoc;
  },

  async updateLocation(id: string, updates: Partial<Location>): Promise<Location | null> {
    const db = loadLocalDB();
    const idx = db.locations.findIndex(l => l.id === id);
    if (idx === -1) return null;

    db.locations[idx] = {
      ...db.locations[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_locations] update Request Payload:', { id, updates });
        const { data, error } = await supabase.from('01_locations').update(updates).eq('id', id).select();
        if (error) {
          console.error('❌ [Supabase 01_locations] update Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_locations] update Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_locations] update exception:', e);
      }
    }

    return db.locations[idx];
  },

  async deleteLocation(id: string): Promise<boolean> {
    const db = loadLocalDB();
    db.locations = db.locations.filter(l => l.id !== id);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_locations] delete Request ID:', id);
        const { data, error } = await supabase.from('01_locations').delete().eq('id', id).select();
        if (error) {
          console.error('❌ [Supabase 01_locations] delete Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_locations] delete Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_locations] delete exception:', e);
      }
    }

    return true;
  },

  // -------------------------------------------------------------
  // VEHICLES (01_vehicles)
  // -------------------------------------------------------------
  async getVehicles(): Promise<Vehicle[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_vehicles')
          .select('*')
          .order('vehicle_number', { ascending: true });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<Vehicle>(data as Vehicle[], db.vehicles);
          db.vehicles = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_vehicles] getVehicles warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch vehicles error, using local dataset:', e);
      }
    }
    return db.vehicles;
  },

  async addVehicle(vehData: Partial<Vehicle>): Promise<Vehicle> {
    const db = loadLocalDB();
    const id = generateUUID();
    const now = new Date().toISOString();

    const newVeh: Vehicle = {
      id,
      vehicle_number: vehData.vehicle_number || `UP32 AB ${Math.floor(1000 + Math.random() * 8999)}`,
      vehicle_type: vehData.vehicle_type || 'Motorcycle',
      brand: vehData.brand || 'Hero',
      model: vehData.model || 'Splendor Plus',
      fuel_type: vehData.fuel_type || 'Petrol',
      capacity: vehData.capacity || '40 kg',
      assigned_delivery_boy_id: vehData.assigned_delivery_boy_id || null,
      assigned_delivery_boy_name: vehData.assigned_delivery_boy_name || null,
      registration_expiry: vehData.registration_expiry || '2028-12-31',
      insurance_expiry: vehData.insurance_expiry || '2026-12-31',
      status: vehData.status || 'Active',
      created_at: now,
      updated_at: now,
    };

    db.vehicles.push(newVeh);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: newVeh.id,
          vehicle_number: newVeh.vehicle_number,
          vehicle_type: newVeh.vehicle_type,
          brand: newVeh.brand,
          model: newVeh.model,
          fuel_type: newVeh.fuel_type,
          capacity: newVeh.capacity,
          assigned_delivery_boy_id: cleanUUID(newVeh.assigned_delivery_boy_id),
          assigned_delivery_boy_name: newVeh.assigned_delivery_boy_name,
          registration_expiry: newVeh.registration_expiry,
          insurance_expiry: newVeh.insurance_expiry,
          status: newVeh.status,
          created_at: newVeh.created_at,
          updated_at: newVeh.updated_at
        };

        console.log('[Supabase 01_vehicles] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_vehicles').insert([payload]).select();
        if (error) {
          console.error('❌ [Supabase 01_vehicles] insert Error:', error.message, 'Code:', error.code, 'Details:', error.details, 'Hint:', error.hint);
        } else {
          console.log('✅ [Supabase 01_vehicles] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_vehicles] insert exception:', e);
      }
    }

    return newVeh;
  },

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
    const db = loadLocalDB();
    const idx = db.vehicles.findIndex(v => v.id === id);
    if (idx === -1) return null;

    db.vehicles[idx] = {
      ...db.vehicles[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_vehicles] update Request Payload:', { id, updates });
        const { data, error } = await supabase.from('01_vehicles').update(updates).eq('id', id).select();
        if (error) {
          console.error('❌ [Supabase 01_vehicles] update Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_vehicles] update Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_vehicles] update exception:', e);
      }
    }

    return db.vehicles[idx];
  },

  async deleteVehicle(id: string): Promise<boolean> {
    const db = loadLocalDB();
    db.vehicles = db.vehicles.filter(v => v.id !== id);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_vehicles] delete Request ID:', id);
        const { data, error } = await supabase.from('01_vehicles').delete().eq('id', id).select();
        if (error) {
          console.error('❌ [Supabase 01_vehicles] delete Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_vehicles] delete Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_vehicles] delete exception:', e);
      }
    }

    return true;
  },

  // -------------------------------------------------------------
  // PAYMENTS & COD (01_payments & 01_cod_settlements)
  // -------------------------------------------------------------
  async getPayments(): Promise<Payment[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_payments')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<Payment>(data as Payment[], db.payments);
          db.payments = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_payments] getPayments warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch payments error, using local dataset:', e);
      }
    }
    return db.payments;
  },

  async recordPayment(paymentData: Partial<Payment>): Promise<Payment> {
    const db = loadLocalDB();
    const id = generateUUID();
    const now = new Date().toISOString();

    const newPayment: Payment = {
      id,
      order_id: paymentData.order_id || 'ord-1',
      order_number: paymentData.order_number || '#ORD1001',
      customer_id: paymentData.customer_id || 'cust-1',
      customer_name: paymentData.customer_name || 'Customer',
      payment_method: paymentData.payment_method || 'UPI',
      amount: Number(paymentData.amount) || 250,
      payment_status: paymentData.payment_status || 'Paid',
      transaction_id: paymentData.transaction_id || `TXN${Date.now()}`,
      created_at: now,
      updated_at: now,
    };

    db.payments.unshift(newPayment);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: newPayment.id,
          order_id: cleanUUID(newPayment.order_id),
          order_number: newPayment.order_number,
          customer_id: cleanUUID(newPayment.customer_id),
          customer_name: newPayment.customer_name,
          payment_method: newPayment.payment_method,
          amount: newPayment.amount,
          payment_status: newPayment.payment_status,
          transaction_id: newPayment.transaction_id,
          created_at: newPayment.created_at,
          updated_at: newPayment.updated_at
        };

        console.log('[Supabase 01_payments] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_payments').insert([payload]).select();
        if (error) {
          console.error('❌ [Supabase 01_payments] insert Error:', error.message, 'Code:', error.code, 'Details:', error.details, 'Hint:', error.hint);
        } else {
          console.log('✅ [Supabase 01_payments] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_payments] insert exception:', e);
      }
    }

    return newPayment;
  },

  async getCODSettlements(): Promise<CODSettlement[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_cod_settlements')
          .select('*')
          .order('collected_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<CODSettlement>(data as CODSettlement[], db.codSettlements);
          db.codSettlements = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_cod_settlements] getCODSettlements warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch COD settlements error, using local dataset:', e);
      }
    }
    return db.codSettlements;
  },

  async recordCODCollection(codData: Partial<CODSettlement>): Promise<CODSettlement> {
    const db = loadLocalDB();
    const id = generateUUID();
    const now = new Date().toISOString();

    const newCOD: CODSettlement = {
      id,
      order_id: codData.order_id || 'ord-1',
      order_number: codData.order_number || '#ORD1001',
      delivery_boy_id: codData.delivery_boy_id || 'db-1',
      delivery_boy_name: codData.delivery_boy_name || 'Rider',
      amount_collected: Number(codData.amount_collected) || 150,
      collected_at: now,
      settlement_status: codData.settlement_status || 'Pending',
      notes: codData.notes || '',
      created_at: now,
      updated_at: now,
    };

    db.codSettlements.unshift(newCOD);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: newCOD.id,
          order_id: cleanUUID(newCOD.order_id),
          order_number: newCOD.order_number,
          delivery_boy_id: cleanUUID(newCOD.delivery_boy_id),
          delivery_boy_name: newCOD.delivery_boy_name,
          amount_collected: newCOD.amount_collected,
          collected_at: newCOD.collected_at,
          settlement_status: newCOD.settlement_status,
          notes: newCOD.notes || null,
          created_at: newCOD.created_at,
          updated_at: newCOD.updated_at
        };

        console.log('[Supabase 01_cod_settlements] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_cod_settlements').insert([payload]).select();
        if (error) {
          console.error('❌ [Supabase 01_cod_settlements] insert Error:', error.message, 'Code:', error.code, 'Details:', error.details, 'Hint:', error.hint);
        } else {
          console.log('✅ [Supabase 01_cod_settlements] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_cod_settlements] insert exception:', e);
      }
    }

    return newCOD;
  },

  async settleCOD(settlementId: string, status: 'Settled' | 'Disputed' | 'Pending', notes?: string): Promise<CODSettlement | null> {
    const db = loadLocalDB();
    const idx = db.codSettlements.findIndex(c => c.id === settlementId);
    if (idx === -1) return null;

    db.codSettlements[idx].settlement_status = status;
    if (notes) db.codSettlements[idx].notes = notes;
    db.codSettlements[idx].updated_at = new Date().toISOString();
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_cod_settlements] update Request Payload:', { settlementId, status, notes });
        const { data, error } = await supabase.from('01_cod_settlements').update({
          settlement_status: status,
          notes: notes || null,
          updated_at: new Date().toISOString()
        }).eq('id', settlementId).select();
        if (error) {
          console.error('❌ [Supabase 01_cod_settlements] settle Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_cod_settlements] settle Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_cod_settlements] settle exception:', e);
      }
    }

    return db.codSettlements[idx];
  },

  // -------------------------------------------------------------
  // RETURNS & CANCELLATIONS (01_returns & 01_cancellations)
  // -------------------------------------------------------------
  async getReturns(): Promise<ReturnRecord[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_returns')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<ReturnRecord>(data as ReturnRecord[], db.returns);
          db.returns = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_returns] getReturns warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch returns error, using local dataset:', e);
      }
    }
    return db.returns;
  },

  async createReturn(returnData: Partial<ReturnRecord>): Promise<ReturnRecord> {
    const db = loadLocalDB();
    const id = generateUUID();
    const now = new Date().toISOString();

    const newReturn: ReturnRecord = {
      id,
      order_id: returnData.order_id || 'ord-1',
      order_number: returnData.order_number || '#ORD1001',
      customer_name: returnData.customer_name || 'Customer',
      reason: returnData.reason || 'Damaged Items',
      refund_amount: Number(returnData.refund_amount) || 0,
      status: returnData.status || 'Approved',
      created_at: now,
      updated_at: now,
    };

    db.returns.unshift(newReturn);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: newReturn.id,
          order_id: cleanUUID(newReturn.order_id),
          order_number: newReturn.order_number,
          customer_name: newReturn.customer_name,
          reason: newReturn.reason,
          refund_amount: newReturn.refund_amount,
          status: newReturn.status,
          created_at: newReturn.created_at,
          updated_at: newReturn.updated_at
        };

        console.log('[Supabase 01_returns] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_returns').insert([payload]).select();
        if (error) {
          console.error('❌ [Supabase 01_returns] insert Error:', error.message, 'Code:', error.code, 'Details:', error.details, 'Hint:', error.hint);
        } else {
          console.log('✅ [Supabase 01_returns] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_returns] insert exception:', e);
      }
    }

    return newReturn;
  },

  async getCancellations(): Promise<CancellationRecord[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_cancellations')
          .select('*')
          .order('cancelled_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<CancellationRecord>(data as CancellationRecord[], db.cancellations);
          db.cancellations = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_cancellations] getCancellations warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch cancellations error, using local dataset:', e);
      }
    }
    return db.cancellations;
  },

  async createCancellation(cancellationData: Partial<CancellationRecord>): Promise<CancellationRecord> {
    const db = loadLocalDB();
    const id = generateUUID();
    const now = new Date().toISOString();

    const newCancellation: CancellationRecord = {
      id,
      order_id: cancellationData.order_id || 'ord-1',
      order_number: cancellationData.order_number || '#ORD1001',
      cancelled_by_name: cancellationData.cancelled_by_name || 'Super Admin',
      cancellation_type: cancellationData.cancellation_type || 'Customer Request',
      reason: cancellationData.reason || 'Changed Mind',
      refund_amount: Number(cancellationData.refund_amount) || 0,
      cancelled_at: now,
      created_at: now,
      updated_at: now,
    };

    db.cancellations.unshift(newCancellation);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: newCancellation.id,
          order_id: cleanUUID(newCancellation.order_id),
          order_number: newCancellation.order_number,
          cancelled_by_name: newCancellation.cancelled_by_name,
          cancellation_type: newCancellation.cancellation_type,
          reason: newCancellation.reason,
          refund_amount: newCancellation.refund_amount,
          cancelled_at: newCancellation.cancelled_at,
          created_at: newCancellation.created_at,
          updated_at: newCancellation.updated_at
        };

        console.log('[Supabase 01_cancellations] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_cancellations').insert([payload]).select();
        if (error) {
          console.error('❌ [Supabase 01_cancellations] insert Error:', error.message, 'Code:', error.code, 'Details:', error.details, 'Hint:', error.hint);
        } else {
          console.log('✅ [Supabase 01_cancellations] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_cancellations] insert exception:', e);
      }
    }

    return newCancellation;
  },

  async cancelOrder(orderId: string, reason: string, cancelledBy: string = 'Super Admin', refundAmount: number = 0): Promise<Order | null> {
    const order = await this.getOrderById(orderId);
    if (!order) return null;

    await this.updateOrderStatus(orderId, 'Cancelled');
    await this.createCancellation({
      order_id: order.id,
      order_number: order.order_number,
      cancelled_by_name: cancelledBy,
      cancellation_type: 'Manual Cancellation',
      reason,
      refund_amount: refundAmount
    });

    return this.getOrderById(orderId);
  },

  // -------------------------------------------------------------
  // NOTIFICATIONS (01_notifications)
  // -------------------------------------------------------------
  async getNotifications(): Promise<AppNotification[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<AppNotification>(data as AppNotification[], db.notifications);
          db.notifications = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_notifications] getNotifications warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch notifications error, using local dataset:', e);
      }
    }
    return db.notifications;
  },

  async sendNotification(notifData: Partial<AppNotification>): Promise<AppNotification> {
    const db = loadLocalDB();
    const id = generateUUID();
    const now = new Date().toISOString();

    const newNotif: AppNotification = {
      id,
      title: notifData.title || 'Broadcast Alert',
      message: notifData.message || 'System Notification',
      notification_type: notifData.notification_type || 'System',
      recipient_type: notifData.recipient_type || 'All Users',
      is_read: false,
      created_at: now,
    };

    db.notifications.unshift(newNotif);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_notifications] insert Request Payload:', newNotif);
        const { data, error } = await supabase.from('01_notifications').insert([newNotif]).select();
        if (error) {
          console.error('❌ [Supabase 01_notifications] insert Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_notifications] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_notifications] insert exception:', e);
      }
    }

    return newNotif;
  },

  async markNotificationRead(id: string): Promise<void> {
    const db = loadLocalDB();
    const notif = db.notifications.find(n => n.id === id);
    if (notif) {
      notif.is_read = true;
      saveLocalDB(db);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_notifications').update({ is_read: true }).eq('id', id);
      } catch (e) {}
    }
  },

  // -------------------------------------------------------------
  // COUPONS & OFFERS (01_coupons & 01_offers)
  // -------------------------------------------------------------
  async getCoupons(): Promise<Coupon[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_coupons')
          .select('*')
          .order('code', { ascending: true });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<Coupon>(data as Coupon[], db.coupons);
          db.coupons = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_coupons] getCoupons warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch coupons error, using local dataset:', e);
      }
    }
    return db.coupons;
  },

  async addCoupon(couponData: Partial<Coupon>): Promise<Coupon> {
    const db = loadLocalDB();
    const id = generateUUID();
    const now = new Date().toISOString();

    const newCoupon: Coupon = {
      id,
      code: (couponData.code || 'WELCOME100').toUpperCase(),
      name: couponData.name || 'Flat ₹100 Off',
      description: couponData.description || 'Valid on orders over ₹499',
      discount_type: couponData.discount_type || 'fixed_amount',
      discount_value: Number(couponData.discount_value) || 100,
      minimum_order_amount: Number(couponData.minimum_order_amount) || 499,
      maximum_discount_amount: Number(couponData.maximum_discount_amount) || 100,
      usage_limit: Number(couponData.usage_limit) || 1000,
      usage_count: 0,
      per_customer_limit: 1,
      is_active: couponData.is_active !== false,
      status: couponData.status || 'Active',
      created_at: now,
      updated_at: now,
    };

    db.coupons.unshift(newCoupon);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_coupons] insert Request Payload:', newCoupon);
        const { data, error } = await supabase.from('01_coupons').insert([newCoupon]).select();
        if (error) {
          console.error('❌ [Supabase 01_coupons] insert Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_coupons] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_coupons] insert exception:', e);
      }
    }

    return newCoupon;
  },

  async getOffers(): Promise<Offer[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_offers')
          .select('*')
          .order('title', { ascending: true });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<Offer>(data as Offer[], db.offers);
          db.offers = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_offers] getOffers warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch offers error, using local dataset:', e);
      }
    }
    return db.offers;
  },

  async addOffer(offerData: Partial<Offer>): Promise<Offer> {
    const db = loadLocalDB();
    const id = generateUUID();
    const now = new Date().toISOString();

    const newOffer: Offer = {
      id,
      title: offerData.title || 'Weekend Rush Offer',
      subtitle: offerData.subtitle || 'Free Home Delivery',
      banner_url: offerData.banner_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
      is_active: offerData.is_active !== false,
      created_at: now,
      updated_at: now,
    };

    db.offers.unshift(newOffer);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_offers] insert Request Payload:', newOffer);
        const { data, error } = await supabase.from('01_offers').insert([newOffer]).select();
        if (error) {
          console.error('❌ [Supabase 01_offers] insert Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_offers] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_offers] insert exception:', e);
      }
    }

    return newOffer;
  },

  // -------------------------------------------------------------
  // USERS & ROLES (01_users & 01_user_roles)
  // -------------------------------------------------------------
  async getUsers(): Promise<User[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_users')
          .select('*')
          .order('full_name', { ascending: true });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<User>(data as User[], db.users);
          db.users = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_users] getUsers warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch users error, using local dataset:', e);
      }
    }
    return db.users;
  },

  async addUser(userData: Partial<User>): Promise<User> {
    const db = loadLocalDB();
    const id = generateUUID();
    const now = new Date().toISOString();

    const firstName = userData.first_name || 'Admin';
    const lastName = userData.last_name || 'User';
    const fullName = `${firstName} ${lastName}`.trim();

    const newUser: User = {
      id,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      email: userData.email || `user${Date.now()}@haribansho.com`,
      password: userData.password || 'Admin@123',
      phone: userData.phone || '+91 98000 00000',
      role: userData.role || 'manager',
      role_name: userData.role_name || 'Branch Manager',
      status: userData.status || 'active',
      is_active: userData.is_active !== false,
      last_login_at: now,
      created_at: now,
      updated_at: now,
    };

    db.users.unshift(newUser);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: newUser.id,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          full_name: newUser.full_name,
          email: newUser.email,
          password: newUser.password,
          phone: newUser.phone,
          role: newUser.role,
          role_name: newUser.role_name,
          status: newUser.status,
          is_active: newUser.is_active,
          last_login_at: newUser.last_login_at,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at
        };

        console.log('[Supabase 01_users] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_users').insert([payload]).select();
        if (error) {
          console.error('❌ [Supabase 01_users] insert Error:', error.message, 'Code:', error.code, 'Details:', error.details, 'Hint:', error.hint);
        } else {
          console.log('✅ [Supabase 01_users] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_users] insert exception:', e);
      }
    }

    return newUser;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const db = loadLocalDB();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) return null;

    db.users[idx] = {
      ...db.users[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_users] update Request Payload:', { id, updates });
        const { data, error } = await supabase.from('01_users').update(updates).eq('id', id).select();
        if (error) {
          console.error('❌ [Supabase 01_users] update Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_users] update Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_users] update exception:', e);
      }
    }

    return db.users[idx];
  },

  async resetUserPassword(userId: string, newPass: string, mode: string = 'manual'): Promise<boolean> {
    const db = loadLocalDB();
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx === -1) return false;

    db.users[idx].password = newPass;
    db.users[idx].updated_at = new Date().toISOString();
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_users] resetUserPassword Request Payload:', { userId, newPass });
        const { error } = await supabase.from('01_users').update({
          password: newPass,
          updated_at: new Date().toISOString()
        }).eq('id', userId);
        if (error) {
          console.error('❌ [Supabase 01_users] resetUserPassword Error:', error.message);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_users] resetUserPassword exception:', e);
      }
    }
    return true;
  },

  async deleteUser(id: string): Promise<boolean> {
    const db = loadLocalDB();
    db.users = db.users.filter(u => u.id !== id);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_users] delete Request ID:', id);
        const { data, error } = await supabase.from('01_users').delete().eq('id', id).select();
        if (error) {
          console.error('❌ [Supabase 01_users] delete Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_users] delete Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_users] delete exception:', e);
      }
    }

    return true;
  },

  async getRoles(): Promise<UserRole[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_user_roles')
          .select('*')
          .order('name', { ascending: true });

        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<UserRole>(data as UserRole[], db.roles);
          db.roles = merged;
          saveLocalDB(db);
          return merged;
        } else if (error) {
          console.warn('[Supabase 01_user_roles] getRoles warning:', error.message);
        }
      } catch (e) {
        console.warn('Supabase fetch roles error, using local dataset:', e);
      }
    }
    return db.roles;
  },

  async addRole(roleData: Partial<UserRole>): Promise<UserRole> {
    const db = loadLocalDB();
    const id = generateUUID();
    const now = new Date().toISOString();
    const name = roleData.name || 'Custom Role';

    const newRole: UserRole = {
      id,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      description: roleData.description || '',
      permissions: roleData.permissions || ['orders.view'],
      is_active: roleData.is_active !== false,
      is_system: false,
      user_count: 0,
      created_at: now,
      updated_at: now,
    };

    db.roles.push(newRole);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          id: newRole.id,
          name: newRole.name,
          slug: newRole.slug,
          description: newRole.description,
          permissions: newRole.permissions,
          is_active: newRole.is_active,
          is_system: newRole.is_system,
          user_count: newRole.user_count,
          created_at: newRole.created_at,
          updated_at: newRole.updated_at
        };

        console.log('[Supabase 01_user_roles] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_user_roles').insert([payload]).select();
        if (error) {
          console.error('❌ [Supabase 01_user_roles] insert Error:', error.message, 'Code:', error.code, 'Details:', error.details, 'Hint:', error.hint);
        } else {
          console.log('✅ [Supabase 01_user_roles] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_user_roles] insert exception:', e);
      }
    }

    return newRole;
  },

  async updateRole(id: string, updates: Partial<UserRole>): Promise<UserRole | null> {
    const db = loadLocalDB();
    const idx = db.roles.findIndex(r => r.id === id);
    if (idx === -1) return null;

    db.roles[idx] = {
      ...db.roles[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_user_roles] update Request Payload:', { id, updates });
        const { data, error } = await supabase.from('01_user_roles').update(updates).eq('id', id).select();
        if (error) {
          console.error('❌ [Supabase 01_user_roles] update Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_user_roles] update Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_user_roles] update exception:', e);
      }
    }

    return db.roles[idx];
  },

  async deleteRole(id: string): Promise<boolean> {
    const db = loadLocalDB();
    const role = db.roles.find(r => r.id === id);
    if (!role) return false;
    if (role.is_system || role.slug === 'super_admin' || role.slug === 'admin') {
      throw new Error('System-defined default roles cannot be deleted.');
    }

    const usersUsingRole = db.users.filter(u => u.role === role.slug);
    if (usersUsingRole.length > 0) {
      throw new Error(`Cannot delete role "${role.name}" because ${usersUsingRole.length} user(s) are currently assigned to it.`);
    }

    db.roles = db.roles.filter(r => r.id !== id);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_user_roles] delete Request ID:', id);
        const { data, error } = await supabase.from('01_user_roles').delete().eq('id', id).select();
        if (error) {
          console.error('❌ [Supabase 01_user_roles] delete Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_user_roles] delete Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_user_roles] delete exception:', e);
      }
    }

    return true;
  },

  // -------------------------------------------------------------
  // AUDIT LOGS & SETTINGS & TICKETS
  // -------------------------------------------------------------
  async logAuditAction(
    action: string, 
    entityType: string, 
    entityId: string, 
    newData?: Record<string, any> | null, 
    oldData?: Record<string, any> | null, 
    userName: string = 'Super Admin'
  ): Promise<AuditLog> {
    const db = loadLocalDB();
    const newLog: AuditLog = {
      id: generateUUID(),
      user_name: userName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_data: oldData || undefined,
      new_data: newData || undefined,
      ip_address: '127.0.0.1',
      user_agent: navigator.userAgent.slice(0, 100),
      created_at: new Date().toISOString()
    };
    db.auditLogs.unshift(newLog);
    if (db.auditLogs.length > 200) db.auditLogs.pop();
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase 01_audit_logs] insert Request Payload:', newLog);
        const { data, error } = await supabase.from('01_audit_logs').insert([newLog]).select();
        if (error) {
          console.error('❌ [Supabase 01_audit_logs] insert Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_audit_logs] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_audit_logs] insert exception:', e);
      }
    }
    return newLog;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_audit_logs').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<AuditLog>(data as AuditLog[], db.auditLogs);
          db.auditLogs = merged;
          saveLocalDB(db);
          return merged;
        }
      } catch (e) {}
    }
    return db.auditLogs;
  },

  async getSettings(): Promise<AppSetting[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_app_settings').select('*');
        if (!error && Array.isArray(data)) return data as AppSetting[];
      } catch (e) {}
    }
    return db.settings;
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
        const payload = { setting_key: key, setting_value: value, updated_at: new Date().toISOString() };
        console.log('[Supabase 01_app_settings] upsert Request Payload:', payload);
        const { data, error } = await supabase.from('01_app_settings').upsert(payload).select();
        if (error) {
          console.error('❌ [Supabase 01_app_settings] upsert Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_app_settings] upsert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_app_settings] upsert exception:', e);
      }
    }
  },

  async getSupportTickets(): Promise<SupportTicket[]> {
    const db = loadLocalDB();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('01_support_tickets').select('*');
        if (!error && Array.isArray(data)) {
          const merged = reconcileLocalAndSupabase<SupportTicket>(data as SupportTicket[], db.supportTickets);
          db.supportTickets = merged;
          saveLocalDB(db);
          return merged;
        }
      } catch (e) {}
    }
    return db.supportTickets;
  },

  async createSupportTicket(ticketData: Partial<SupportTicket>): Promise<SupportTicket> {
    const db = loadLocalDB();
    const now = new Date().toISOString();
    const newTicket: SupportTicket = {
      id: generateUUID(),
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
        console.log('[Supabase 01_support_tickets] insert Request Payload:', newTicket);
        const { data, error } = await supabase.from('01_support_tickets').insert([newTicket]).select();
        if (error) {
          console.error('❌ [Supabase 01_support_tickets] insert Error:', error.message, 'Details:', error.details);
        } else {
          console.log('✅ [Supabase 01_support_tickets] insert Response Success:', data);
        }
      } catch (e) {
        console.error('❌ [Supabase 01_support_tickets] insert exception:', e);
      }
    }
    return newTicket;
  },

  async resetToDefault(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('haribansho_db_v1');
    loadLocalDB();
  }
};
