import { 
  Company,
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
  'Users & Roles'
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
      const allowed = ['Dashboard', 'Orders', 'Payments & COD', 'Reports', 'Offers & Coupons'];
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

export const COMPANIES_MASTER: Company[] = [
  { 
    id: 'BHANGAKUTHI', 
    name: 'BHANGAKUTHI', 
    code: 'BHG', 
    badge: 'Main Hub', 
    description: 'Central urban quick-commerce and daily grocery fulfillment hub', 
    city: 'Kolkata', 
    state: 'West Bengal', 
    country: 'India', 
    currency: 'INR', 
    is_active: true, 
    created_at: '2026-01-01T00:00:00.000Z' 
  },
  { 
    id: 'HBPL', 
    name: 'HBPL', 
    code: 'HBPL', 
    badge: 'Industrial', 
    description: 'Haribansho Bulk Packaging Logistics & Industrial Distribution center', 
    city: 'Kolkata', 
    state: 'West Bengal', 
    country: 'India', 
    currency: 'INR', 
    is_active: true, 
    created_at: '2026-01-01T00:00:00.000Z' 
  },
  { 
    id: 'SEFALI', 
    name: 'SEFALI', 
    code: 'SEF', 
    badge: 'High Street', 
    description: 'Premium lifestyle, organic groceries & specialty tea brand store', 
    city: 'Kolkata', 
    state: 'West Bengal', 
    country: 'India', 
    currency: 'INR', 
    is_active: true, 
    created_at: '2026-01-01T00:00:00.000Z' 
  },
  { 
    id: 'HB-TP', 
    name: 'HB-TP', 
    code: 'HBTP', 
    badge: 'Tech Zone', 
    description: 'Express instant delivery hub for IT corridor & tech business park', 
    city: 'Kolkata', 
    state: 'West Bengal', 
    country: 'India', 
    currency: 'INR', 
    is_active: true, 
    created_at: '2026-01-01T00:00:00.000Z' 
  },
  { 
    id: 'HB', 
    name: 'HB', 
    code: 'HB', 
    badge: 'Central Depot', 
    description: 'Master warehouse, cold chain depot & dairy supply division', 
    city: 'Kolkata', 
    state: 'West Bengal', 
    country: 'India', 
    currency: 'INR', 
    is_active: true, 
    created_at: '2026-01-01T00:00:00.000Z' 
  }
];

export const initialUsers: User[] = [
  {
    id: 'usr-super-admin',
    first_name: 'Super',
    last_name: 'Admin',
    full_name: 'Super Admin (Haribansho Central)',
    email: 'admin@haribansho.com',
    password: 'Admin@123',
    phone: '+91 98765 43210',
    role: 'super_admin',
    role_name: 'Super Admin',
    status: 'active',
    is_active: true,
    is_super_admin: true,
    company: 'BHANGAKUTHI',
    assigned_companies: ['ALL', 'BHANGAKUTHI', 'HBPL', 'SEFALI', 'HB-TP', 'HB'],
    company_roles: {
      BHANGAKUTHI: 'super_admin',
      HBPL: 'super_admin',
      SEFALI: 'super_admin',
      'HB-TP': 'super_admin',
      HB: 'super_admin'
    },
    last_login_at: new Date().toISOString(),
    last_login_company: 'BHANGAKUTHI',
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
    is_super_admin: false,
    company: 'BHANGAKUTHI',
    assigned_companies: ['BHANGAKUTHI', 'HBPL'],
    company_roles: {
      BHANGAKUTHI: 'operations_manager',
      HBPL: 'viewer'
    },
    last_login_at: new Date().toISOString(),
    last_login_company: 'BHANGAKUTHI',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-hbpl-mgr',
    first_name: 'Amitabh',
    last_name: 'Guha',
    full_name: 'Amitabh Guha',
    email: 'manager.hbpl@haribansho.com',
    password: 'Manager@123',
    phone: '+91 98765 22001',
    role: 'manager',
    role_name: 'Branch Manager',
    status: 'active',
    is_active: true,
    is_super_admin: false,
    company: 'HBPL',
    assigned_companies: ['HBPL'],
    company_roles: {
      HBPL: 'manager'
    },
    last_login_at: new Date().toISOString(),
    last_login_company: 'HBPL',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-sefali-lead',
    first_name: 'Mousumi',
    last_name: 'Dutta',
    full_name: 'Mousumi Dutta',
    email: 'lead.sefali@haribansho.com',
    password: 'Ops@123',
    phone: '+91 98765 33001',
    role: 'operations_manager',
    role_name: 'Operations Manager',
    status: 'active',
    is_active: true,
    is_super_admin: false,
    company: 'SEFALI',
    assigned_companies: ['SEFALI'],
    company_roles: {
      SEFALI: 'operations_manager'
    },
    last_login_at: new Date().toISOString(),
    last_login_company: 'SEFALI',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-hbtp-dispatch',
    first_name: 'Vikram',
    last_name: 'Sen',
    full_name: 'Vikram Sen',
    email: 'dispatch.hbtp@haribansho.com',
    password: 'Ops@123',
    phone: '+91 98765 44001',
    role: 'dispatcher',
    role_name: 'Dispatch Operator',
    status: 'active',
    is_active: true,
    is_super_admin: false,
    company: 'HB-TP',
    assigned_companies: ['HB-TP'],
    company_roles: {
      'HB-TP': 'dispatcher'
    },
    last_login_at: new Date().toISOString(),
    last_login_company: 'HB-TP',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-hb-central',
    first_name: 'Debasish',
    last_name: 'Banerjee',
    full_name: 'Debasish Banerjee',
    email: 'central.hb@haribansho.com',
    password: 'Manager@123',
    phone: '+91 98765 55001',
    role: 'manager',
    role_name: 'Branch Manager',
    status: 'active',
    is_active: true,
    is_super_admin: false,
    company: 'HB',
    assigned_companies: ['HB'],
    company_roles: {
      HB: 'manager'
    },
    last_login_at: new Date().toISOString(),
    last_login_company: 'HB',
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


export const initialAppSettings: AppSetting[] = [];
