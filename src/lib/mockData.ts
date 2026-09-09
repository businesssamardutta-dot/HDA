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
    id: 'usr-admin',
    username: 'Admin',
    first_name: 'Super',
    last_name: 'Admin',
    full_name: 'System Administrator (All Companies)',
    email: 'admin@haribansho.com',
    password: 'Admin@1234',
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
    id: 'usr-manager',
    username: 'Manager',
    first_name: 'General',
    last_name: 'Manager',
    full_name: 'Operations & Branch Manager (All Companies)',
    email: 'manager@haribansho.com',
    password: 'Manager@1234',
    phone: '+91 98765 22001',
    role: 'manager',
    role_name: 'Branch Manager',
    status: 'active',
    is_active: true,
    is_super_admin: false,
    company: 'BHANGAKUTHI',
    assigned_companies: ['ALL', 'BHANGAKUTHI', 'HBPL', 'SEFALI', 'HB-TP', 'HB'],
    company_roles: {
      BHANGAKUTHI: 'manager',
      HBPL: 'manager',
      SEFALI: 'manager',
      'HB-TP': 'manager',
      HB: 'manager'
    },
    last_login_at: new Date().toISOString(),
    last_login_company: 'BHANGAKUTHI',
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
