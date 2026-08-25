// ==============================================================================
// HARIBANSHO SYSTEM — GLOBAL FRONTEND ↔ SUPABASE FIELD MAPPING REGISTRY
// ==============================================================================
// This registry provides the 1-to-1 data contract across all application modules.
// Every form field, database column, data type, and validation rule is registered here.

export interface FieldMapping {
  formSection?: string;
  frontendField: string;
  supabaseTable: string;
  supabaseColumn: string;
  dataType: string;
  required: boolean;
  editable: boolean;
  readOnly: boolean;
  validationRule?: string;
  relationship?: string;
  purpose: 'user_input' | 'system_calculated' | 'auth_credential' | 'relationship_id' | 'audit_timestamp';
}

export interface ModuleFieldRegistry {
  moduleName: string;
  primaryTable: string;
  secondaryTables?: string[];
  fields: FieldMapping[];
}

export const APPLICATION_FIELD_REGISTRY: Record<string, ModuleFieldRegistry> = {
  // 1. DELIVERY FLEET & RIDERS (01_delivery_boys + 01_users)
  delivery_boys: {
    moduleName: 'Delivery Fleet & Riders',
    primaryTable: '01_delivery_boys',
    secondaryTables: ['01_users', '01_zones', '01_vehicles'],
    fields: [
      {
        formSection: 'Personal Information',
        frontendField: 'Employee Code',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'employee_code',
        dataType: 'VARCHAR(50)',
        required: true,
        editable: true,
        readOnly: false,
        validationRule: 'Required, unique format e.g. DB-0834',
        purpose: 'user_input',
      },
      {
        formSection: 'Personal Information',
        frontendField: 'First Name',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'first_name',
        dataType: 'VARCHAR(100)',
        required: true,
        editable: true,
        readOnly: false,
        validationRule: 'Required string',
        purpose: 'user_input',
      },
      {
        formSection: 'Personal Information',
        frontendField: 'Last Name',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'last_name',
        dataType: 'VARCHAR(100)',
        required: true,
        editable: true,
        readOnly: false,
        validationRule: 'Required string',
        purpose: 'user_input',
      },
      {
        formSection: 'Personal Information',
        frontendField: 'Full Name',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'full_name',
        dataType: 'VARCHAR(200)',
        required: true,
        editable: true,
        readOnly: false,
        purpose: 'user_input',
      },
      {
        formSection: 'Personal Information',
        frontendField: 'Phone Number',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'phone',
        dataType: 'VARCHAR(20)',
        required: true,
        editable: true,
        readOnly: false,
        validationRule: 'Standard 10-12 digit phone number',
        purpose: 'user_input',
      },
      {
        formSection: 'Personal Information',
        frontendField: 'Email Address',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'email',
        dataType: 'VARCHAR(255)',
        required: true,
        editable: true,
        readOnly: false,
        validationRule: 'Valid email address',
        purpose: 'user_input',
      },
      {
        formSection: 'Personal Information',
        frontendField: 'Profile Image URL',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'profile_image_url',
        dataType: 'TEXT',
        required: false,
        editable: true,
        readOnly: false,
        purpose: 'user_input',
      },
      {
        formSection: 'Personal Information',
        frontendField: 'Driving License Number',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'license_number',
        dataType: 'VARCHAR(100)',
        required: false,
        editable: true,
        readOnly: false,
        purpose: 'user_input',
      },
      {
        formSection: 'Personal Information',
        frontendField: 'Emergency Contact',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'emergency_contact',
        dataType: 'VARCHAR(50)',
        required: false,
        editable: true,
        readOnly: false,
        purpose: 'user_input',
      },
      {
        formSection: 'Work Information',
        frontendField: 'Assigned Zone',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'zone_id',
        dataType: 'UUID',
        required: false,
        editable: true,
        readOnly: false,
        relationship: '01_zones.id',
        purpose: 'relationship_id',
      },
      {
        formSection: 'Work Information',
        frontendField: 'Zone Name Display',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'zone_name',
        dataType: 'VARCHAR(100)',
        required: false,
        editable: true,
        readOnly: false,
        purpose: 'user_input',
      },
      {
        formSection: 'Work Information',
        frontendField: 'Assigned Vehicle',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'vehicle_id',
        dataType: 'UUID',
        required: false,
        editable: true,
        readOnly: false,
        relationship: '01_vehicles.id',
        purpose: 'relationship_id',
      },
      {
        formSection: 'Work Information',
        frontendField: 'Vehicle Details',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'vehicle_info',
        dataType: 'VARCHAR(200)',
        required: false,
        editable: true,
        readOnly: false,
        purpose: 'user_input',
      },
      {
        formSection: 'Work Information',
        frontendField: 'Employment Status',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'employment_status',
        dataType: 'VARCHAR(50)',
        required: true,
        editable: true,
        readOnly: false,
        validationRule: 'Full Time | Part Time | Contract',
        purpose: 'user_input',
      },
      {
        formSection: 'Work Information',
        frontendField: 'Date of Joining',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'joined_at',
        dataType: 'DATE',
        required: false,
        editable: true,
        readOnly: false,
        purpose: 'user_input',
      },
      {
        formSection: 'Availability',
        frontendField: 'Availability Status',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'availability_status',
        dataType: 'VARCHAR(30)',
        required: true,
        editable: true,
        readOnly: false,
        validationRule: 'Available | Busy | Offline | On Break',
        purpose: 'user_input',
      },
      {
        formSection: 'App Login Credentials',
        frontendField: 'App Login User ID',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'app_username',
        dataType: 'VARCHAR(100)',
        required: true,
        editable: true,
        readOnly: false,
        relationship: '01_users.phone / 01_users.email',
        purpose: 'auth_credential',
      },
      {
        formSection: 'App Login Credentials',
        frontendField: 'App Password / PIN',
        supabaseTable: '01_users',
        supabaseColumn: 'password',
        dataType: 'VARCHAR(255)',
        required: true,
        editable: true,
        readOnly: false,
        validationRule: 'Encrypted hash / Secure Auth Password',
        purpose: 'auth_credential',
      },
      {
        formSection: 'System Metrics',
        frontendField: 'Average Rating',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'rating',
        dataType: 'NUMERIC(3,2)',
        required: false,
        editable: false,
        readOnly: true,
        purpose: 'system_calculated',
      },
      {
        formSection: 'System Metrics',
        frontendField: 'Total Deliveries',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'total_deliveries',
        dataType: 'INT',
        required: false,
        editable: false,
        readOnly: true,
        purpose: 'system_calculated',
      },
      {
        formSection: 'System Metrics',
        frontendField: 'Successful Deliveries',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'successful_deliveries',
        dataType: 'INT',
        required: false,
        editable: false,
        readOnly: true,
        purpose: 'system_calculated',
      },
      {
        formSection: 'System Metrics',
        frontendField: 'Cancelled Deliveries',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'cancelled_deliveries',
        dataType: 'INT',
        required: false,
        editable: false,
        readOnly: true,
        purpose: 'system_calculated',
      },
      {
        formSection: 'Live Telemetry',
        frontendField: 'Current Latitude',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'current_latitude',
        dataType: 'NUMERIC(10,7)',
        required: false,
        editable: false,
        readOnly: true,
        purpose: 'system_calculated',
      },
      {
        formSection: 'Live Telemetry',
        frontendField: 'Current Longitude',
        supabaseTable: '01_delivery_boys',
        supabaseColumn: 'current_longitude',
        dataType: 'NUMERIC(10,7)',
        required: false,
        editable: false,
        readOnly: true,
        purpose: 'system_calculated',
      }
    ]
  },

  // 2. USERS & ACCESS (01_users)
  users: {
    moduleName: 'Users & Roles',
    primaryTable: '01_users',
    fields: [
      { frontendField: 'First Name', supabaseTable: '01_users', supabaseColumn: 'first_name', dataType: 'VARCHAR(100)', required: true, editable: true, readOnly: false, purpose: 'user_input' },
      { frontendField: 'Last Name', supabaseTable: '01_users', supabaseColumn: 'last_name', dataType: 'VARCHAR(100)', required: true, editable: true, readOnly: false, purpose: 'user_input' },
      { frontendField: 'Email Address', supabaseTable: '01_users', supabaseColumn: 'email', dataType: 'VARCHAR(255)', required: true, editable: true, readOnly: false, purpose: 'user_input' },
      { frontendField: 'Phone Number', supabaseTable: '01_users', supabaseColumn: 'phone', dataType: 'VARCHAR(20)', required: true, editable: true, readOnly: false, purpose: 'user_input' },
      { frontendField: 'Role', supabaseTable: '01_users', supabaseColumn: 'role', dataType: 'VARCHAR(50)', required: true, editable: true, readOnly: false, purpose: 'user_input' },
      { frontendField: 'Account Status', supabaseTable: '01_users', supabaseColumn: 'status', dataType: 'VARCHAR(20)', required: true, editable: true, readOnly: false, purpose: 'user_input' },
      { frontendField: 'Auth User ID', supabaseTable: '01_users', supabaseColumn: 'auth_user_id', dataType: 'UUID', required: false, editable: false, readOnly: true, purpose: 'auth_credential' }
    ]
  }
};
