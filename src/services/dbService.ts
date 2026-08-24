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

export function deterministicUUID(str: string): string {
  if (!str) return '00000000-0000-0000-0000-000000000000';
  if (isValidUUID(str)) return str;

  // Simple deterministic hash mapping from string to 32 hex chars
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    hash1 = (hash1 << 5) - hash1 + str.charCodeAt(i);
    hash1 |= 0;
  }
  for (let i = str.length - 1; i >= 0; i--) {
    hash2 = (hash2 << 5) - hash2 + str.charCodeAt(i);
    hash2 |= 0;
  }

  const h1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const h2 = Math.abs(hash2).toString(16).padStart(8, '0');
  
  // Format as standard UUID format: 8-4-4-4-12
  const p1 = h1.slice(0, 8);
  const p2 = h2.slice(0, 4);
  const p3 = '4' + h2.slice(4, 7); // version 4
  const p4 = 'a' + h1.slice(4, 7); // variant a
  const p5 = 'e1e1e1' + h2.slice(0, 6).padEnd(6, 'a');

  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

export function cleanUUID(str?: string | null): string | null {
  if (!str || typeof str !== 'string' || str.trim() === '') return null;
  return deterministicUUID(str);
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

function normalizeToUUIDState(state: LocalDBState): LocalDBState {
  const cleanId = (id?: string | null) => id ? (isValidUUID(id) ? id : deterministicUUID(id)) : '';
  const cleanIdOrNull = (id?: string | null) => id ? (isValidUUID(id) ? id : deterministicUUID(id)) : null;

  return {
    ...state,
    roles: (state.roles || []).map(r => ({ ...r, id: cleanId(r.id) })),
    users: (state.users || []).map(u => ({ ...u, id: cleanId(u.id) })),
    categories: (state.categories || []).map(c => ({ ...c, id: cleanId(c.id), parent_category_id: cleanIdOrNull(c.parent_category_id) })),
    zones: (state.zones || []).map(z => ({ ...z, id: cleanId(z.id) })),
    locations: (state.locations || []).map(l => ({ ...l, id: cleanId(l.id), zone_id: cleanIdOrNull(l.zone_id) })),
    products: (state.products || []).map(p => ({ ...p, id: cleanId(p.id), category_id: cleanId(p.category_id) })),
    deliveryBoys: (state.deliveryBoys || []).map(b => ({ ...b, id: cleanId(b.id), zone_id: cleanIdOrNull(b.zone_id), vehicle_id: cleanIdOrNull(b.vehicle_id) })),
    vehicles: (state.vehicles || []).map(v => ({ ...v, id: cleanId(v.id), assigned_delivery_boy_id: cleanIdOrNull(v.assigned_delivery_boy_id) })),
    customers: (state.customers || []).map(c => ({ ...c, id: cleanId(c.id) })),
    orders: (state.orders || []).map(o => ({
      ...o,
      id: cleanId(o.id),
      customer_id: cleanId(o.customer_id),
      delivery_address_id: cleanIdOrNull(o.delivery_address_id),
      zone_id: cleanId(o.zone_id),
      assigned_delivery_boy_id: cleanIdOrNull(o.assigned_delivery_boy_id),
      items: (o.items || []).map(it => ({
        ...it,
        id: cleanId(it.id),
        order_id: cleanId(it.order_id),
        product_id: cleanId(it.product_id)
      }))
    })),
    payments: (state.payments || []).map(p => ({ ...p, id: cleanId(p.id), order_id: cleanIdOrNull(p.order_id), customer_id: cleanIdOrNull(p.customer_id) })),
    codSettlements: (state.codSettlements || []).map(s => ({ ...s, id: cleanId(s.id), order_id: cleanIdOrNull(s.order_id), delivery_boy_id: cleanIdOrNull(s.delivery_boy_id) })),
    returns: (state.returns || []).map(r => ({ ...r, id: cleanId(r.id), order_id: cleanIdOrNull(r.order_id) })),
    cancellations: (state.cancellations || []).map(c => ({ ...c, id: cleanId(c.id), order_id: cleanIdOrNull(c.order_id) })),
    notifications: (state.notifications || []).map(n => ({ ...n, id: cleanId(n.id) })),
    coupons: (state.coupons || []).map(c => ({ ...c, id: cleanId(c.id) })),
    offers: (state.offers || []).map(o => ({ ...o, id: cleanId(o.id) })),
    auditLogs: (state.auditLogs || []).map(a => ({ ...a, id: cleanId(a.id) })),
    supportTickets: (state.supportTickets || []).map(t => ({ ...t, id: cleanId(t.id) })),
    settings: state.settings || [],
    assignments: (state.assignments || []).map(a => ({ ...a, id: cleanId(a.id) }))
  };
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
      const normalized = normalizeToUUIDState(parsed);
      // Save it back to ensure it remains normalized
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
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

  const normalizedDefault = normalizeToUUIDState(defaultState);
  saveLocalDB(normalizedDefault);
  return normalizedDefault;
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
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data as Order[];
        } else if (error) {
          console.warn('[Supabase 01_orders] getOrders warning:', error.message);
        }
      } catch (e) {
        console.error('Supabase fetch orders error:', e);
      }
    }
    return [];
  },

  async getOrderById(id: string): Promise<Order | null> {
    const orders = await this.getOrders();
    return orders.find(o => o.id === id || o.order_number === id) || null;
  },

  async createOrder(orderData: Partial<Order> & { items?: any[] }): Promise<Order> {
    const id = generateUUID();
    const now = new Date().toISOString();
    const orderNumber = orderData.order_number || `#ORD${id.slice(0, 8).toUpperCase()}`;

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

    // saveLocalDB(db); (Removed local DB saving)

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
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const updatePayload: any = {
          order_status: status,
          updated_at: now
        };
        if (status === 'Delivered') {
          updatePayload.payment_status = 'COD Collected';
          updatePayload.delivered_at = now;
        }
        console.log('[Supabase 01_orders] updateOrderStatus Request Payload:', { orderId, updatePayload });
        const { data, error } = await supabase.from('01_orders').update(updatePayload).eq('id', orderId).select().single();
        if (error) {
          console.error('❌ [Supabase 01_orders] status update Error:', error.message);
          return null;
        } else {
          return data as Order;
        }
      } catch (e) {
        console.error('❌ [Supabase 01_orders] status update exception:', e);
      }
    }
    return null;
  },

  async assignOrder(orderId: string, deliveryBoyId: string): Promise<Order | null> {
    const now = new Date().toISOString();
    
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: boy, error: boyErr } = await supabase.from('01_delivery_boys').select('full_name, phone').eq('id', deliveryBoyId).single();
        if (boyErr || !boy) return null;

        const { data, error } = await supabase.from('01_orders').update({
          assigned_delivery_boy_id: cleanUUID(deliveryBoyId),
          assigned_delivery_boy_name: boy.full_name,
          assigned_delivery_boy_phone: boy.phone,
          assignment_status: 'Assigned',
          order_status: 'Assigned',
          updated_at: now
        }).eq('id', orderId).select().single();
        
        if (error) {
            console.warn('[Supabase 01_orders] assign error:', error.message);
            return null;
        }
        return data as Order;
      } catch (e) {
        console.warn('Supabase assign order error:', e);
      }
    }
    return null;
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
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_delivery_boys')
          .select('*')
          .order('full_name', { ascending: true });

        if (!error && Array.isArray(data)) {
          return data as DeliveryBoy[];
        } else if (error) {
          console.warn('[Supabase 01_delivery_boys] getDeliveryBoys warning:', error.message);
        }
      } catch (e) {
        console.error('Supabase fetch delivery boys error:', e);
      }
    }
    return [];
  },

  async getDeliveryBoyById(id: string): Promise<DeliveryBoy | null> {
    const boys = await this.getDeliveryBoys();
    return boys.find(b => b.id === id) || null;
  },
  async addDeliveryBoy(boyData: Partial<DeliveryBoy>): Promise<DeliveryBoy> {
    const id = generateUUID();
    const now = new Date().toISOString();
    const employeeCode = boyData.employee_code || `DB-${Date.now().toString().slice(-4)}`;

    const newBoy: DeliveryBoy = {
      id,
      employee_code: employeeCode,
      first_name: boyData.first_name || 'Rider',
      last_name: boyData.last_name || '',
      full_name: `${boyData.first_name || ''} ${boyData.last_name || ''}`.trim() || 'Courier Partner',
      phone: boyData.phone || '+91 98000 00000',
      email: boyData.email || '',
      availability_status: boyData.availability_status || 'Available',
      rating: 4.8,
      total_deliveries: 0,
      successful_deliveries: 0,
      cancelled_deliveries: 0,
      created_at: now,
      updated_at: now,
      ...boyData
    } as DeliveryBoy;

    if (isSupabaseConfigured && supabase) {
      try {
        // Remove vehicle_info if it's not in the DB schema
        const { vehicle_info, ...insertData } = newBoy as any;
        const { data, error } = await supabase.from('01_delivery_boys').insert(insertData).select().single();
        if (error) {
          console.error('❌ [Supabase 01_delivery_boys] addDeliveryBoy Error:', error.message, 'Details:', error.details);
          throw error;
        }
        console.log('✅ [Supabase 01_delivery_boys] addDeliveryBoy Success:', data);
        return data as DeliveryBoy;
      } catch (e) {
        console.error('❌ [Supabase 01_delivery_boys] addDeliveryBoy Exception:', e);
        throw e;
      }
    }
    
    throw new Error('Supabase not configured');
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
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('01_customers')
          .select('*, addresses:01_customer_addresses(*)')
          .order('full_name', { ascending: true });

        if (!error && Array.isArray(data)) {
          return data as Customer[];
        } else if (error) {
          console.warn('[Supabase 01_customers] getCustomers warning:', error.message);
        }
      } catch (e) {
        console.error('Supabase fetch customers error:', e);
      }
    }
    return [];
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

  async seed5000Products(existingCategories: Category[]): Promise<Product[]> {
    const db = loadLocalDB();
    const now = new Date().toISOString();

    // 1. Ensure categories exist
    let cats = existingCategories && existingCategories.length > 0 ? existingCategories : db.categories;
    if (cats.length === 0) {
      const defaultCategories: Category[] = [
        { id: 'cat-grocery', name: 'Daily Grocery & Atta', slug: 'grocery', description: 'Staples & oils', sort_order: 1, is_active: true, created_at: now, updated_at: now },
        { id: 'cat-dairy', name: 'Dairy & Bakery', slug: 'dairy', description: 'Milk & bread', sort_order: 2, is_active: true, created_at: now, updated_at: now },
        { id: 'cat-fruits', name: 'Fresh Fruits & Veggies', slug: 'fruits', description: 'Farm fresh produce', sort_order: 3, is_active: true, created_at: now, updated_at: now },
        { id: 'cat-beverages', name: 'Beverages', slug: 'beverages', description: 'Soft drinks & juices', sort_order: 4, is_active: true, created_at: now, updated_at: now },
        { id: 'cat-snacks', name: 'Snacks & Brand Foods', slug: 'snacks', description: 'Biscuits & munchies', sort_order: 5, is_active: true, created_at: now, updated_at: now },
        { id: 'cat-personal', name: 'Personal Care', slug: 'personal', description: 'Soaps & wellness', sort_order: 6, is_active: true, created_at: now, updated_at: now },
        { id: 'cat-household', name: 'Household Essentials', slug: 'household', description: 'Cleaners & papers', sort_order: 7, is_active: true, created_at: now, updated_at: now }
      ];
      db.categories = defaultCategories;
      cats = defaultCategories;
    }

    const brands = [
      'Fortune', 'Aashirvaad', 'Amul', 'Cadbury', 'Haldiram\'s', 'Surf Excel', 
      'Colgate', 'Dettol', 'Nescafe', 'Coca-Cola', 'Pepsi', 'Britannia', 
      'Lipton', 'Tata Tea', 'Lizol', 'Red Bull', 'Maggi', 'Dabur', 
      'Gillette', 'Pantene', 'Dove', 'Nivea'
    ];

    const itemTypesByCat: Record<string, { nouns: string[]; unit: string }[]> = {
      'cat-grocery': [
        { nouns: ['Premium Sharbati Atta', 'Chakki Fresh Atta', 'Multigrain Atta'], unit: '5kg' },
        { nouns: ['Basmati Rice Premium', 'Jeera Rice Superb', 'Kolam Rice Fine'], unit: '1kg' },
        { nouns: ['Refined Sunflower Oil', 'Kachi Ghani Mustard Oil', 'Soyabean Oil'], unit: '1L' },
        { nouns: ['Toor Dal Polish', 'Moong Dal Chilka', 'Kabuli Chana Bold'], unit: '500g' },
        { nouns: ['Iodized Salt Clean', 'Refined White Sugar', 'Brown Organic Sugar'], unit: '1kg' }
      ],
      'cat-dairy': [
        { nouns: ['Full Cream Fresh Milk', 'Taza Homogenized Milk', 'Cow Fat-Free Milk'], unit: '500ml' },
        { nouns: ['Salted Butter Delicious', 'Unsalted Cooking Butter'], unit: '100g' },
        { nouns: ['Sliced Sandwich Bread', 'Whole Wheat Atta Bread'], unit: '400g' },
        { nouns: ['Probiotic Fresh Yogurt', 'Mango Sweet Lassi'], unit: '200g' },
        { nouns: ['Processed Cheese Slices', 'Fresh Malai Paneer Block'], unit: '200g' }
      ],
      'cat-fruits': [
        { nouns: ['Shimla Red Apples', 'Royal Gala Crisp Apples'], unit: '1kg' },
        { nouns: ['Fresh Yellow Bananas Robusta', 'Elaichi Bananas Sweet'], unit: '1 Dozen' },
        { nouns: ['Organic Farm Potatoes', 'Pink Fresh Onions', 'Hybrid Red Tomatoes'], unit: '1kg' },
        { nouns: ['Gala Green Seedless Grapes', 'Sweet Golden Papaya'], unit: '500g' }
      ],
      'cat-beverages': [
        { nouns: ['Classic Diet Cola Carbonated', 'Zero Sugar Energy Drink'], unit: '330ml' },
        { nouns: ['100% Mixed Fruit Juice', 'Fresh Orange Pulp Juice'], unit: '1L' },
        { nouns: ['Gold Classic Instant Coffee', 'Strong CTC Assam Tea Powder'], unit: '250g' },
        { nouns: ['Himalayan Natural Spring Water', 'Premium Tonic Water'], unit: '1L' }
      ],
      'cat-snacks': [
        { nouns: ['Classic Salted Potato Chips', 'Masala Munch Kurkure'], unit: '90g' },
        { nouns: ['Good Day Cashew Cookies', 'Marie Gold High-Fibre Biscuits'], unit: '150g' },
        { nouns: ['2-Minute Masala Noodles Pack', 'Hot & Spicy Ramen Bowls'], unit: '280g' },
        { nouns: ['Dairy Milk Silk Chocolate', 'Five Star Caramel Bites'], unit: '80g' }
      ],
      'cat-personal': [
        { nouns: ['Strong Antiseptic Liquid Handwash', 'Herbal Aloe Soap Bar'], unit: '250ml' },
        { nouns: ['Strong Mint Gel Toothpaste', 'Sensodyne Relief Toothpaste'], unit: '150g' },
        { nouns: ['Ultra Shine Anti-Dandruff Shampoo', 'Daily Nourish Conditioner'], unit: '300ml' },
        { nouns: ['Moisturizing Soft Cream Face Care', 'Vitamin E Body Lotion'], unit: '200ml' }
      ],
      'cat-household': [
        { nouns: ['Ultra Wash Liquid Detergent', 'Lemon Fragrance Dishwash Gel'], unit: '500ml' },
        { nouns: ['Citrus Floor Disinfectant Lizol', 'Glass & Multi-Surface Cleaner'], unit: '1L' },
        { nouns: ['Premium Soft 2-Ply Toilet Rolls', 'Biogradable Garbage Bags'], unit: 'Pack of 4' }
      ]
    };

    // Keep existing custom added products at the top to preserve them
    const nonSeedProducts = db.products.filter(p => !p.sku.startsWith('SKU-SEED-'));
    const seededList: Product[] = [...nonSeedProducts];

    const currentTotalSeeded = seededList.length;
    const targetCount = 5000;
    const countToGenerate = Math.max(100, targetCount - currentTotalSeeded);

    for (let i = 1; i <= countToGenerate; i++) {
      const catIdx = i % cats.length;
      const targetCat = cats[catIdx];
      const itemsOfCat = itemTypesByCat[targetCat.id] || itemTypesByCat['cat-grocery'];
      const itemSelection = itemsOfCat[i % itemsOfCat.length];

      const brand = brands[i % brands.length];
      const noun = itemSelection.nouns[i % itemSelection.nouns.length];
      const unit = itemSelection.unit;

      const selling_price = 20 + ((i * 13) % 480); // price range 20 - 500
      const mrp = Math.round(selling_price * (1 + 0.10 + ((i % 5) * 0.04))); // mrp 10% - 30% higher
      const quantity_available = (i % 23) === 0 ? 0 : 5 + ((i * 7) % 245); // low stock or fully available

      const product_code = `PRD-SEED-${i.toString().padStart(4, '0')}`;
      const sku = `SKU-SEED-${i.toString().padStart(4, '0')}`;
      const name = `${brand} ${noun} ${unit}`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      seededList.push({
        id: `seed-prod-${i}`,
        product_code,
        name,
        slug,
        description: `Delivered within 10 minutes. High quality fresh stock from premium suppliers.`,
        category_id: targetCat.id,
        category_name: targetCat.name,
        sku,
        unit,
        selling_price,
        cost_price: Math.round(selling_price * 0.82),
        tax_percentage: (i % 3) === 0 ? 0 : (i % 3 === 1 ? 5 : 12),
        quantity_available,
        reorder_level: 15,
        is_active: true,
        created_at: now,
        updated_at: now
      });
    }

    db.products = seededList;
    saveLocalDB(db);
    return seededList;
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
      vehicle_type: vehData.vehicle_type || 'Bike',
      brand: vehData.brand || 'Hero',
      model: vehData.model || 'Splendor Plus',
      fuel_type: vehData.fuel_type || 'Petrol',
      capacity: vehData.capacity || '40 kg',
      assigned_delivery_boy_id: vehData.assigned_delivery_boy_id || null,
      assigned_delivery_boy_name: vehData.assigned_delivery_boy_name || null,
      registration_expiry: vehData.registration_expiry || '2028-12-31',
      insurance_expiry: vehData.insurance_expiry || '2026-12-31',
      status: vehData.status || 'active',
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
      customer_id: returnData.customer_id || 'cust-1',
      customer_name: returnData.customer_name || 'Customer',
      return_reason: returnData.return_reason || 'Damaged Items',
      return_status: returnData.return_status || 'Approved',
      return_amount: Number(returnData.return_amount) || 0,
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
          customer_id: cleanUUID(newReturn.customer_id),
          customer_name: newReturn.customer_name,
          return_reason: newReturn.return_reason,
          return_amount: newReturn.return_amount,
          return_status: newReturn.return_status,
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
      cancellation_type: cancellationData.cancellation_type || 'Customer',
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

  async markAllNotificationsRead(): Promise<void> {
    const db = loadLocalDB();
    db.notifications.forEach(n => {
      n.is_read = true;
    });
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_notifications').update({ is_read: true }).eq('is_read', false);
      } catch (e) {}
    }
  },

  async deleteNotification(id: string): Promise<void> {
    const db = loadLocalDB();
    db.notifications = db.notifications.filter(n => n.id !== id);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_notifications').delete().eq('id', id);
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
      discount_type: couponData.discount_type || 'fixed',
      discount_value: Number(couponData.discount_value) || 100,
      minimum_order_amount: Number(couponData.minimum_order_amount) || 499,
      maximum_discount_amount: Number(couponData.maximum_discount_amount) || 100,
      start_date: couponData.start_date || now.split('T')[0],
      end_date: couponData.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usage_limit: Number(couponData.usage_limit) || 1000,
      usage_count: 0,
      per_customer_limit: 1,
      is_active: couponData.is_active !== false,
      status: couponData.status || 'active',
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

  async updateCoupon(id: string, couponData: Partial<Coupon>): Promise<Coupon | null> {
    const db = loadLocalDB();
    const idx = db.coupons.findIndex(c => c.id === id);
    if (idx === -1) return null;

    const updated = {
      ...db.coupons[idx],
      ...couponData,
      updated_at: new Date().toISOString()
    } as Coupon;

    db.coupons[idx] = updated;
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_coupons').update(couponData).eq('id', id);
      } catch (e) {}
    }
    return updated;
  },

  async deleteCoupon(id: string): Promise<void> {
    const db = loadLocalDB();
    db.coupons = db.coupons.filter(c => c.id !== id);
    saveLocalDB(db);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('01_coupons').delete().eq('id', id);
      } catch (e) {}
    }
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
      name: offerData.name || 'Weekend Rush Offer',
      description: offerData.description || 'Free Home Delivery on orders over ₹299',
      discount_type: offerData.discount_type || 'fixed',
      discount_value: Number(offerData.discount_value) || 50,
      minimum_order_amount: Number(offerData.minimum_order_amount) || 299,
      start_date: offerData.start_date || now.split('T')[0],
      end_date: offerData.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: offerData.status || 'active',
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

  async syncLocalStateToSupabase(): Promise<{ ok: boolean; message: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { ok: false, message: 'Supabase is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }

    const db = loadLocalDB();
    const results: string[] = [];

    try {
      // 1. Sync User Roles
      if (db.roles && db.roles.length > 0) {
        const { error } = await supabase.from('01_user_roles').upsert(db.roles);
        if (error) results.push(`User Roles: ${error.message}`);
      }

      // 2. Sync Users
      if (db.users && db.users.length > 0) {
        const payload = db.users.map(u => ({
          id: u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          status: u.status,
          created_at: u.created_at,
          updated_at: u.updated_at
        }));
        const { error } = await supabase.from('01_users').upsert(payload);
        if (error) results.push(`Users: ${error.message}`);
      }

      // 3. Sync Categories
      if (db.categories && db.categories.length > 0) {
        const payload = db.categories.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || null,
          image_url: c.image_url || null,
          is_active: c.is_active,
          sort_order: c.sort_order,
          created_at: c.created_at
        }));
        const { error } = await supabase.from('01_categories').upsert(payload);
        if (error) results.push(`Categories: ${error.message}`);
      }

      // 4. Sync Zones
      if (db.zones && db.zones.length > 0) {
        const payload = db.zones.map(z => ({
          id: z.id,
          name: z.name,
          zone_code: z.zone_code,
          city: z.city,
          state: z.state,
          pincodes: z.pincodes,
          is_active: z.is_active,
          created_at: z.created_at
        }));
        const { error } = await supabase.from('01_zones').upsert(payload);
        if (error) results.push(`Zones: ${error.message}`);
      }

      // 5. Sync Products
      if (db.products && db.products.length > 0) {
        const payload = db.products.map(p => ({
          id: p.id,
          product_code: p.product_code,
          name: p.name,
          slug: p.slug,
          description: p.description || null,
          category_id: p.category_id,
          sku: p.sku,
          unit: p.unit,
          selling_price: p.selling_price,
          cost_price: p.cost_price,
          tax_percentage: p.tax_percentage,
          image_url: p.image_url || null,
          quantity_available: p.quantity_available,
          reorder_level: p.reorder_level,
          is_active: p.is_active,
          created_at: p.created_at,
          updated_at: p.updated_at
        }));
        const { error } = await supabase.from('01_products').upsert(payload);
        if (error) results.push(`Products: ${error.message}`);
      }

      // 6. Sync Vehicles
      if (db.vehicles && db.vehicles.length > 0) {
        const payload = db.vehicles.map(v => ({
          id: v.id,
          vehicle_number: v.vehicle_number,
          vehicle_type: v.vehicle_type,
          brand: v.brand,
          model: v.model,
          fuel_type: v.fuel_type,
          capacity: v.capacity,
          status: v.status,
          created_at: v.created_at
        }));
        const { error } = await supabase.from('01_vehicles').upsert(payload);
        if (error) results.push(`Vehicles: ${error.message}`);
      }

      // 7. Sync Delivery Boys
      if (db.deliveryBoys && db.deliveryBoys.length > 0) {
        const payload = db.deliveryBoys.map(b => ({
          id: b.id,
          employee_code: b.employee_code,
          first_name: b.first_name,
          last_name: b.last_name,
          phone: b.phone,
          email: b.email,
          profile_image_url: b.profile_image_url,
          zone_id: b.zone_id,
          vehicle_info: b.vehicle_info,
          employment_status: b.employment_status,
          availability_status: b.availability_status,
          rating: b.rating,
          total_deliveries: b.total_deliveries,
          successful_deliveries: b.successful_deliveries,
          cancelled_deliveries: b.cancelled_deliveries,
          current_latitude: b.current_latitude,
          current_longitude: b.current_longitude,
          joined_at: b.joined_at,
          created_at: b.created_at,
          updated_at: b.updated_at
        }));
        const { error } = await supabase.from('01_delivery_boys').upsert(payload);
        if (error) results.push(`Delivery Partners: ${error.message}`);
      }

      // 8. Sync Customers
      if (db.customers && db.customers.length > 0) {
        const payload = db.customers.map(c => ({
          id: c.id,
          customer_code: c.customer_code || `CUST-${c.id.slice(0, 6)}`,
          full_name: c.full_name,
          email: c.email || null,
          phone: c.phone,
          total_orders: c.total_orders || 0,
          total_spent: c.total_spent || 0,
          created_at: c.created_at
        }));
        const { error } = await supabase.from('01_customers').upsert(payload);
        if (error) results.push(`Customers: ${error.message}`);
      }

      // 9. Sync Customer Addresses
      if (db.customers && db.customers.length > 0) {
        const addressesPayload: any[] = [];
        db.customers.forEach(c => {
          if (c.addresses && c.addresses.length > 0) {
            c.addresses.forEach((addr, idx) => {
              addressesPayload.push({
                id: addr.id || deterministicUUID(`addr-${c.id}-${idx}`),
                customer_id: c.id,
                address_line_1: addr.address_line_1 || 'Main Street Road',
                address_line_2: addr.address_line_2 || null,
                city: addr.city || 'Lucknow',
                state: addr.state || 'Uttar Pradesh',
                pincode: addr.postal_code || '226001',
                is_default: addr.is_default,
                created_at: addr.created_at || c.created_at
              });
            });
          } else {
            addressesPayload.push({
              id: deterministicUUID(`addr-${c.id}-default`),
              customer_id: c.id,
              address_line_1: 'Lucknow Center',
              address_line_2: null,
              city: 'Lucknow',
              state: 'Uttar Pradesh',
              pincode: '226001',
              is_default: true,
              created_at: c.created_at || new Date().toISOString()
            });
          }
        });
        if (addressesPayload.length > 0) {
          const { error: addrErr } = await supabase.from('01_customer_addresses').upsert(addressesPayload);
          if (addrErr) results.push(`Addresses: ${addrErr.message}`);
        }
      }

      // 10. Sync Orders
      if (db.orders && db.orders.length > 0) {
        const payload = db.orders.map(o => ({
          id: o.id,
          order_number: o.order_number,
          customer_id: o.customer_id,
          customer_name: o.customer_name,
          customer_phone: o.customer_phone,
          delivery_address_id: o.delivery_address_id || deterministicUUID(`addr-${o.customer_id}`),
          delivery_address_text: o.delivery_address_text,
          zone_id: o.zone_id,
          zone_name: o.zone_name,
          order_status: o.order_status,
          assignment_status: o.assignment_status,
          assigned_delivery_boy_id: o.assigned_delivery_boy_id,
          assigned_delivery_boy_name: o.assigned_delivery_boy_name,
          assigned_delivery_boy_phone: o.assigned_delivery_boy_phone,
          payment_status: o.payment_status,
          payment_method: o.payment_method,
          subtotal: o.subtotal,
          discount_amount: o.discount_amount,
          delivery_charge: o.delivery_charge,
          tax_amount: o.tax_amount,
          total_amount: o.total_amount,
          cod_amount: o.cod_amount,
          items_count: o.items_count,
          created_at: o.created_at,
          updated_at: o.updated_at
        }));
        const { error } = await supabase.from('01_orders').upsert(payload);
        if (error) results.push(`Orders: ${error.message}`);

        // Sync order items
        const allItems: any[] = [];
        db.orders.forEach(o => {
          if (o.items && o.items.length > 0) {
            o.items.forEach(it => {
              allItems.push({
                id: it.id || deterministicUUID(`item-${o.id}-${it.product_id}`),
                order_id: o.id,
                product_id: it.product_id,
                product_name: it.product_name,
                quantity: it.quantity,
                unit_price: it.unit_price,
                total_price: it.total_amount || (it.unit_price * it.quantity),
                created_at: o.created_at
              });
            });
          }
        });

        if (allItems.length > 0) {
          const { error: itemsErr } = await supabase.from('01_order_items').upsert(allItems);
          if (itemsErr) results.push(`Order Items: ${itemsErr.message}`);
        }
      }

      // 11. Sync Coupons
      if (db.coupons && db.coupons.length > 0) {
        const payload = db.coupons.map(c => ({
          id: c.id,
          code: c.code,
          description: c.description || null,
          discount_type: c.discount_type,
          discount_value: c.discount_value,
          minimum_order_amount: c.minimum_order_amount,
          maximum_discount_amount: c.maximum_discount_amount || null,
          start_date: c.start_date,
          end_date: c.end_date,
          usage_limit: c.usage_limit || null,
          usage_count: c.usage_count || 0,
          is_active: c.is_active,
          created_at: c.created_at
        }));
        const { error } = await supabase.from('01_coupons').upsert(payload);
        if (error) results.push(`Coupons: ${error.message}`);
      }

      // 12. Sync Offers (Optional Table)
      if (db.offers && db.offers.length > 0) {
        const payload = db.offers.map(o => ({
          id: o.id,
          title: o.title,
          description: o.description || null,
          discount_type: o.discount_type,
          discount_value: o.discount_value,
          minimum_order_amount: o.minimum_order_amount,
          status: o.status,
          start_date: o.start_date || null,
          end_date: o.end_date || null,
          created_at: o.created_at
        }));
        try {
          const { error } = await supabase.from('01_offers').upsert(payload);
          if (error) {
            console.warn(`[Supabase 01_offers] Optional sync warning: ${error.message}`);
          }
        } catch (e) {
          console.warn('[Supabase 01_offers] Optional sync exception (table may not exist):', e);
        }
      }

      if (results.length > 0) {
        return { ok: false, message: `Sync partially completed with errors: ${results.join('; ')}` };
      }

      return { ok: true, message: 'All local and mock records successfully uploaded and synchronized with your live Supabase database!' };
    } catch (err: any) {
      console.error('Full Supabase Sync failed:', err);
      return { ok: false, message: `Sync failed completely: ${err?.message || 'Unknown error'}` };
    }
  },

  async resetToDefault(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('haribansho_db_v1');
    loadLocalDB();
  }
};
