export type UserRoleSlug = 
  | 'super_admin' 
  | 'admin' 
  | 'manager' 
  | 'dispatcher' 
  | 'delivery_manager' 
  | 'delivery_boy' 
  | 'finance' 
  | 'support'
  | 'operations_manager'
  | 'viewer'
  | string;

export interface UserPermission {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  manage: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  slug: string;
  description: string;
  permissions: string[] | Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean; export: boolean; manage: boolean }>;
  is_active: boolean;
  is_system?: boolean;
  user_count?: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  auth_user_id?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  password?: string;
  phone: string;
  avatar_url?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  is_active: boolean;
  role: string;
  role_name?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string; // 'Home' | 'Work' | 'Other'
  recipient_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  landmark?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  customer_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  alternate_phone?: string;
  profile_image_url?: string;
  status: 'active' | 'inactive' | 'blocked';
  total_orders: number;
  total_spent: number;
  notes?: string;
  addresses?: CustomerAddress[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_category_id?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  product_code: string;
  name: string;
  slug: string;
  description?: string;
  category_id: string;
  category_name?: string;
  sku: string;
  barcode?: string;
  unit: string;
  unit_of_measure?: string;
  selling_price: number;
  cost_price: number;
  mrp?: number;
  tax_percentage: number;
  image_url?: string;
  quantity_available: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Zone {
  id: string;
  name: string;
  zone_code: string;
  description?: string;
  city: string;
  state: string;
  country: string;
  color: string;
  center_lat: number;
  center_lng: number;
  order_count?: number;
  delivery_boy_count?: number;
  base_delivery_charge?: number;
  minimum_order_amount?: number;
  pincodes?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  zone_id: string;
  zone_name?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type VehicleType = 'Bike' | 'Scooter' | 'Bicycle' | 'Car' | 'Van' | 'Truck';

export interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  fuel_type: 'Petrol' | 'Diesel' | 'Electric' | 'CNG' | 'None';
  capacity: string;
  assigned_delivery_boy_id?: string | null;
  assigned_delivery_boy_name?: string;
  registration_expiry: string;
  insurance_expiry: string;
  status: 'active' | 'maintenance' | 'inactive';
  created_at: string;
  updated_at: string;
}

export type DeliveryBoyAvailability = 'Available' | 'Busy' | 'Offline' | 'On Break' | 'On Delivery';

export interface DeliveryBoy {
  id: string;
  user_id?: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  email: string;
  app_username?: string;
  login_password?: string;
  profile_image_url?: string;
  zone_id: string;
  zone_name?: string;
  vehicle_id?: string | null;
  vehicle_info?: string;
  employment_status: 'Full Time' | 'Part Time' | 'Contract';
  availability_status: DeliveryBoyAvailability;
  rating: number;
  total_deliveries: number;
  successful_deliveries: number;
  cancelled_deliveries: number;
  current_latitude: number;
  current_longitude: number;
  last_location_name?: string;
  last_location_at?: string;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 
  | 'Pending' 
  | 'Confirmed' 
  | 'Assigned' 
  | 'Out for Delivery' 
  | 'Delivered' 
  | 'Cancelled' 
  | 'Returned' 
  | 'Failed';

export type PaymentStatus = 
  | 'Pending' 
  | 'Paid' 
  | 'COD Pending' 
  | 'COD Collected' 
  | 'Refunded' 
  | 'Failed';

export type PaymentMethod = 'COD' | 'Online' | 'Card' | 'UPI' | 'Wallet';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address_id: string;
  delivery_address_text: string;
  zone_id: string;
  zone_name: string;
  order_status: OrderStatus;
  assignment_status: 'Unassigned' | 'Assigned' | 'Accepted' | 'On The Way' | 'Delivered' | 'Failed';
  assigned_delivery_boy_id?: string | null;
  assigned_delivery_boy_name?: string | null;
  assigned_delivery_boy_phone?: string | null;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  discount_amount: number;
  delivery_charge: number;
  tax_amount: number;
  total_amount: number;
  cod_amount: number;
  scheduled_delivery_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  customer_notes?: string;
  internal_notes?: string;
  items_count?: number;
  items?: OrderItem[];
  created_by?: string;
  time_display?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  previous_status?: OrderStatus;
  new_status: OrderStatus;
  changed_by_name: string;
  remarks?: string;
  created_at: string;
}

export interface DeliveryAssignment {
  id: string;
  order_id: string;
  order_number?: string;
  delivery_boy_id: string;
  delivery_boy_name?: string;
  assigned_by?: string;
  assignment_status: 'Assigned' | 'Accepted' | 'Rejected' | 'Picked Up' | 'On The Way' | 'Delivered' | 'Failed';
  assigned_at: string;
  accepted_at?: string;
  rejected_at?: string;
  completed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryTrackingPoint {
  id: string;
  order_id: string;
  delivery_boy_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  location_name: string;
  tracking_status: string;
  recorded_at: string;
  created_at: string;
}

export interface DeliveryTrackingHistoryEvent {
  id: string;
  order_id: string;
  delivery_boy_id: string;
  event_type: 'Assigned' | 'Started' | 'Reached Pickup' | 'Picked Up' | 'On The Way' | 'Reached Destination' | 'Delivered' | 'Failed';
  event_message: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  payment_method: PaymentMethod;
  transaction_id: string;
  amount: number;
  payment_status: PaymentStatus;
  paid_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CODSettlement {
  id: string;
  delivery_boy_id: string;
  delivery_boy_name: string;
  order_id: string;
  order_number: string;
  amount_collected: number;
  settlement_status: 'Pending' | 'Settled' | 'Disputed';
  collected_at: string;
  settled_at?: string;
  settled_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReturnRecord {
  id: string;
  order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  delivery_boy_id?: string;
  delivery_boy_name?: string;
  return_reason: string;
  return_status: 'Requested' | 'Approved' | 'Picked Up' | 'Completed' | 'Rejected';
  return_amount: number;
  approved_by?: string;
  returned_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CancellationRecord {
  id: string;
  order_id: string;
  order_number: string;
  cancelled_by_name: string;
  cancellation_type: 'Customer' | 'Admin' | 'Delivery Boy' | 'Auto-Timeout';
  reason: string;
  refund_amount: number;
  cancelled_at: string;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 
  | 'Order Update' 
  | 'Delivery Update' 
  | 'Payment' 
  | 'Promotion' 
  | 'System Alert' 
  | 'General'
  | 'Order'
  | 'Delivery'
  | 'System'
  | 'Alert';

export type NotificationRecipientType = 
  | 'All Users' 
  | 'All Customers' 
  | 'All Delivery Boys' 
  | 'Specific Customer' 
  | 'Specific Delivery Boy' 
  | 'Specific User' 
  | 'Specific Role';

export type NotificationPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface AppNotification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  recipient_type?: NotificationRecipientType;
  recipient_id?: string;
  recipient_name?: string;
  priority?: NotificationPriority;
  scheduled_at?: string;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface Offer {
  id: string;
  title: string;
  name?: string;
  description: string;
  offer_type?: 'Percentage' | 'Flat Amount' | 'Free Delivery' | 'Buy X Get Y' | 'Special Campaign' | 'percentage' | 'fixed';
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount_amount?: number;
  applicable_products?: string[];
  applicable_categories?: string[];
  applicable_zones?: string[];
  usage_limit?: number;
  usage_count?: number;
  start_date: string;
  start_time?: string;
  end_date: string;
  end_time?: string;
  status: 'active' | 'upcoming' | 'expired' | 'scheduled';
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  name?: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount_amount?: number;
  usage_limit: number;
  usage_count: number;
  per_customer_limit: number;
  applicable_customers?: string[];
  applicable_products?: string[];
  applicable_categories?: string[];
  applicable_zones?: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  status?: 'active' | 'scheduled' | 'expired' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  ip_address: string;
  user_agent?: string;
  created_at: string;
}

export interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_group: 'General' | 'Branding' | 'Delivery' | 'Orders' | 'Payments' | 'Notifications' | 'Security';
  description: string;
  is_public: boolean;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id?: string;
  customer_id?: string;
  customer_name: string;
  subject: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assigned_to_name?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalOrders?: number;
  totalOrdersGrowth?: number;
  pendingOrders?: number;
  pendingOrdersGrowth?: number;
  assignedOrders?: number;
  assignedOrdersGrowth?: number;
  deliveredOrders?: number;
  deliveredOrdersGrowth?: number;
  cancelledOrders?: number;
  cancelledOrdersGrowth?: number;
  totalRevenue?: number;
  totalRevenueGrowth?: number;
  
  // Today's summary
  todayNewOrders?: number;
  todayOutForDelivery?: number;
  todayDelivered?: number;
  todayCodAmount?: number;
  avgDeliveryTimeMinutes?: number;

  total_orders?: number;
  total_orders_growth_pct?: number;
  pending_orders?: number;
  pending_orders_growth_pct?: number;
  assigned_orders?: number;
  assigned_orders_growth_pct?: number;
  delivered_orders?: number;
  delivered_orders_growth_pct?: number;
  cancelled_orders?: number;
  cancelled_orders_growth_pct?: number;
  total_revenue?: number;
  total_revenue_growth_pct?: number;
  today_new_orders?: number;
  today_out_for_delivery?: number;
  today_delivered?: number;
  today_cod_amount?: number;
  today_avg_delivery_mins?: number;
}
