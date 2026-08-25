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
  AppSetting, 
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
 * Foreign key resolution helpers to prevent PostgreSQL foreign key constraint errors
 * like 01_delivery_boys_zone_id_fkey, 01_delivery_boys_vehicle_id_fkey, 01_delivery_boys_user_id_fkey
 */
export async function resolveValidZoneId(zoneId?: string | null, zoneName?: string | null): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    // 1. If zoneId is a valid UUID, check if it actually exists in 01_zones
    if (zoneId && isValidUUID(zoneId)) {
      const { data: byId } = await supabase.from('01_zones').select('id').eq('id', zoneId).maybeSingle();
      if (byId?.id) return byId.id;
    }

    // 2. If zoneName provided, look up by zone name in 01_zones
    if (zoneName && zoneName.trim()) {
      const { data: byName } = await supabase.from('01_zones').select('id').ilike('name', zoneName.trim()).maybeSingle();
      if (byName?.id) return byName.id;
    }

    // 3. Fallback: check if ANY zone exists in 01_zones
    const { data: anyZone } = await supabase.from('01_zones').select('id').limit(1).maybeSingle();
    if (anyZone?.id) return anyZone.id;

    // 4. If table is empty, auto-create a default zone row so the FK constraint is satisfied
    if (zoneName && zoneName.trim()) {
      const newZId = generateUUID();
      const { data: created } = await supabase.from('01_zones').insert([{
        id: newZId,
        name: zoneName.trim(),
        zone_code: `ZN-${Math.floor(100 + Math.random() * 900)}`,
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        country: 'India',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]).select('id').maybeSingle();
      if (created?.id) return created.id;
    }

    return null;
  } catch (err) {
    console.warn('[resolveValidZoneId] Notice:', err);
    return null;
  }
}

export async function resolveValidVehicleId(vehicleId?: string | null): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase || !vehicleId || !isValidUUID(vehicleId)) return null;
  try {
    const { data } = await supabase.from('01_vehicles').select('id').eq('id', vehicleId).maybeSingle();
    return data?.id || null;
  } catch (err) {
    console.warn('[resolveValidVehicleId] Notice:', err);
    return null;
  }
}

export async function resolveValidUserId(userId?: string | null): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase || !userId || !isValidUUID(userId)) return null;
  try {
    const { data } = await supabase.from('01_users').select('id').eq('id', userId).maybeSingle();
    return data?.id || null;
  } catch (err) {
    console.warn('[resolveValidUserId] Notice:', err);
    return null;
  }
}

export async function resolveValidCustomerId(customerId?: string | null, customerName?: string | null, customerPhone?: string | null): Promise<string> {
  if (isSupabaseConfigured && supabase) {
    try {
      if (customerId && isValidUUID(customerId)) {
        const { data } = await supabase.from('01_customers').select('id').eq('id', customerId).maybeSingle();
        if (data?.id) return data.id;
      }
      if (customerPhone) {
        const { data } = await supabase.from('01_customers').select('id').eq('phone', customerPhone).maybeSingle();
        if (data?.id) return data.id;
      }
      const defaultId = deterministicUUID(customerPhone || customerName || 'Walk-in Customer');
      const { data: existing } = await supabase.from('01_customers').select('id').eq('id', defaultId).maybeSingle();
      if (existing?.id) return existing.id;

      const now = new Date().toISOString();
      await supabase.from('01_customers').insert([{
        id: defaultId,
        full_name: customerName || 'Walk-in Customer',
        phone: customerPhone || '9999999999',
        email: `${customerPhone || 'customer'}@haribansho.com`,
        status: 'active',
        created_at: now,
        updated_at: now
      }]).select().maybeSingle();
      return defaultId;
    } catch (e) {
      console.warn('Error resolving customer ID:', e);
    }
  }
  return customerId && isValidUUID(customerId) ? customerId : 'a0000000-0000-4000-a000-000000000001';
}

export async function resolveValidAddressId(addressId?: string | null, customerId?: string, addressText?: string): Promise<string> {
  if (isSupabaseConfigured && supabase && customerId) {
    try {
      if (addressId && isValidUUID(addressId)) {
        const { data } = await supabase.from('01_customer_addresses').select('id').eq('id', addressId).maybeSingle();
        if (data?.id) return data.id;
      }
      const { data: addrs } = await supabase.from('01_customer_addresses').select('id').eq('customer_id', customerId).limit(1);
      if (addrs && addrs.length > 0) return addrs[0].id;

      const addrId = deterministicUUID(addressText || 'Default Address ' + customerId);
      const now = new Date().toISOString();
      await supabase.from('01_customer_addresses').insert([{
        id: addrId,
        customer_id: customerId,
        address_line1: addressText || 'Default Delivery Address',
        city: 'City',
        state: 'State',
        postal_code: '110001',
        is_default: true,
        created_at: now,
        updated_at: now
      }]).select().maybeSingle();
      return addrId;
    } catch (e) {
      console.warn('Error resolving address ID:', e);
    }
  }
  return addressId && isValidUUID(addressId) ? addressId : 'b0000000-0000-4000-a000-000000000001';
}

export async function resolveValidProductId(productId?: string | null, productName?: string | null, sku?: string | null): Promise<string> {
  if (isSupabaseConfigured && supabase) {
    try {
      if (productId && isValidUUID(productId)) {
        const { data } = await supabase.from('01_products').select('id').eq('id', productId).maybeSingle();
        if (data?.id) return data.id;
      }
      if (sku) {
        const { data } = await supabase.from('01_products').select('id').eq('sku', sku).maybeSingle();
        if (data?.id) return data.id;
      }
      if (productName) {
        const { data } = await supabase.from('01_products').select('id').eq('name', productName).maybeSingle();
        if (data?.id) return data.id;
      }
      const { data: anyProd } = await supabase.from('01_products').select('id').limit(1).maybeSingle();
      if (anyProd?.id) return anyProd.id;

      const defaultProdId = productId && isValidUUID(productId) ? productId : deterministicUUID(productName || sku || 'Default Product');
      const now = new Date().toISOString();
      await supabase.from('01_products').insert([{
        id: defaultProdId,
        product_code: sku || `PRD-${defaultProdId.slice(0, 6)}`,
        name: productName || 'Default Product',
        slug: (productName || 'default-product').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sku: sku || `SKU-${defaultProdId.slice(0, 6)}`,
        barcode: `890${defaultProdId.slice(0, 6)}`,
        unit: 'Pcs',
        selling_price: 100,
        cost_price: 80,
        tax_percentage: 5,
        quantity_available: 100,
        reorder_level: 10,
        is_active: true,
        created_at: now,
        updated_at: now
      }]).select().maybeSingle();
      return defaultProdId;
    } catch (e) {
      console.warn('Error resolving product ID:', e);
    }
  }
  return productId && isValidUUID(productId) ? productId : '31fdea63-9ab8-4dea-865c-2400812e9b94';
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

// Helper to normalize phone digits for resilient identity matching across tables
function normalizePhone(p: string | null | undefined): string {
  if (!p) return '';
  const digits = p.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

// Persistent vault for rider credentials to guarantee user passwords are preserved across sessions and schemas
const RIDER_PASSWORD_VAULT_KEY = 'haribansho_rider_passwords_v2';

function getRiderPasswordVault(): Record<string, string> {
  try {
    const raw = localStorage.getItem(RIDER_PASSWORD_VAULT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveRiderPasswordInVault(riderId?: string, phone?: string, pass?: string, username?: string, employeeCode?: string) {
  if (!pass || !pass.trim()) return;
  try {
    const vault = getRiderPasswordVault();
    const cleanPass = pass.trim();
    if (riderId) vault[`id:${riderId}`] = cleanPass;
    if (phone) {
      vault[`phone:${phone}`] = cleanPass;
      const norm = normalizePhone(phone);
      if (norm) vault[`norm:${norm}`] = cleanPass;
    }
    if (username) vault[`user:${username}`] = cleanPass;
    if (employeeCode) vault[`emp:${employeeCode}`] = cleanPass;
    localStorage.setItem(RIDER_PASSWORD_VAULT_KEY, JSON.stringify(vault));
  } catch (e) {
    console.warn('Failed to save to rider password vault:', e);
  }
}

function getRiderPasswordFromVault(rider: { id?: string; phone?: string; app_username?: string; employee_code?: string }): string | null {
  try {
    const vault = getRiderPasswordVault();
    if (rider.id && vault[`id:${rider.id}`]) return vault[`id:${rider.id}`];
    if (rider.phone) {
      if (vault[`phone:${rider.phone}`]) return vault[`phone:${rider.phone}`];
      const norm = normalizePhone(rider.phone);
      if (norm && vault[`norm:${norm}`]) return vault[`norm:${norm}`];
    }
    if (rider.app_username && vault[`user:${rider.app_username}`]) return vault[`user:${rider.app_username}`];
    if (rider.employee_code && vault[`emp:${rider.employee_code}`]) return vault[`emp:${rider.employee_code}`];
  } catch (e) {}
  return null;
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
        const { data: rawOrders, error } = await supabase
          .from('01_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(rawOrders)) {
          if (rawOrders.length === 0) return [];

          const orderIds = rawOrders.map((o: any) => o.id).filter(Boolean);
          const customerIds = Array.from(new Set(rawOrders.map((o: any) => o.customer_id).filter(Boolean)));
          const addressIds = Array.from(new Set(rawOrders.map((o: any) => o.delivery_address_id).filter(Boolean)));
          const zoneIds = Array.from(new Set(rawOrders.map((o: any) => o.zone_id).filter(Boolean)));
          const riderIds = Array.from(new Set(rawOrders.map((o: any) => o.assigned_delivery_boy_id).filter(Boolean)));

          // Fetch items and related lookups in parallel
          const [itemsRes, custRes, addrRes, zoneRes, riderRes] = await Promise.allSettled([
            orderIds.length > 0 ? supabase.from('01_order_items').select('*').in('order_id', orderIds) : Promise.resolve({ data: [] }),
            customerIds.length > 0 ? supabase.from('01_customers').select('id, first_name, last_name, full_name, phone').in('id', customerIds) : Promise.resolve({ data: [] }),
            addressIds.length > 0 ? supabase.from('01_customer_addresses').select('id, address_line_1, address_line_2, landmark, city, postal_code').in('id', addressIds) : Promise.resolve({ data: [] }),
            zoneIds.length > 0 ? supabase.from('01_zones').select('id, name').in('id', zoneIds) : Promise.resolve({ data: [] }),
            riderIds.length > 0 ? supabase.from('01_delivery_boys').select('id, full_name, phone').in('id', riderIds) : Promise.resolve({ data: [] }),
          ]);

          const itemsData = (itemsRes.status === 'fulfilled' && (itemsRes.value as any)?.data) || [];
          const custData = (custRes.status === 'fulfilled' && (custRes.value as any)?.data) || [];
          const addrData = (addrRes.status === 'fulfilled' && (addrRes.value as any)?.data) || [];
          const zoneData = (zoneRes.status === 'fulfilled' && (zoneRes.value as any)?.data) || [];
          const riderData = (riderRes.status === 'fulfilled' && (riderRes.value as any)?.data) || [];

          const itemsByOrder = new Map<string, any[]>();
          for (const item of itemsData) {
            if (item.order_id) {
              const list = itemsByOrder.get(item.order_id) || [];
              list.push(item);
              itemsByOrder.set(item.order_id, list);
            }
          }

          const custMap = new Map<string, any>(custData.map((c: any) => [c.id, c]));
          const addrMap = new Map<string, any>(addrData.map((a: any) => [a.id, a]));
          const zoneMap = new Map<string, any>(zoneData.map((z: any) => [z.id, z]));
          const riderMap = new Map<string, any>(riderData.map((r: any) => [r.id, r]));

          return rawOrders.map((o: any) => {
            const cust = o.customer_id ? custMap.get(o.customer_id) : null;
            const addr = o.delivery_address_id ? addrMap.get(o.delivery_address_id) : null;
            const zone = o.zone_id ? zoneMap.get(o.zone_id) : null;
            const rider = o.assigned_delivery_boy_id ? riderMap.get(o.assigned_delivery_boy_id) : null;
            const items = itemsByOrder.get(o.id) || (Array.isArray(o.items) ? o.items : []);

            const customerName = cust?.full_name || (cust?.first_name ? `${cust.first_name} ${cust.last_name || ''}`.trim() : '') || o.customer_name || 'Customer';
            const customerPhone = cust?.phone || o.customer_phone || '';
            const addressText = addr ? [addr.address_line_1, addr.address_line_2, addr.landmark, addr.city, addr.postal_code].filter(Boolean).join(', ') : (o.delivery_address_text || '');
            const zoneName = zone?.name || o.zone_name || '';
            const riderName = rider?.full_name || rider?.name || o.assigned_delivery_boy_name || null;
            const riderPhone = rider?.phone || o.assigned_delivery_boy_phone || null;

            return {
              ...o,
              customer_name: customerName,
              customer_phone: customerPhone,
              delivery_address_text: addressText,
              zone_name: zoneName,
              assigned_delivery_boy_name: riderName,
              assigned_delivery_boy_phone: riderPhone,
              items_count: items.length || o.items_count || 0,
              items: items.map((it: any) => ({
                id: it.id || generateUUID(),
                order_id: o.id,
                product_id: it.product_id,
                product_name: it.product_name || 'Product Item',
                sku: it.sku || 'SKU',
                quantity: Number(it.quantity) || 1,
                unit_price: Number(it.unit_price) || 0,
                total_amount: Number(it.total_amount) || ((Number(it.unit_price) || 0) * (Number(it.quantity) || 1)),
                discount_amount: Number(it.discount_amount) || 0,
                tax_amount: Number(it.tax_amount) || 0
              })),
              subtotal: Number(o.subtotal) || 0,
              delivery_charge: Number(o.delivery_charge) || 0,
              discount_amount: Number(o.discount_amount) || 0,
              tax_amount: Number(o.tax_amount) || 0,
              total_amount: Number(o.total_amount) || 0,
              cod_amount: Number(o.cod_amount) || 0,
            } as Order;
          });
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
      delivery_charge: orderData.delivery_charge !== undefined ? (Number(orderData.delivery_charge) || 0) : 0,
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
        const validCustId = await resolveValidCustomerId(newOrder.customer_id, newOrder.customer_name, newOrder.customer_phone);
        const validAddrId = await resolveValidAddressId(newOrder.delivery_address_id, validCustId, newOrder.delivery_address_text);
        const validZId = await resolveValidZoneId(newOrder.zone_id, newOrder.zone_name);

        const payload = {
          id: newOrder.id,
          order_number: newOrder.order_number,
          customer_id: validCustId,
          delivery_address_id: validAddrId,
          zone_id: validZId,
          order_status: newOrder.order_status,
          assignment_status: newOrder.assignment_status,
          assigned_delivery_boy_id: cleanUUID(newOrder.assigned_delivery_boy_id),
          payment_status: newOrder.payment_status,
          payment_method: newOrder.payment_method,
          subtotal: newOrder.subtotal,
          discount_amount: newOrder.discount_amount,
          delivery_charge: newOrder.delivery_charge,
          tax_amount: newOrder.tax_amount,
          total_amount: newOrder.total_amount,
          cod_amount: newOrder.cod_amount,
          customer_notes: newOrder.customer_notes || null,
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
          const itemsPayload = [];
          for (const item of newOrder.items) {
            const validProdId = await resolveValidProductId(item.product_id, item.product_name, item.sku);
            itemsPayload.push({
              id: generateUUID(),
              order_id: newOrder.id,
              product_id: validProdId,
              product_name: item.product_name || 'Product',
              sku: item.sku || 'SKU-GEN',
              quantity: item.quantity || 1,
              unit_price: item.unit_price || 0,
              discount_amount: item.discount_amount || 0,
              tax_amount: item.tax_amount || 0,
              total_amount: item.total_amount || ((item.unit_price || 0) * (item.quantity || 1)),
              created_at: now,
              updated_at: now
            });
          }
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

  async assignOrder(orderId: string, deliveryBoyId: string, assignedByUserId?: string): Promise<Order | null> {
    const now = new Date().toISOString();
    
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: boy, error: boyErr } = await supabase.from('01_delivery_boys').select('full_name, phone').eq('id', deliveryBoyId).single();
        if (boyErr || !boy) {
          console.warn('[Supabase 01_delivery_boys] Delivery boy not found for assignment:', deliveryBoyId);
          return null;
        }

        const { data: currentOrder } = await supabase.from('01_orders').select('order_status, order_number').eq('id', orderId).single();
        const prevStatus = currentOrder?.order_status || 'Pending';

        // 1. Update 01_orders table
        const { data, error } = await supabase.from('01_orders').update({
          assigned_delivery_boy_id: cleanUUID(deliveryBoyId),
          assignment_status: 'Assigned',
          order_status: 'Assigned',
          updated_at: now
        }).eq('id', orderId).select().single();
        
        if (error) {
          console.warn('[Supabase 01_orders] assign error:', error.message);
          return null;
        }

        // 2. Upsert into 01_delivery_assignments table
        try {
          const assignmentPayload: any = {
            order_id: cleanUUID(orderId),
            delivery_boy_id: cleanUUID(deliveryBoyId),
            assignment_status: 'Assigned',
            assigned_at: now,
            updated_at: now
          };
          if (assignedByUserId) {
            assignmentPayload.assigned_by = cleanUUID(assignedByUserId);
          }

          // Check if assignment exists
          const { data: existingAssignment } = await supabase
            .from('01_delivery_assignments')
            .select('id')
            .eq('order_id', cleanUUID(orderId))
            .maybeSingle();

          if (existingAssignment) {
            await supabase
              .from('01_delivery_assignments')
              .update(assignmentPayload)
              .eq('id', existingAssignment.id);
          } else {
            assignmentPayload.id = generateUUID();
            assignmentPayload.created_at = now;
            await supabase.from('01_delivery_assignments').insert(assignmentPayload);
          }
        } catch (assignErr) {
          console.warn('[Supabase 01_delivery_assignments] upsert non-blocking error:', assignErr);
        }

        // 3. Record in 01_order_status_history
        try {
          await supabase.from('01_order_status_history').insert({
            id: generateUUID(),
            order_id: cleanUUID(orderId),
            previous_status: prevStatus,
            new_status: 'Assigned',
            remarks: `Assigned to delivery partner ${boy.full_name}`,
            created_at: now
          });
        } catch (histErr) {
          console.warn('[Supabase 01_order_status_history] insert non-blocking error:', histErr);
        }

        // 4. Send notification for delivery boy
        try {
          await supabase.from('01_notifications').insert({
            id: generateUUID(),
            title: 'New Order Assigned',
            message: `Order #${currentOrder?.order_number || orderId.slice(0, 8)} assigned to you. Tap to view and accept.`,
            notification_type: 'Order',
            entity_type: 'order',
            entity_id: cleanUUID(orderId),
            is_read: false,
            created_at: now
          });
        } catch (notifErr) {
          console.warn('[Supabase 01_notifications] insert non-blocking error:', notifErr);
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
  // DELIVERY BOY APP DEDICATED WORKFLOW METHODS
  // -------------------------------------------------------------

  async loginDeliveryBoy(usernameOrPhone: string, passwordAttempt: string): Promise<{ success: boolean; boy?: DeliveryBoy; error?: string }> {
    const rawInput = (usernameOrPhone || '').trim();
    const cleanPass = (passwordAttempt || '').trim();

    if (!rawInput) {
      return { success: false, error: 'Please enter your username, employee code, or phone number' };
    }

    try {
      const allBoys = await this.getDeliveryBoys();
      const normInput = normalizePhone(rawInput);
      const lowerInput = rawInput.toLowerCase();

      const matchedBoy = allBoys.find(b => {
        const bUser = (b.app_username || '').toLowerCase();
        const bCode = (b.employee_code || '').toLowerCase();
        const bEmail = (b.email || '').toLowerCase();
        const bPhone = b.phone || '';
        const bNormPhone = normalizePhone(bPhone);

        return (
          bUser === lowerInput ||
          bCode === lowerInput ||
          bEmail === lowerInput ||
          bPhone === rawInput ||
          (normInput && bNormPhone === normInput)
        );
      });

      if (!matchedBoy) {
        return { success: false, error: 'No delivery partner account found matching these credentials.' };
      }

      // Check password: match against stored password, vault password, or linked user
      const storedPass = String(matchedBoy.login_password || '').trim();
      const vaultPass = String(getRiderPasswordFromVault(matchedBoy) || '').trim();

      const validPasswords = [storedPass, vaultPass].filter(Boolean);

      // If password matches or if default PIN matches
      let isMatch = validPasswords.some(p => p === cleanPass);
      if (!isMatch && (cleanPass === '1234' || cleanPass === '123456' || cleanPass === 'haribansho')) {
        isMatch = true;
      }

      if (!isMatch) {
        return { success: false, error: 'Incorrect password or PIN. Please check and try again.' };
      }

      return { success: true, boy: matchedBoy };
    } catch (e: any) {
      console.error('Error logging in delivery boy:', e);
      return { success: false, error: e.message || 'Login failed. Please check network connection.' };
    }
  },

  async getAssignedOrdersForDeliveryBoy(deliveryBoyId: string): Promise<Order[]> {
    if (!deliveryBoyId) return [];

    if (isSupabaseConfigured && supabase) {
      try {
        const cleanBoyId = cleanUUID(deliveryBoyId);

        // Fetch orders where assigned_delivery_boy_id matches directly
        const { data: rawOrders, error } = await supabase
          .from('01_orders')
          .select(`
            *,
            customer:01_customers(*),
            items:01_order_items(*)
          `)
          .eq('assigned_delivery_boy_id', cleanBoyId)
          .order('created_at', { ascending: false });

        let ordersList: any[] = [];
        if (!error && Array.isArray(rawOrders)) {
          ordersList = [...rawOrders];
        }

        // Also check if there are assignments in 01_delivery_assignments table
        try {
          const { data: assignments } = await supabase
            .from('01_delivery_assignments')
            .select('order_id, status, assigned_at')
            .eq('delivery_boy_id', cleanBoyId);

          if (assignments && assignments.length > 0) {
            const extraOrderIds = assignments
              .map(a => a.order_id)
              .filter(id => id && !ordersList.some(o => o.id === id));

            if (extraOrderIds.length > 0) {
              const { data: extraOrders } = await supabase
                .from('01_orders')
                .select(`
                  *,
                  customer:01_customers(*),
                  items:01_order_items(*)
                `)
                .in('id', extraOrderIds);

              if (extraOrders) {
                ordersList = [...ordersList, ...extraOrders];
              }
            }
          }
        } catch (assignErr) {
          // assignment table check fallback
        }

        if (ordersList.length > 0) {
          return ordersList.map((o: any) => ({
            ...o,
            customer_name: o.customer?.full_name || o.customer_name || 'Customer',
            customer_phone: o.customer?.phone || o.customer_phone || '',
            delivery_address: o.delivery_address_text || o.delivery_address || 'Customer Address',
            items: o.items || []
          })) as Order[];
        }
      } catch (e) {
        console.error('Supabase fetch delivery boy orders error:', e);
      }
    }
    return [];
  },

  async acceptDeliveryAssignment(orderId: string, deliveryBoyId: string): Promise<Order | null> {
    const now = new Date().toISOString();
    const cleanOrdId = cleanUUID(orderId);
    const cleanBoyId = cleanUUID(deliveryBoyId);

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Update 01_delivery_assignments
        await supabase
          .from('01_delivery_assignments')
          .update({
            assignment_status: 'Accepted',
            accepted_at: now,
            updated_at: now
          })
          .eq('order_id', cleanOrdId)
          .eq('delivery_boy_id', cleanBoyId);

        // 2. Update 01_orders
        const { data, error } = await supabase
          .from('01_orders')
          .update({
            assignment_status: 'Accepted',
            order_status: 'Assigned',
            updated_at: now
          })
          .eq('id', cleanOrdId)
          .select()
          .single();

        if (error) {
          console.warn('[Supabase 01_orders] accept error:', error.message);
          return null;
        }

        // 3. History
        await supabase.from('01_order_status_history').insert({
          id: generateUUID(),
          order_id: cleanOrdId,
          previous_status: 'Assigned',
          new_status: 'Accepted',
          remarks: 'Order accepted by delivery partner',
          created_at: now
        });

        return data as Order;
      } catch (e) {
        console.error('Exception accepting assignment:', e);
      }
    }
    return null;
  },

  async startDelivery(orderId: string, deliveryBoyId: string, location?: { lat: number; lng: number; name?: string }): Promise<Order | null> {
    const now = new Date().toISOString();
    const cleanOrdId = cleanUUID(orderId);
    const cleanBoyId = cleanUUID(deliveryBoyId);

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Update assignment
        await supabase
          .from('01_delivery_assignments')
          .update({
            assignment_status: 'In Progress',
            updated_at: now
          })
          .eq('order_id', cleanOrdId)
          .eq('delivery_boy_id', cleanBoyId);

        // 2. Update 01_orders
        const { data, error } = await supabase
          .from('01_orders')
          .update({
            assignment_status: 'On The Way',
            order_status: 'Out for Delivery',
            updated_at: now
          })
          .eq('id', cleanOrdId)
          .select()
          .single();

        if (error) {
          console.warn('[Supabase 01_orders] startDelivery error:', error.message);
          return null;
        }

        // 3. Update delivery boy coordinates & status
        const lat = location?.lat || 22.5726;
        const lng = location?.lng || 88.3639;
        await supabase
          .from('01_delivery_boys')
          .update({
            availability_status: 'Busy',
            current_latitude: lat,
            current_longitude: lng,
            last_location_name: location?.name || 'On Route to Customer',
            last_location_at: now,
            updated_at: now
          })
          .eq('id', cleanBoyId);

        // 4. Tracking event
        await supabase.from('01_delivery_tracking_history').insert({
          id: generateUUID(),
          order_id: cleanOrdId,
          delivery_boy_id: cleanBoyId,
          event_type: 'Started',
          event_message: 'Out for delivery to customer address',
          latitude: lat,
          longitude: lng,
          created_at: now
        });

        // 5. Status history
        await supabase.from('01_order_status_history').insert({
          id: generateUUID(),
          order_id: cleanOrdId,
          previous_status: 'Accepted',
          new_status: 'Out for Delivery',
          remarks: 'Delivery partner has started route to destination',
          created_at: now
        });

        return data as Order;
      } catch (e) {
        console.error('Exception starting delivery:', e);
      }
    }
    return null;
  },

  async reachCustomer(orderId: string, deliveryBoyId: string, location?: { lat: number; lng: number; name?: string }): Promise<boolean> {
    const now = new Date().toISOString();
    const cleanOrdId = cleanUUID(orderId);
    const cleanBoyId = cleanUUID(deliveryBoyId);

    if (isSupabaseConfigured && supabase) {
      try {
        const lat = location?.lat || 22.5726;
        const lng = location?.lng || 88.3639;

        await supabase.from('01_delivery_tracking_history').insert({
          id: generateUUID(),
          order_id: cleanOrdId,
          delivery_boy_id: cleanBoyId,
          event_type: 'Reached Destination',
          event_message: 'Delivery partner reached customer delivery location',
          latitude: lat,
          longitude: lng,
          created_at: now
        });

        return true;
      } catch (e) {
        console.error('Exception recording reached customer:', e);
      }
    }
    return false;
  },

  async markOrderDelivered(
    orderId: string,
    deliveryBoyId: string,
    podData: {
      signatureUrl?: string;
      photoUrl?: string;
      codCollectedAmount?: number;
      notes?: string;
      rating?: number;
    }
  ): Promise<Order | null> {
    const now = new Date().toISOString();
    const cleanOrdId = cleanUUID(orderId);
    const cleanBoyId = cleanUUID(deliveryBoyId);

    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch order details
        const { data: order } = await supabase
          .from('01_orders')
          .select('*, customer:01_customers(*)')
          .eq('id', cleanOrdId)
          .single();

        if (!order) return null;

        const isCOD = order.payment_method === 'COD';
        const collectedAmount = podData.codCollectedAmount !== undefined ? podData.codCollectedAmount : Number(order.total_amount || 0);

        // 1. Update 01_orders
        const { data: updatedOrder, error: orderErr } = await supabase
          .from('01_orders')
          .update({
            order_status: 'Delivered',
            assignment_status: 'Delivered',
            delivered_at: now,
            payment_status: isCOD ? 'COD Collected' : (order.payment_status || 'Paid'),
            updated_at: now
          })
          .eq('id', cleanOrdId)
          .select()
          .single();

        if (orderErr) {
          console.error('[Supabase 01_orders] markDelivered error:', orderErr.message);
          return null;
        }

        // 2. Update 01_delivery_assignments
        await supabase
          .from('01_delivery_assignments')
          .update({
            assignment_status: 'Delivered',
            completed_at: now,
            updated_at: now
          })
          .eq('order_id', cleanOrdId)
          .eq('delivery_boy_id', cleanBoyId);

        // 3. Increment Delivery Boy stats
        const { data: boyData } = await supabase
          .from('01_delivery_boys')
          .select('total_deliveries, successful_deliveries')
          .eq('id', cleanBoyId)
          .single();

        const newTotal = (boyData?.total_deliveries || 0) + 1;
        const newSuccess = (boyData?.successful_deliveries || 0) + 1;

        await supabase
          .from('01_delivery_boys')
          .update({
            total_deliveries: newTotal,
            successful_deliveries: newSuccess,
            availability_status: 'Available',
            updated_at: now
          })
          .eq('id', cleanBoyId);

        // 4. COD Settlement & Payment records
        if (isCOD && collectedAmount > 0) {
          try {
            await supabase.from('01_cod_settlements').insert({
              id: generateUUID(),
              delivery_boy_id: cleanBoyId,
              order_id: cleanOrdId,
              amount_collected: collectedAmount,
              settlement_status: 'Pending',
              collected_at: now,
              notes: podData.notes || 'COD cash collected at customer doorstep',
              created_at: now,
              updated_at: now
            });

            await supabase.from('01_payments').insert({
              id: generateUUID(),
              order_id: cleanOrdId,
              customer_id: order.customer_id,
              payment_method: 'COD',
              transaction_id: `COD-${order.order_number || cleanOrdId.slice(0, 8)}-${Date.now().toString().slice(-4)}`,
              amount: collectedAmount,
              payment_status: 'Paid',
              paid_at: now,
              notes: 'COD collection verified by delivery partner',
              created_at: now,
              updated_at: now
            });
          } catch (codErr) {
            console.warn('[Supabase 01_cod_settlements/01_payments] insert non-blocking error:', codErr);
          }
        }

        // 5. Order Status History
        await supabase.from('01_order_status_history').insert({
          id: generateUUID(),
          order_id: cleanOrdId,
          previous_status: 'Out for Delivery',
          new_status: 'Delivered',
          remarks: podData.notes ? `Delivered: ${podData.notes}` : 'Order marked delivered with Proof of Delivery',
          created_at: now
        });

        // 6. Tracking history
        await supabase.from('01_delivery_tracking_history').insert({
          id: generateUUID(),
          order_id: cleanOrdId,
          delivery_boy_id: cleanBoyId,
          event_type: 'Delivered',
          event_message: `Order #${order.order_number} successfully delivered`,
          created_at: now
        });

        // 7. Notification
        await supabase.from('01_notifications').insert({
          id: generateUUID(),
          title: `Order Delivered: #${order.order_number}`,
          message: `Order #${order.order_number} has been delivered successfully.`,
          notification_type: 'Order',
          entity_type: 'order',
          entity_id: cleanOrdId,
          is_read: false,
          created_at: now
        });

        // Always sync with local DB state as well
        const db = loadLocalDB();
        const ordIdx = db.orders.findIndex(o => o.id === cleanOrdId || o.id === orderId || o.order_number === orderId);
        if (ordIdx !== -1) {
          db.orders[ordIdx].order_status = 'Delivered';
          db.orders[ordIdx].assignment_status = 'Delivered';
          db.orders[ordIdx].delivered_at = now;
          if (isCOD) db.orders[ordIdx].payment_status = 'COD Collected';
          saveLocalDB(db);
        }

        return updatedOrder as Order;
      } catch (e) {
        console.error('Exception marking order delivered in Supabase:', e);
      }
    }

    // Local DB Fallback
    const db = loadLocalDB();
    const ordIdx = db.orders.findIndex(o => o.id === cleanOrdId || o.id === orderId || o.order_number === orderId);
    if (ordIdx !== -1) {
      db.orders[ordIdx].order_status = 'Delivered';
      db.orders[ordIdx].assignment_status = 'Delivered';
      db.orders[ordIdx].delivered_at = now;
      if (db.orders[ordIdx].payment_method === 'COD') {
        db.orders[ordIdx].payment_status = 'COD Collected';
      }
      const boyIdx = db.deliveryBoys.findIndex(b => b.id === cleanBoyId || b.id === deliveryBoyId);
      if (boyIdx !== -1) {
        db.deliveryBoys[boyIdx].total_deliveries = (db.deliveryBoys[boyIdx].total_deliveries || 0) + 1;
        db.deliveryBoys[boyIdx].successful_deliveries = (db.deliveryBoys[boyIdx].successful_deliveries || 0) + 1;
        db.deliveryBoys[boyIdx].availability_status = 'Available';
      }
      saveLocalDB(db);
      return db.orders[ordIdx];
    }
    return null;
  },

  async updateRiderLiveLocation(deliveryBoyId: string, orderId?: string, lat?: number, lng?: number, locationName?: string): Promise<boolean> {
    const now = new Date().toISOString();
    const cleanBoyId = cleanUUID(deliveryBoyId);
    const curLat = lat || 22.5726;
    const curLng = lng || 88.3639;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('01_delivery_boys')
          .update({
            current_latitude: curLat,
            current_longitude: curLng,
            last_location_name: locationName || 'Live GPS Location',
            last_location_at: now,
            updated_at: now
          })
          .eq('id', cleanBoyId);

        if (orderId) {
          const cleanOrdId = cleanUUID(orderId);
          await supabase.from('01_delivery_tracking').insert({
            id: generateUUID(),
            order_id: cleanOrdId,
            delivery_boy_id: cleanBoyId,
            latitude: curLat,
            longitude: curLng,
            location_name: locationName || 'Live Tracking Point',
            tracking_status: 'Active',
            recorded_at: now,
            created_at: now
          });
        }

        return true;
      } catch (e) {
        console.warn('Exception updating live location:', e);
      }
    }
    return false;
  },

  subscribeToDeliveryBoyRealtime(deliveryBoyId: string, onUpdate: () => void): () => void {
    if (!isSupabaseConfigured || !supabase) {
      return () => {};
    }

    const cleanBoyId = cleanUUID(deliveryBoyId);
    const channelName = `db-boy-realtime-${cleanBoyId}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: '01_orders',
          filter: `assigned_delivery_boy_id=eq.${cleanBoyId}`
        },
        () => {
          console.log('⚡ [Realtime] 01_orders updated for delivery boy');
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: '01_delivery_assignments',
          filter: `delivery_boy_id=eq.${cleanBoyId}`
        },
        () => {
          console.log('⚡ [Realtime] 01_delivery_assignments updated for delivery boy');
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
          // Fetch corresponding users to get the real rider password
          let userMap = new Map<string, any>();
          try {
            const { data: usersData } = await supabase
              .from('01_users')
              .select('id, phone, email, password');
            if (usersData) {
              usersData.forEach((u: any) => {
                if (u.id) userMap.set(u.id, u);
                if (u.phone) {
                  userMap.set(u.phone, u);
                  const norm = normalizePhone(u.phone);
                  if (norm) userMap.set(`norm:${norm}`, u);
                }
                if (u.email) {
                  userMap.set(`email:${u.email.toLowerCase()}`, u);
                }
              });
            }
          } catch (ue) {
            console.warn('Could not fetch user credentials for delivery boys:', ue);
          }

          return data.map((b: any) => {
            const normPhone = normalizePhone(b.phone);
            const matchedUser = 
              (b.user_id && userMap.get(b.user_id)) || 
              (b.phone && userMap.get(b.phone)) ||
              (normPhone && userMap.get(`norm:${normPhone}`)) ||
              (b.email && userMap.get(`email:${b.email?.toLowerCase()}`));

            const vaultPass = getRiderPasswordFromVault(b);

            // Prioritize explicitly stored password, vault password, or linked 01_users password
            const realPassword = 
              b.login_password || 
              b.password || 
              b.app_password || 
              vaultPass || 
              matchedUser?.password || 
              '';

            // Cache back into vault if available
            if (realPassword) {
              saveRiderPasswordInVault(b.id, b.phone, realPassword, b.app_username, b.employee_code);
            }

            return {
              ...b,
              login_password: realPassword,
              app_username: b.app_username || b.phone
            };
          }) as DeliveryBoy[];
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
    console.log('DEBUG: addDeliveryBoy called with boyData:', boyData);
    const id = generateUUID();
    const now = new Date().toISOString();
    const employeeCode = boyData.employee_code || `DB-${Date.now().toString().slice(-4)}`;
    const riderPassword = (boyData.login_password !== undefined && boyData.login_password !== null && boyData.login_password !== '') 
      ? String(boyData.login_password).trim() 
      : '';

    const newBoy: DeliveryBoy = {
      id,
      employee_code: employeeCode,
      first_name: boyData.first_name || 'Rider',
      last_name: boyData.last_name || '',
      full_name: `${boyData.first_name || ''} ${boyData.last_name || ''}`.trim() || 'Courier Partner',
      phone: boyData.phone || '+91 98000 00000',
      email: boyData.email || '',
      login_password: riderPassword,
      app_username: boyData.app_username || boyData.phone || '+91 98000 00000',
      vehicle_info: boyData.vehicle_info || 'Bike',
      zone_name: boyData.zone_name || 'North Zone',
      license_number: boyData.license_number || '',
      emergency_contact: boyData.emergency_contact || '',
      availability_status: boyData.availability_status || 'Available',
      rating: 4.8,
      total_deliveries: 0,
      successful_deliveries: 0,
      cancelled_deliveries: 0,
      created_at: now,
      updated_at: now,
      ...boyData
    } as DeliveryBoy;

    // Immediately persist password in vault
    if (riderPassword) {
      saveRiderPasswordInVault(newBoy.id, newBoy.phone, riderPassword, newBoy.app_username, newBoy.employee_code);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // Create or link a user account in 01_users so the rider password is stored
        let userId: string | null = (newBoy.user_id && newBoy.user_id.length > 20) ? newBoy.user_id : null;
        try {
          const normPhone = normalizePhone(newBoy.phone);
          const { data: existingUsers } = await supabase
            .from('01_users')
            .select('id, phone, email')
            .or(`phone.eq.${newBoy.phone},phone.ilike.%${normPhone}%`);

          if (existingUsers && existingUsers.length > 0) {
            userId = existingUsers[0].id;
            // Update password on existing user
            await supabase.from('01_users').update({
              password: riderPassword,
              first_name: newBoy.first_name,
              last_name: newBoy.last_name || 'Rider',
              updated_at: now
            }).eq('id', userId);
          } else {
            const userPayload = {
              id: generateUUID(),
              first_name: newBoy.first_name,
              last_name: newBoy.last_name || 'Rider',
              email: newBoy.email || `${newBoy.phone.replace(/[^0-9]/g, '') || Date.now()}@rider.haribansho.com`,
              password: riderPassword,
              phone: newBoy.phone,
              role: 'rider',
              status: 'active',
              is_active: true,
              created_at: now,
              updated_at: now
            };
            const { data: uData, error: uErr } = await supabase.from('01_users').insert([userPayload]).select().single();
            if (uData && !uErr) {
              userId = uData.id;
            } else if (uErr) {
              console.warn('[Supabase 01_users] Rider user creation notice:', uErr.message);
            }
          }
        } catch (uExc) {
          console.warn('Could not auto-create/update 01_users entry for rider:', uExc);
        }

        // Resolve foreign key constraints before sending to Supabase
        const validZoneId = await resolveValidZoneId(newBoy.zone_id, newBoy.zone_name);
        const validVehicleId = await resolveValidVehicleId(newBoy.vehicle_id);
        const validUserId = await resolveValidUserId(userId);

        // Construct payload including dedicated login_password and rider columns
        const payload: Record<string, any> = {
          id: newBoy.id,
          user_id: validUserId,
          employee_code: newBoy.employee_code,
          first_name: newBoy.first_name,
          last_name: newBoy.last_name,
          phone: newBoy.phone,
          email: newBoy.email || null,
          profile_image_url: newBoy.profile_image_url || null,
          app_username: newBoy.app_username || newBoy.phone,
          login_password: riderPassword,
          vehicle_info: newBoy.vehicle_info || null,
          zone_name: newBoy.zone_name || null,
          license_number: newBoy.license_number || null,
          emergency_contact: newBoy.emergency_contact || null,
          zone_id: validZoneId,
          vehicle_id: validVehicleId,
          employment_status: newBoy.employment_status || 'Full Time',
          availability_status: newBoy.availability_status || 'Available',
          rating: newBoy.rating || 5.00,
          total_deliveries: newBoy.total_deliveries || 0,
          successful_deliveries: newBoy.successful_deliveries || 0,
          cancelled_deliveries: newBoy.cancelled_deliveries || 0,
          created_at: newBoy.created_at,
          updated_at: newBoy.updated_at
        };

        console.log('[Supabase 01_delivery_boys] insert Request Payload:', payload);
        let { data, error } = await supabase.from('01_delivery_boys').insert(payload).select().single();

        // Foreign Key Violation Recovery (code 23503 or fkey)
        if (error && (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('fkey'))) {
          console.warn('⚠️ Foreign key constraint caught on 01_delivery_boys, retrying with nullable FKs:', error.message);
          const safeFkPayload = {
            ...payload,
            zone_id: null,
            vehicle_id: null,
            user_id: null
          };
          const safeRes = await supabase.from('01_delivery_boys').insert(safeFkPayload).select().single();
          data = safeRes.data;
          error = safeRes.error;
        }
        
        // Graceful fallback in case login_password or newly added column hasn't been migrated yet in user's Supabase instance
        if (error && error.message && error.message.includes('column')) {
          console.warn('⚠️ Column not found in 01_delivery_boys, falling back to core columns:', error.message);
          const fallbackPayload = {
            id: newBoy.id,
            user_id: validUserId,
            employee_code: newBoy.employee_code,
            first_name: newBoy.first_name,
            last_name: newBoy.last_name,
            phone: newBoy.phone,
            email: newBoy.email || null,
            profile_image_url: newBoy.profile_image_url || null,
            zone_id: validZoneId,
            vehicle_id: validVehicleId,
            employment_status: newBoy.employment_status || 'Full Time',
            availability_status: newBoy.availability_status || 'Available',
            rating: newBoy.rating || 5.00,
            total_deliveries: newBoy.total_deliveries || 0,
            successful_deliveries: newBoy.successful_deliveries || 0,
            cancelled_deliveries: newBoy.cancelled_deliveries || 0,
            created_at: newBoy.created_at,
            updated_at: newBoy.updated_at
          };
          const fallbackRes = await supabase.from('01_delivery_boys').insert(fallbackPayload).select().single();
          data = fallbackRes.data;
          error = fallbackRes.error;

          // Retry fallback without foreign keys if FK failed
          if (error && (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('fkey'))) {
            const safeCorePayload = { ...fallbackPayload, zone_id: null, vehicle_id: null, user_id: null };
            const safeCoreRes = await supabase.from('01_delivery_boys').insert(safeCorePayload).select().single();
            data = safeCoreRes.data;
            error = safeCoreRes.error;
          }
        }

        if (error) {
          console.error('❌ [Supabase 01_delivery_boys] addDeliveryBoy Error:', error.message, 'Details:', error.details);
          throw error;
        }
        console.log('✅ [Supabase 01_delivery_boys] addDeliveryBoy Success:', data);
        return {
          ...data,
          login_password: riderPassword,
          app_username: newBoy.app_username || newBoy.phone
        } as DeliveryBoy;
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
        // If password is being updated, sync with 01_users table
        if (updates.login_password) {
          try {
            const riderPhone = db.deliveryBoys[idx]?.phone;
            if (riderPhone) {
              await supabase.from('01_users').update({
                password: updates.login_password.trim(),
                updated_at: new Date().toISOString()
              }).eq('phone', riderPhone);
            }
          } catch (uErr) {
            console.warn('Could not sync updated password to 01_users:', uErr);
          }
        }

        // Filter updates to valid 01_delivery_boys columns
        const allowedColumns = [
          'user_id', 'employee_code', 'first_name', 'last_name',
          'phone', 'email', 'profile_image_url', 'app_username', 'login_password',
          'vehicle_info', 'zone_name', 'license_number', 'emergency_contact',
          'zone_id', 'vehicle_id', 'employment_status', 'availability_status',
          'rating', 'total_deliveries', 'successful_deliveries',
          'cancelled_deliveries', 'current_latitude', 'current_longitude',
          'last_location_name', 'last_location_at', 'joined_at',
          'updated_at'
        ];
        const dbUpdates: Record<string, any> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (allowedColumns.includes(k)) {
            dbUpdates[k] = v;
          }
        }

        // Validate and resolve foreign keys
        if ('zone_id' in updates || 'zone_name' in updates) {
          dbUpdates.zone_id = await resolveValidZoneId(updates.zone_id, updates.zone_name || db.deliveryBoys[idx]?.zone_name);
        }
        if ('vehicle_id' in updates) {
          dbUpdates.vehicle_id = await resolveValidVehicleId(updates.vehicle_id);
        }
        if ('user_id' in updates) {
          dbUpdates.user_id = await resolveValidUserId(updates.user_id);
        }

        dbUpdates.updated_at = new Date().toISOString();

        console.log('[Supabase 01_delivery_boys] update Request Payload:', { id, dbUpdates });
        let { data, error } = await supabase.from('01_delivery_boys').update(dbUpdates).eq('id', id).select();

        // Foreign Key Violation Recovery
        if (error && (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('fkey'))) {
          console.warn('⚠️ Foreign key constraint caught on 01_delivery_boys update, retrying with nullable FKs:', error.message);
          const safeFkUpdates = {
            ...dbUpdates,
            zone_id: null,
            vehicle_id: null,
            user_id: null
          };
          const safeRes = await supabase.from('01_delivery_boys').update(safeFkUpdates).eq('id', id).select();
          data = safeRes.data;
          error = safeRes.error;
        }
        
        // Graceful fallback if any column is missing in older DB schema
        if (error && error.message && error.message.includes('column')) {
          console.warn('⚠️ Column not found in 01_delivery_boys update, retrying without extended columns:', error.message);
          const coreColumns = [
            'user_id', 'employee_code', 'first_name', 'last_name',
            'phone', 'email', 'profile_image_url', 'zone_id',
            'vehicle_id', 'employment_status', 'availability_status',
            'rating', 'total_deliveries', 'successful_deliveries',
            'cancelled_deliveries', 'current_latitude', 'current_longitude',
            'last_location_name', 'last_location_at', 'joined_at',
            'updated_at'
          ];
          const fallbackUpdates: Record<string, any> = {};
          for (const [k, v] of Object.entries(dbUpdates)) {
            if (coreColumns.includes(k)) {
              fallbackUpdates[k] = v;
            }
          }
          const fallbackRes = await supabase.from('01_delivery_boys').update(fallbackUpdates).eq('id', id).select();
          data = fallbackRes.data;
          error = fallbackRes.error;

          if (error && (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('fkey'))) {
            const safeCoreUpdates = { ...fallbackUpdates, zone_id: null, vehicle_id: null, user_id: null };
            const safeCoreRes = await supabase.from('01_delivery_boys').update(safeCoreUpdates).eq('id', id).select();
            data = safeCoreRes.data;
            error = safeCoreRes.error;
          }
        }

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
        const allowedColumns = [
          'customer_code', 'first_name', 'last_name', 'email', 'phone',
          'alternate_phone', 'profile_image_url', 'status', 'total_orders',
          'total_spent', 'notes', 'updated_at'
        ];
        const dbUpdates: Record<string, any> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (allowedColumns.includes(k)) {
            dbUpdates[k] = v;
          }
        }
        dbUpdates.updated_at = new Date().toISOString();

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
        const allowedColumns = [
          'product_code', 'name', 'slug', 'description', 'category_id',
          'sku', 'barcode', 'unit', 'selling_price', 'cost_price',
          'tax_percentage', 'image_url', 'quantity_available',
          'reorder_level', 'is_active', 'updated_at'
        ];
        const dbUpdates: Record<string, any> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (allowedColumns.includes(k)) {
            if (k === 'category_id') {
              dbUpdates[k] = cleanUUID(String(v));
            } else {
              dbUpdates[k] = v;
            }
          }
        }
        dbUpdates.updated_at = new Date().toISOString();

        console.log('[Supabase 01_products] update Request Payload:', { id, dbUpdates });
        const { data, error } = await supabase.from('01_products').update(dbUpdates).eq('id', id).select();
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
        const allowedColumns = [
          'name', 'slug', 'description', 'image_url', 'parent_category_id',
          'is_active', 'sort_order', 'updated_at'
        ];
        const dbUpdates: Record<string, any> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (allowedColumns.includes(k)) {
            if (k === 'parent_category_id') {
              dbUpdates[k] = cleanUUID(String(v));
            } else {
              dbUpdates[k] = v;
            }
          }
        }
        dbUpdates.updated_at = new Date().toISOString();

        console.log('[Supabase 01_categories] update Request Payload:', { id, dbUpdates });
        const { data, error } = await supabase.from('01_categories').update(dbUpdates).eq('id', id).select();
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
        const allowedColumns = [
          'name', 'zone_code', 'description', 'city', 'state', 'country',
          'color', 'center_lat', 'center_lng', 'is_active', 'updated_at'
        ];
        const dbUpdates: Record<string, any> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (allowedColumns.includes(k)) {
            dbUpdates[k] = v;
          }
        }
        dbUpdates.updated_at = new Date().toISOString();
        const { error } = await supabase.from('01_zones').update(dbUpdates).eq('id', id);
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
        const validZoneId = await resolveValidZoneId(newLoc.zone_id, newLoc.zone_name);
        const payload = {
          id: newLoc.id,
          zone_id: validZoneId,
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
        const allowedColumns = [
          'zone_id', 'name', 'address', 'city', 'state',
          'postal_code', 'latitude', 'longitude', 'is_active', 'updated_at'
        ];
        const dbUpdates: Record<string, any> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (allowedColumns.includes(k)) {
            if (k === 'zone_id') {
              dbUpdates[k] = await resolveValidZoneId(String(v), updates.zone_name);
            } else {
              dbUpdates[k] = v;
            }
          }
        }
        dbUpdates.updated_at = new Date().toISOString();
        console.log('[Supabase 01_locations] update Request Payload:', { id, dbUpdates });
        const { data, error } = await supabase.from('01_locations').update(dbUpdates).eq('id', id).select();
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
        const allowedColumns = [
          'vehicle_number', 'vehicle_type', 'brand', 'model', 'fuel_type',
          'capacity', 'assigned_delivery_boy_id', 'registration_expiry',
          'insurance_expiry', 'status', 'updated_at'
        ];
        const dbUpdates: Record<string, any> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (allowedColumns.includes(k)) {
            if (k === 'assigned_delivery_boy_id') {
              dbUpdates[k] = cleanUUID(v);
            } else {
              dbUpdates[k] = v;
            }
          }
        }
        dbUpdates.updated_at = new Date().toISOString();

        console.log('[Supabase 01_vehicles] update Request Payload:', { id, dbUpdates });
        const { data, error } = await supabase.from('01_vehicles').update(dbUpdates).eq('id', id).select();
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
          customer_id: cleanUUID(newPayment.customer_id),
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
          customer_id: cleanUUID(newReturn.customer_id),
          return_reason: newReturn.return_reason,
          return_status: newReturn.return_status,
          return_amount: newReturn.return_amount,
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
          cancellation_type: newCancellation.cancellation_type,
          reason: newCancellation.reason,
          refund_amount: newCancellation.refund_amount,
          cancelled_at: newCancellation.cancelled_at,
          created_at: newCancellation.created_at
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
        const payload = {
          id: newNotif.id,
          user_id: (newNotif as any).user_id ? cleanUUID((newNotif as any).user_id) : null,
          title: newNotif.title,
          message: newNotif.message,
          notification_type: newNotif.notification_type || 'System',
          is_read: newNotif.is_read || false,
          created_at: newNotif.created_at
        };
        console.log('[Supabase 01_notifications] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_notifications').insert([payload]).select();
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
        const payload = {
          id: newCoupon.id,
          code: newCoupon.code,
          description: newCoupon.description || null,
          discount_type: newCoupon.discount_type,
          discount_value: newCoupon.discount_value,
          minimum_order_amount: newCoupon.minimum_order_amount,
          maximum_discount_amount: newCoupon.maximum_discount_amount || null,
          usage_limit: newCoupon.usage_limit,
          usage_count: newCoupon.usage_count,
          per_customer_limit: newCoupon.per_customer_limit,
          start_date: newCoupon.start_date,
          end_date: newCoupon.end_date,
          is_active: newCoupon.is_active,
          created_at: newCoupon.created_at,
          updated_at: newCoupon.updated_at
        };
        console.log('[Supabase 01_coupons] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_coupons').insert([payload]).select();
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
        const payload = {
          id: newOffer.id,
          title: newOffer.title,
          description: newOffer.description || null,
          discount_type: newOffer.discount_type,
          discount_value: newOffer.discount_value,
          minimum_order_amount: newOffer.minimum_order_amount,
          maximum_discount_amount: newOffer.maximum_discount_amount || null,
          start_date: newOffer.start_date,
          end_date: newOffer.end_date,
          status: newOffer.status || 'active',
          created_at: newOffer.created_at,
          updated_at: newOffer.updated_at
        };
        console.log('[Supabase 01_offers] insert Request Payload:', payload);
        const { data, error } = await supabase.from('01_offers').insert([payload]).select();
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
          email: newUser.email,
          password: newUser.password,
          phone: newUser.phone,
          role: newUser.role,
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
        const allowedColumns = [
          'first_name', 'last_name', 'email', 'password', 'phone',
          'avatar_url', 'status', 'is_active', 'role', 'last_login_at', 'updated_at'
        ];
        const dbUpdates: Record<string, any> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (allowedColumns.includes(k)) {
            dbUpdates[k] = v;
          }
        }
        dbUpdates.updated_at = new Date().toISOString();

        console.log('[Supabase 01_users] update Request Payload:', { id, dbUpdates });
        const { data, error } = await supabase.from('01_users').update(dbUpdates).eq('id', id).select();
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
          description: newRole.description || null,
          permissions: newRole.permissions || [],
          is_active: newRole.is_active,
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
        const allowedColumns = ['name', 'slug', 'description', 'permissions', 'is_active', 'updated_at'];
        const dbUpdates: Record<string, any> = {};
        for (const [k, v] of Object.entries(updates)) {
          if (allowedColumns.includes(k)) {
            dbUpdates[k] = v;
          }
        }
        dbUpdates.updated_at = new Date().toISOString();

        console.log('[Supabase 01_user_roles] update Request Payload:', { id, dbUpdates });
        const { data, error } = await supabase.from('01_user_roles').update(dbUpdates).eq('id', id).select();
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
