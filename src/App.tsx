import React, { useState, useEffect } from 'react';
import { Sidebar, NavTabId } from './components/Sidebar';
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
import { VehiclesView } from './components/pages/VehiclesView';
import {
  OrderTrackingView,
  PaymentsCODView,
  ReportsAnalyticsView,
  NotificationsView,
  OffersCouponsView,
  SettingsView,
  UsersRolesView,
  AuditLogsView,
  SupportView,
} from './components/pages/AdvancedViews';

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
  UserRole,
  AuditLog
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [preselectedOrderForAssign, setPreselectedOrderForAssign] = useState<Order | undefined>(undefined);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isDeliveryBoyModalOpen, setIsDeliveryBoyModalOpen] = useState(false);

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
        loadedRoles,
        loadedAuditLogs
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
        dbService.getRoles(),
        dbService.getAuditLogs()
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
      setAuditLogs(loadedAuditLogs);
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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 flex flex-col font-sans antialiased selection:bg-emerald-200">
      {/* 1. Fixed Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all duration-300">
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
        />

        {/* Dynamic Main Workspace View */}
        <main className="flex-1 px-4 md:px-6 py-5 max-w-[1600px] w-full mx-auto">
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
              onAddDeliveryBoy={() => setIsDeliveryBoyModalOpen(true)}
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
            />
          )}

          {activeTab === 'categories' && (
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
            />
          )}

          {activeTab === 'zones' && (
            <ZonesView zones={zones} onRefresh={loadData} />
          )}

          {activeTab === 'vehicles' && (
            <VehiclesView vehicles={vehicles} deliveryBoys={deliveryBoys} onRefresh={loadData} />
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
            <OrdersView
              orders={orders.filter(o => o.order_status === 'Cancelled' || o.order_status === 'Failed')}
              onPunchOrder={handlePunchOrder}
              onViewOrder={(order) => setSelectedOrderForDetails(order)}
              onAssignOrder={handleOpenAssignModal}
              onStatusChange={handleStatusChange}
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

          {activeTab === 'audit-logs' && (
            <AuditLogsView
              logs={auditLogs}
            />
          )}

          {activeTab === 'support' && (
            <SupportView />
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
        onClose={() => setIsDeliveryBoyModalOpen(false)}
        zones={zones}
        onDeliveryBoySaved={() => {
          loadData();
          setIsDeliveryBoyModalOpen(false);
        }}
      />
    </div>
  );
}

export default App;
