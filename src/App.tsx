import { ReturnsRefundsView } from "./components/pages/ReturnsRefundsView";
import React, { useState, useEffect } from 'react';
import { Sidebar, NavTabId, hasPermission } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { OrdersView } from './components/pages/OrdersView';
import {
  AssignOrdersView,
  DeliveryBoysView,
  CustomersView,
  ProductsView,
} from './components/pages/OperationsViews';
import { ZonesView } from './components/pages/ZonesView';
import {
  OrderTrackingView,
  PaymentsCODView,
  ReportsAnalyticsView,
  NotificationsView,
  OffersCouponsView,
  SettingsView,
  UsersRolesView,
} from './components/pages/AdvancedViews';
import { LoginView } from './components/pages/LoginView';

import {
  PunchOrderModal,
  AssignOrderModal,
  SendNotificationModal,
  SupabaseSetupModal,
  OrderDetailsModal,
  LiveTrackingModal,
  GlobalSearchModal,
  CustomerFormModal,
  ProductFormModal,
  DeliveryBoyFormModal,
} from './components/Modals';
import { BulkDataModal } from './components/common/BulkDataModal';
import { SectionHeader } from './components/common/SectionHeader';
import { Toast } from './components/common/Toast';
import { PODModal } from './components/common/PODModal';

import { dbService } from './services/dbService';
import { 
  Order, 
  DeliveryBoy, 
  Customer, 
  Product, 
  Category, 
  Zone,
  Vehicle, 
  Coupon, 
  AppNotification, 
  DashboardStats,
  OrderStatus,
  User,
  UserRole
} from './types';

export function App() {
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('haribansho_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBulkDataModalOpen, setIsBulkDataModalOpen] = useState(false);
  const [bulkModalSection, setBulkModalSection] = useState('orders');

  // State entities
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalOrdersGrowth: 0,
    pendingOrders: 0,
    pendingOrdersGrowth: 0,
    assignedOrders: 0,
    assignedOrdersGrowth: 0,
    deliveredOrders: 0,
    deliveredOrdersGrowth: 0,
    cancelledOrders: 0,
    cancelledOrdersGrowth: 0,
    totalRevenue: 0,
    totalRevenueGrowth: 0,
    todayNewOrders: 0,
    todayOutForDelivery: 0,
    todayDelivered: 0,
    todayCodAmount: 0,
    avgDeliveryTimeMinutes: 0,
    total_orders: 0,
    total_orders_growth_pct: 0,
    pending_orders: 0,
    pending_orders_growth_pct: 0,
    assigned_orders: 0,
    assigned_orders_growth_pct: 0,
    delivered_orders: 0,
    delivered_orders_growth_pct: 0,
    cancelled_orders: 0,
    cancelled_orders_growth_pct: 0,
    total_revenue: 0,
    total_revenue_growth_pct: 0,
    today_new_orders: 0,
    today_out_for_delivery: 0,
    today_delivered: 0,
    today_cod_amount: 0,
    today_avg_delivery_mins: 0,
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('haribansho_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('haribansho_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && roles.length > 0) {
      if (!hasPermission(currentUser, roles, activeTab, 'view')) {
        const tabs: NavTabId[] = [
          'dashboard', 'orders', 'assign-orders', 'delivery-boys', 'customers',
          'products', 'zones', 'order-tracking', 'delivery-history',
          'payments-cod', 'returns-cancelled', 'reports', 'notifications',
          'offers-coupons', 'settings', 'users-roles'
        ];
        const firstAllowed = tabs.find(t => hasPermission(currentUser, roles, t, 'view'));
        if (firstAllowed) {
          setActiveTab(firstAllowed);
        }
      }
    }
  }, [currentUser, roles, activeTab]);

  // Modals state
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [preselectedOrderForAssign, setPreselectedOrderForAssign] = useState<Order | undefined>(undefined);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);
  const [orderForPOD, setOrderForPOD] = useState<Order | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isDeliveryBoyModalOpen, setIsDeliveryBoyModalOpen] = useState(false);
  const [deliveryBoyToEdit, setDeliveryBoyToEdit] = useState<DeliveryBoy | null>(null);

  // Load initial data
  const loadData = async () => {
    try {
      const [
        loadedStats,
        loadedOrders,
        loadedBoys,
        loadedCustomers,
        loadedProducts,
        loadedCategories,
        loadedZones,
        loadedVehicles,
        loadedCoupons,
        loadedNotifications,
        loadedUsers,
        loadedRoles
      ] = await Promise.all([
        dbService.getDashboardStats(),
        dbService.getOrders(),
        dbService.getDeliveryBoys(),
        dbService.getCustomers(),
        dbService.getProducts(),
        dbService.getCategories(),
        dbService.getZones(),
        dbService.getVehicles(),
        dbService.getCoupons(),
        dbService.getNotifications(),
        dbService.getUsers(),
        dbService.getRoles()
      ]);

      setStats(loadedStats);
      setOrders(loadedOrders);
      setDeliveryBoys(loadedBoys);
      setCustomers(loadedCustomers);
      setProducts(loadedProducts);
      setCategories(loadedCategories);
      setZones(loadedZones);
      setVehicles(loadedVehicles);
      setCoupons(loadedCoupons);
      setNotifications(loadedNotifications);
      setUsers(loadedUsers);
      setRoles(loadedRoles);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard shortcut for Cmd+K Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handlePunchOrder = () => {
    setIsPunchModalOpen(true);
  };

  const handleOpenAssignModal = (order?: Order) => {
    setPreselectedOrderForAssign(order);
    setIsAssignModalOpen(true);
  };

  const handleOrderCreated = (newOrder: Order) => {
    setOrders([newOrder, ...orders]);
    loadData();
  };

  const handleOrderAssigned = () => {
    loadData();
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    await dbService.updateOrderStatus(orderId, status);
    loadData();
  };

  const handleToggleBoyStatus = async (id: string, status: any) => {
    await dbService.updateDeliveryBoyStatus(id, status);
    loadData();
  };

  const handleResetData = () => {
    localStorage.removeItem('haribansho_db_v1');
    loadData();
  };

  const handleOpenBulkModal = (sectionKey?: string) => {
    const tabSectionMap: Record<NavTabId, string> = {
      dashboard: 'orders',
      orders: 'orders',
      'assign-orders': 'assign_orders',
      'delivery-boys': 'delivery_boys',
      customers: 'customers',
      products: 'products',
      zones: 'zones',
      'order-tracking': 'order_tracking',
      'delivery-history': 'delivery_history',
      'payments-cod': 'payments_cod',
      'returns-cancelled': 'returns_cancelled',
      reports: 'reports_analytics',
      notifications: 'notifications',
      'offers-coupons': 'offers_coupons',
      settings: 'settings',
      'users-roles': 'users_roles'
    };
    const target = sectionKey || tabSectionMap[activeTab] || 'orders';
    setBulkModalSection(target);
    setIsBulkDataModalOpen(true);
  };

  const getActiveSectionData = () => {
    switch (bulkModalSection) {
      case 'orders':
      case 'delivery_history':
      case 'returns_cancelled':
        return orders;
      case 'delivery_boys':
        return deliveryBoys;
      case 'customers':
        return customers;
      case 'products':
        return products;
      case 'zones':
        return zones;
      case 'notifications':
        return notifications;
      case 'offers_coupons':
        return coupons;
      case 'users_roles':
        return users;
      default:
        return [];
    }
  };

  const currentSectionMeta = {
    dashboard: { title: 'Operations Overview & Dashboard', subtitle: 'Real-time quick commerce metrics and active order summary', key: 'orders', primaryLabel: '+ Punch New Order', onPrimary: handlePunchOrder },
    orders: { title: 'All Orders & Fulfilment', subtitle: 'Manage, view, process and dispatch store orders', key: 'orders', primaryLabel: '+ Punch Order', onPrimary: handlePunchOrder },
    'assign-orders': { title: 'Assign Orders to Delivery Fleet', subtitle: 'Dispatch pending orders to active delivery partners', key: 'assign_orders', primaryLabel: 'Bulk Dispatch', onPrimary: () => handleOpenAssignModal() },
    'delivery-boys': { title: 'Delivery Fleet & Partners', subtitle: 'Manage delivery riders, Android app logins, duty status & zones', key: 'delivery_boys', primaryLabel: '+ Add Delivery Partner', onPrimary: () => setIsDeliveryBoyModalOpen(true) },
    customers: { title: 'Customer Directory', subtitle: 'Registered customer profiles, addresses and order history', key: 'customers', primaryLabel: '+ Add Customer', onPrimary: () => { setCustomerToEdit(null); setIsCustomerModalOpen(true); } },
    products: { title: 'Products & Inventory', subtitle: 'Catalog management, pricing, SKU codes and stock levels', key: 'products', primaryLabel: '+ Add New Product', onPrimary: () => { setProductToEdit(null); setIsProductModalOpen(true); } },
    zones: { title: 'Locations & Service Zones', subtitle: 'Geofenced delivery zones, cities, and pincode coverage', key: 'zones' },
    'order-tracking': { title: 'Live GPS Order Tracking', subtitle: 'Monitor real-time rider location and active dispatch routes', key: 'order_tracking' },
    'delivery-history': { title: 'Completed Delivery History', subtitle: 'Archive of successfully delivered customer orders', key: 'delivery_history' },
    'payments-cod': { title: 'Payments & COD Reconciliation', subtitle: 'Cash collection, UPI payments, and rider settlement logs', key: 'payments_cod' },
    'returns-cancelled': { title: 'Returns & Cancelled Orders', subtitle: 'Track order cancellations, refunds, and return reasons', key: 'returns_cancelled' },
    reports: { title: 'Reports & Analytics', subtitle: 'Sales revenue trends, peak order hours and rider performance', key: 'reports_analytics' },
    notifications: { title: 'Push Notifications & Alerts', subtitle: 'Send app broadcasts to customers and delivery partners', key: 'notifications', primaryLabel: '+ Send Notification', onPrimary: () => setIsNotificationModalOpen(true) },
    'offers-coupons': { title: 'Offers & Promo Coupons', subtitle: 'Manage promo codes, discount percentage and minimum order values', key: 'offers_coupons' },
    settings: { title: 'System & App Settings', subtitle: 'Configure store details, delivery charges and app operational parameters', key: 'settings' },
    'users-roles': { title: 'Admin Users & RBAC Roles', subtitle: 'Manage administrative staff accounts and permission levels', key: 'users_roles' }
  }[activeTab];

  if (isLoading) {
    return (
      <div id="loading-container" className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Loading workspace...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView users={users} onLoginSuccess={(u) => { setCurrentUser(u); }} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 flex flex-col font-sans antialiased selection:bg-emerald-200">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {/* 1. Fixed Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
        roles={roles}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 transition-all duration-300">
        {/* Top Header */}
        <Header
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          unreadCount={notifications.length || 12}
          notifications={notifications}
          onOpenNotifications={() => setActiveTab('notifications')}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onOpenSettings={() => setActiveTab('settings')}
          onSearchClick={() => setIsSearchModalOpen(true)}
          onResetData={handleResetData}
          onOpenBulkDataModal={() => handleOpenBulkModal()}
          currentUser={currentUser}
          onLogout={() => { setCurrentUser(null); setActiveTab('dashboard'); }}
        />

        {/* Dynamic Main Workspace View */}
        <main className="flex-1 px-4 md:px-6 py-5 max-w-[1600px] w-full mx-auto">
          {/* Universal Section Header with Bulk Upload, Export & Sample CSV */}
          {currentSectionMeta && (
            <SectionHeader
              title={currentSectionMeta.title}
              subtitle={currentSectionMeta.subtitle}
              sectionKey={currentSectionMeta.key}
              onOpenBulkModal={handleOpenBulkModal}
              primaryActionLabel={currentSectionMeta.primaryLabel}
              onPrimaryAction={currentSectionMeta.onPrimary}
            />
          )}
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              orders={orders}
              deliveryBoys={deliveryBoys}
              notifications={notifications}
              onPunchNewOrder={handlePunchOrder}
              onAssignOrder={handleOpenAssignModal}
              onSendNotification={() => setIsNotificationModalOpen(true)}
              onOpenReports={() => setActiveTab('reports')}
              onNavigateTab={setActiveTab}
              onViewOrder={(order) => setSelectedOrderForDetails(order)}
              onTrackOrder={(order) => setSelectedOrderForTracking(order)}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView
              orders={orders}
              onPunchOrder={handlePunchOrder}
              onViewOrder={(order) => setSelectedOrderForDetails(order)}
              onAssignOrder={handleOpenAssignModal}
              onStatusChange={handleStatusChange}
            />
          )}

          {activeTab === 'assign-orders' && (
            <AssignOrdersView
              orders={orders}
              deliveryBoys={deliveryBoys}
              onAssign={async (orderId, boyId) => {
                await dbService.assignOrder(orderId, boyId);
                loadData();
              }}
            />
          )}

          {activeTab === 'delivery-boys' && (
            <DeliveryBoysView
              deliveryBoys={deliveryBoys}
              onToggleStatus={handleToggleBoyStatus}
              onAddDeliveryBoy={() => {
                setDeliveryBoyToEdit(null);
                setIsDeliveryBoyModalOpen(true);
              }}
              onEditDeliveryBoy={(boy) => {
                setDeliveryBoyToEdit(boy);
                setIsDeliveryBoyModalOpen(true);
              }}
              onDeleteDeliveryBoy={async (id) => {
                if (window.confirm('Are you sure you want to delete this delivery partner?')) {
                  await dbService.deleteDeliveryBoy(id);
                  loadData();
                }
              }}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={customers}
              onAddCustomer={() => {
                setCustomerToEdit(null);
                setIsCustomerModalOpen(true);
              }}
              onEditCustomer={(cust) => {
                setCustomerToEdit(cust);
                setIsCustomerModalOpen(true);
              }}
              onDeleteCustomer={async (id) => {
                if (window.confirm('Are you sure you want to delete this customer?')) {
                  await dbService.deleteCustomer(id);
                  loadData();
                }
              }}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={products}
              categories={categories}
              onAddProduct={() => {
                setProductToEdit(null);
                setIsProductModalOpen(true);
              }}
              onEditProduct={(p) => {
                setProductToEdit(p);
                setIsProductModalOpen(true);
              }}
              onDeleteProduct={async (id) => {
                if (window.confirm('Are you sure you want to delete this product?')) {
                  await dbService.deleteProduct(id);
                  loadData();
                }
              }}
              onRefreshData={loadData}
            />
          )}

          {activeTab === 'zones' && (
            <ZonesView zones={zones} onRefresh={loadData} />
          )}

          {activeTab === 'order-tracking' && (
            <OrderTrackingView
              orders={orders}
              onTrackOrder={(order) => setSelectedOrderForTracking(order)}
            />
          )}

          {activeTab === 'delivery-history' && (
            <OrdersView
              orders={orders.filter(o => o.order_status === 'Delivered')}
              onPunchOrder={handlePunchOrder}
              onViewOrder={(order) => setSelectedOrderForDetails(order)}
              onAssignOrder={handleOpenAssignModal}
              onStatusChange={handleStatusChange}
            />
          )}

          {activeTab === 'payments-cod' && (
            <PaymentsCODView orders={orders} />
          )}

          {activeTab === 'returns-cancelled' && (
            <ReturnsRefundsView
              orders={orders}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsAnalyticsView
              orders={orders}
              products={products}
              deliveryBoys={deliveryBoys}
              customers={customers}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onRefresh={loadData}
              onSendNotification={() => setIsNotificationModalOpen(true)}
            />
          )}

          {activeTab === 'offers-coupons' && (
            <OffersCouponsView
              coupons={coupons}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}

          {activeTab === 'users-roles' && (
            <UsersRolesView
              users={users}
              roles={roles}
              onRefresh={loadData}
            />
          )}
        </main>
      </div>

      {/* 3. Global Interactive Modals */}
      <PunchOrderModal
        isOpen={isPunchModalOpen}
        onClose={() => setIsPunchModalOpen(false)}
        customers={customers}
        products={products}
        zones={zones}
        coupons={coupons}
        deliveryBoys={deliveryBoys}
        onOrderCreated={handleOrderCreated}
      />

      <AssignOrderModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        orders={orders}
        deliveryBoys={deliveryBoys}
        preselectedOrder={preselectedOrderForAssign}
        onAssigned={handleOrderAssigned}
      />

      <SendNotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onNotificationSent={loadData}
      />

      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      <OrderDetailsModal
        order={selectedOrderForDetails}
        isOpen={!!selectedOrderForDetails}
        onClose={() => setSelectedOrderForDetails(null)}
        onStatusChange={(newStatus) => {
          if (selectedOrderForDetails) {
            handleStatusChange(selectedOrderForDetails.id, newStatus);
            setSelectedOrderForDetails({ ...selectedOrderForDetails, order_status: newStatus });
          }
        }}
        onOpenPOD={(order) => {
          setSelectedOrderForDetails(null);
          setOrderForPOD(order);
        }}
      />

      <PODModal
        order={orderForPOD}
        isOpen={!!orderForPOD}
        onClose={() => setOrderForPOD(null)}
        onSuccess={() => {
          loadData();
          setToast({ message: 'Delivery marked successfully with POD', type: 'success' });
        }}
      />

      <LiveTrackingModal
        order={selectedOrderForTracking}
        isOpen={!!selectedOrderForTracking}
        onClose={() => setSelectedOrderForTracking(null)}
      />

      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        orders={orders}
        customers={customers}
        products={products}
        deliveryBoys={deliveryBoys}
        zones={zones}
        vehicles={vehicles}
        onSelectOrder={(order) => setSelectedOrderForDetails(order)}
      />

      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setCustomerToEdit(null);
        }}
        customerToEdit={customerToEdit}
        zones={zones}
        onCustomerSaved={() => {
          loadData();
          setIsCustomerModalOpen(false);
          setCustomerToEdit(null);
        }}
      />

      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        categories={categories}
        onProductSaved={() => {
          loadData();
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
      />

      <DeliveryBoyFormModal
        isOpen={isDeliveryBoyModalOpen}
        onClose={() => {
          setIsDeliveryBoyModalOpen(false);
          setDeliveryBoyToEdit(null);
        }}
        zones={zones}
        vehicles={vehicles}
        initialData={deliveryBoyToEdit}
        onDeliveryBoySaved={() => {
          loadData();
          setIsDeliveryBoyModalOpen(false);
          setDeliveryBoyToEdit(null);
        }}
        setToast={setToast}
      />

      <BulkDataModal
        isOpen={isBulkDataModalOpen}
        onClose={() => setIsBulkDataModalOpen(false)}
        sectionKey={bulkModalSection}
        existingData={getActiveSectionData()}
        onImportSuccess={loadData}
      />
    </div>
  );
}

export default App;
