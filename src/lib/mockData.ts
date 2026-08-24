import { 
  Customer, 
  Product, 
  Zone, 
  DeliveryBoy, 
  Order, 
  Vehicle, 
  Category, 
  AppNotification, 
  Coupon, 
  Offer,
  Payment,
  CODSettlement,
  ReturnRecord,
  CancellationRecord,
  SupportTicket,
  AuditLog,
  User,
  AppSetting
} from '../types';

export const ALL_PERMISSION_MODULES = [
  'Dashboard',
  'Orders',
  'Assign Orders',
  'Delivery Boys',
  'Customers',
  'Products',
  'Categories',
  'Locations / Zones',
  'Vehicle Management',
  'Order Tracking',
  'Delivery History',
  'Payments & COD',
  'Returns',
  'Reports',
  'Notifications',
  'Offers & Coupons',
  'Settings',
  'Users & Roles',
  'Audit Logs'
];

export const initialRoles: any[] = [
  {
    id: 'role-super-admin',
    name: 'Super Admin',
    slug: 'super_admin',
    description: 'Full root access to all system modules, settings, security, and operations',
    is_active: true,
    is_system: true,
    user_count: 1,
    permissions: ALL_PERMISSION_MODULES.reduce((acc, m) => {
      acc[m] = { view: true, create: true, edit: true, delete: true, export: true, manage: true };
      return acc;
    }, {} as Record<string, any>),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'role-admin',
    name: 'Admin',
    slug: 'admin',
    description: 'System administrator with management access across business operations',
    is_active: true,
    is_system: true,
    user_count: 1,
    permissions: ALL_PERMISSION_MODULES.reduce((acc, m) => {
      acc[m] = { view: true, create: true, edit: true, delete: m !== 'Settings', export: true, manage: true };
      return acc;
    }, {} as Record<string, any>),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'role-ops-mgr',
    name: 'Operations Manager',
    slug: 'operations_manager',
    description: 'Oversees daily dispatching, zone management, fleet, and order fulfillment',
    is_active: true,
    is_system: false,
    user_count: 1,
    permissions: ALL_PERMISSION_MODULES.reduce((acc, m) => {
      const allowed = ['Dashboard', 'Orders', 'Assign Orders', 'Delivery Boys', 'Customers', 'Products', 'Locations / Zones', 'Vehicle Management', 'Order Tracking', 'Delivery History', 'Returns', 'Reports'];
      acc[m] = { 
        view: allowed.includes(m), 
        create: allowed.includes(m), 
        edit: allowed.includes(m), 
        delete: false, 
        export: true, 
        manage: allowed.includes(m) 
      };
      return acc;
    }, {} as Record<string, any>),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'role-delivery-mgr',
    name: 'Delivery Manager',
    slug: 'delivery_manager',
    description: 'Rider dispatch, attendance, vehicle assignment, and delivery tracking',
    is_active: true,
    is_system: false,
    user_count: 0,
    permissions: ALL_PERMISSION_MODULES.reduce((acc, m) => {
      const allowed = ['Dashboard', 'Orders', 'Assign Orders', 'Delivery Boys', 'Vehicle Management', 'Order Tracking', 'Delivery History', 'Notifications'];
      acc[m] = { 
        view: allowed.includes(m), 
        create: allowed.includes(m), 
        edit: allowed.includes(m), 
        delete: false, 
        export: true, 
        manage: allowed.includes(m) 
      };
      return acc;
    }, {} as Record<string, any>),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'role-finance-mgr',
    name: 'Finance Manager',
    slug: 'finance',
    description: 'COD reconciliation, payment audits, discounts, refunds, and financial reporting',
    is_active: true,
    is_system: false,
    user_count: 0,
    permissions: ALL_PERMISSION_MODULES.reduce((acc, m) => {
      const allowed = ['Dashboard', 'Orders', 'Payments & COD', 'Reports', 'Offers & Coupons', 'Audit Logs'];
      acc[m] = { 
        view: allowed.includes(m), 
        create: allowed.includes(m), 
        edit: allowed.includes(m), 
        delete: false, 
        export: true, 
        manage: allowed.includes(m) 
      };
      return acc;
    }, {} as Record<string, any>),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'role-support',
    name: 'Support Staff',
    slug: 'support',
    description: 'Customer inquiry resolution, order status checking, and ticket management',
    is_active: true,
    is_system: false,
    user_count: 0,
    permissions: ALL_PERMISSION_MODULES.reduce((acc, m) => {
      const allowed = ['Dashboard', 'Orders', 'Customers', 'Order Tracking', 'Delivery History', 'Notifications'];
      acc[m] = { 
        view: allowed.includes(m), 
        create: false, 
        edit: false, 
        delete: false, 
        export: false, 
        manage: false 
      };
      return acc;
    }, {} as Record<string, any>),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'role-viewer',
    name: 'Viewer',
    slug: 'viewer',
    description: 'Read-only access for monitoring dashboards and business reports',
    is_active: true,
    is_system: false,
    user_count: 0,
    permissions: ALL_PERMISSION_MODULES.reduce((acc, m) => {
      acc[m] = { view: true, create: false, edit: false, delete: false, export: true, manage: false };
      return acc;
    }, {} as Record<string, any>),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const initialUsers: User[] = [
  {
    id: 'usr-super-admin',
    first_name: 'Super',
    last_name: 'Admin',
    full_name: 'Super Admin',
    email: 'admin@haribansho.com',
    password: 'Admin@123',
    phone: '+91 98765 43210',
    role: 'super_admin',
    role_name: 'Super Admin',
    status: 'active',
    is_active: true,
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-dispatch-lead',
    first_name: 'Rohit',
    last_name: 'Sharma',
    full_name: 'Rohit Sharma',
    email: 'dispatch@haribansho.com',
    password: 'Ops@123',
    phone: '+91 98765 11223',
    role: 'operations_manager',
    role_name: 'Operations Manager',
    status: 'active',
    is_active: true,
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const initialZones: Zone[] = [];

export const initialVehicles: Vehicle[] = [];

export const initialCategories: Category[] = [];

export const initialProducts: Product[] = [];

export const initialDeliveryBoys: DeliveryBoy[] = [];

export const initialCustomers: Customer[] = [];

export const initialOrders: Order[] = [];

export const initialPayments: Payment[] = [];

export const initialCODSettlements: CODSettlement[] = [];

export const initialReturns: ReturnRecord[] = [];

export const initialCancellations: CancellationRecord[] = [];

export const initialNotifications: AppNotification[] = [];

export const initialCoupons: Coupon[] = [];

export const initialOffers: Offer[] = [];

export const initialAuditLogs: AuditLog[] = [];

export const initialSupportTickets: SupportTicket[] = [];

export const initialAppSettings: AppSetting[] = [];
