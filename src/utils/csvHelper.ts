/**
 * Utility for parsing CSV string, generating CSV string, and sample templates for all entity types.
 */

// Helper to escape CSV fields
export function formatCSVField(field: any): string {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str}"`;
  }
  return str;
}

// Convert Array of Objects to CSV String
export function objectsToCSV(data: Record<string, any>[]): string {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const headerLine = headers.map(formatCSVField).join(',');
  const rows = data.map(row =>
    headers.map(h => formatCSVField(row[h])).join(',')
  );
  return [headerLine, ...rows].join('\n');
}

// Parse CSV text into array of objects
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r\n|\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Simple CSV parser supporting quotes
  const parseLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map(h => h.replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === headers.length || values.some(v => v !== '')) {
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        const val = values[idx] ? values[idx].replace(/^"|"$/g, '') : '';
        rowObj[h] = val;
      });
      rows.push(rowObj);
    }
  }

  return rows;
}

// Trigger CSV Download in Browser
export function downloadCSVFile(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Trigger Text File Download
export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Sample Templates for all 16 Sections
export const SAMPLE_DATA_TEMPLATES: Record<string, { title: string; filename: string; headers: string[]; csvSample: string }> = {
  orders: {
    title: 'Orders',
    filename: 'Sample_Orders.csv',
    headers: ['customer_name', 'customer_phone', 'delivery_address', 'payment_method', 'total_amount', 'status', 'zone_name'],
    csvSample: `customer_name,customer_phone,delivery_address,payment_method,total_amount,status,zone_name
Ramesh Kumar,9876543210,123 Green Park Colony, Lucknow,COD,450,Pending,North Zone
Priya Sharma,9123456789,45 Hazratganj Main Rd, Lucknow,Online,1200,Confirmed,Central Zone
Amit Patel,9988776655,88 Gomti Nagar, Lucknow,UPI,350,Delivered,East Zone`
  },
  assign_orders: {
    title: 'Assign Orders',
    filename: 'Sample_Order_Assignments.csv',
    headers: ['order_id', 'order_display_id', 'delivery_boy_id', 'delivery_boy_name', 'assignment_status'],
    csvSample: `order_id,order_display_id,delivery_boy_id,delivery_boy_name,assignment_status
ord-101,#HB-8901,db-1,Prosun Majhi,Assigned
ord-102,#HB-8902,db-2,Vikram Singh,Dispatched`
  },
  delivery_boys: {
    title: 'Delivery Boys',
    filename: 'Sample_Delivery_Boys.csv',
    headers: ['first_name', 'last_name', 'phone', 'email', 'app_username', 'login_password', 'zone_name', 'vehicle_info', 'availability'],
    csvSample: `first_name,last_name,phone,email,app_username,login_password,zone_name,vehicle_info,availability
Prosun,Majhi,8910961660,prosun@haribansho.com,8910961660,Rider@123,North Zone,Hero Splendor (UP 32 AB 1234),Available
Vikram,Singh,9876501234,vikram@haribansho.com,9876501234,Rider@456,Central Zone,Honda Activa (UP 32 CD 5678),Available`
  },
  customers: {
    title: 'Customers',
    filename: 'Sample_Customers.csv',
    headers: ['full_name', 'phone', 'email', 'default_address', 'city', 'pincode'],
    csvSample: `full_name,phone,email,default_address,city,pincode
Sunita Verma,9811223344,sunita@example.com,Flat 402 Sunshine Apts Lucknow,Lucknow,226001
Rajesh Mishra,9933445566,mishra.rajesh@gmail.com,12 Park Road Hazratganj,Lucknow,226001`
  },
  products: {
    title: 'Products',
    filename: 'Sample_Products.csv',
    headers: ['name', 'category_name', 'selling_price', 'mrp', 'quantity_available', 'unit', 'tax_percentage', 'sku'],
    csvSample: `name,category_name,selling_price,mrp,quantity_available,unit,tax_percentage,sku
Fortune Sunlite Refined Oil 1L,Grocery,135,165,100,1L,5,SKU-OIL-1L
Aashirvaad Atta 5kg,Grocery,235,270,80,5kg,0,SKU-ATTA-5KG
Amul Taza Milk 500ml,Dairy,27,27,150,500ml,0,SKU-MILK-500`
  },
  categories: {
    title: 'Categories',
    filename: 'Sample_Categories.csv',
    headers: ['name', 'slug', 'description', 'display_order', 'is_active'],
    csvSample: `name,slug,description,display_order,is_active
Daily Grocery & Atta,daily-grocery,Fresh staples & daily cooking essentials,1,true
Dairy & Bakery,dairy-bakery,Milk butter cheese and bakery items,2,true
Personal Care,personal-care,Soaps shampoos and hygiene,3,true`
  },
  zones: {
    title: 'Locations / Zones',
    filename: 'Sample_Zones.csv',
    headers: ['name', 'code', 'city', 'state', 'pincodes', 'is_active'],
    csvSample: `name,code,city,state,pincodes,is_active
North Zone - Aliganj,NZ-LKO,Lucknow,Uttar Pradesh,"226020, 226024",true
Central Zone - Hazratganj,CZ-LKO,Lucknow,Uttar Pradesh,"226001, 226002",true`
  },
  order_tracking: {
    title: 'Order Tracking',
    filename: 'Sample_Order_Tracking.csv',
    headers: ['order_display_id', 'customer_name', 'status', 'rider_name', 'latitude', 'longitude', 'last_updated'],
    csvSample: `order_display_id,customer_name,status,rider_name,latitude,longitude,last_updated
#HB-8901,Ramesh Kumar,Out for Delivery,Prosun Majhi,26.8467,80.9462,2026-08-24 10:30
#HB-8902,Priya Sharma,Dispatched,Vikram Singh,26.8500,80.9500,2026-08-24 10:35`
  },
  delivery_history: {
    title: 'Delivery History',
    filename: 'Sample_Delivery_History.csv',
    headers: ['order_display_id', 'customer_name', 'rider_name', 'completed_at', 'delivery_time_mins', 'rating', 'feedback'],
    csvSample: `order_display_id,customer_name,rider_name,completed_at,delivery_time_mins,rating,feedback
#HB-8890,Anil Kapoor,Prosun Majhi,2026-08-23 18:45,18,5,On time delivery
#HB-8891,Suresh Raina,Vikram Singh,2026-08-23 19:10,22,4,Polite rider`
  },
  payments_cod: {
    title: 'Payments & COD',
    filename: 'Sample_Payments_COD.csv',
    headers: ['transaction_id', 'order_display_id', 'amount', 'payment_mode', 'payment_status', 'settlement_status', 'collected_by_rider'],
    csvSample: `transaction_id,order_display_id,amount,payment_mode,payment_status,settlement_status,collected_by_rider
TXN-10023,#HB-8901,450,COD,Paid,Settled,Prosun Majhi
TXN-10024,#HB-8902,1200,UPI,Success,Auto-Settled,Online Gateway`
  },
  returns_cancelled: {
    title: 'Returns & Cancelled',
    filename: 'Sample_Returns_Cancelled.csv',
    headers: ['order_display_id', 'customer_name', 'type', 'reason', 'refund_amount', 'refund_status'],
    csvSample: `order_display_id,customer_name,type,reason,refund_amount,refund_status
#HB-8870,Meena Gupta,Return,Item damaged during transit,320,Refunded
#HB-8871,Sanjay Dutt,Cancellation,Customer changed mind,550,Processed`
  },
  reports_analytics: {
    title: 'Reports & Analytics',
    filename: 'Sample_Analytics_Metrics.csv',
    headers: ['date', 'total_orders', 'total_revenue', 'avg_delivery_time_mins', 'active_riders', 'cancellation_rate'],
    csvSample: `date,total_orders,total_revenue,avg_delivery_time_mins,active_riders,cancellation_rate
2026-08-23,142,48950,19.5,12,1.4%
2026-08-22,156,52300,18.2,14,0.8%`
  },
  notifications: {
    title: 'Notifications',
    filename: 'Sample_Notifications.csv',
    headers: ['title', 'message', 'type', 'target_group', 'sent_by'],
    csvSample: `title,message,type,target_group,sent_by
Flash Offer 20% OFF,Get 20% extra discount on daily fresh dairy items,Promo,All Customers,Admin
Peak Hour Surge Bonus,Earn Rs.15 extra per delivery completed between 7 PM - 10 PM,Alert,Riders,Operations`
  },
  offers_coupons: {
    title: 'Offers & Coupons',
    filename: 'Sample_Offers_Coupons.csv',
    headers: ['code', 'title', 'discount_type', 'discount_value', 'minimum_order_amount', 'is_active'],
    csvSample: `code,title,discount_type,discount_value,minimum_order_amount,is_active
WELCOME50,Flat Rs.50 OFF,flat,50,299,true
MONSOON20,20% Discount,percentage,20,499,true`
  },
  settings: {
    title: 'Settings',
    filename: 'Sample_Settings.csv',
    headers: ['setting_key', 'setting_value', 'description', 'category'],
    csvSample: `setting_key,setting_value,description,category
store_name,Haribansho Fresh Mart,Main app store title,General
free_delivery_min_amount,499,Minimum order for free delivery,Operations
support_helpline,+91 98000 11223,Customer care number,Contact`
  },
  users_roles: {
    title: 'Users & Roles',
    filename: 'Sample_Users_Roles.csv',
    headers: ['full_name', 'email', 'phone', 'role', 'status'],
    csvSample: `full_name,email,phone,role,status
Samar Dutta,business.samardutta@gmail.com,9876543210,Super Admin,Active
Neha Sharma,neha.ops@haribansho.com,9123456780,Operations Manager,Active`
  }
};
