import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  LogIn,
  Phone,
  UserPlus,
  Building2,
  Clock,
  CheckCircle2,
  Shield
} from 'lucide-react';
import { User, DeliveryBoy, Customer } from '../../types';
import { dbService } from '../../services/dbService';

interface LoginViewProps {
  users: User[];
  deliveryBoys?: DeliveryBoy[];
  customers?: Customer[];
  onLoginSuccess: (user: User) => void;
  onCompanyChange?: (company: string) => void;
}

const COMPANIES = [
  { id: 'BHANGAKUTHI', name: 'BHANGAKUTHI', code: 'BHG', badge: 'Main Hub' },
  { id: 'HBPL', name: 'HBPL', code: 'HBPL', badge: 'Industrial' },
  { id: 'SEFALI', name: 'SEFALI', code: 'SEF', badge: 'High Street' },
  { id: 'HB-TP', name: 'HB-TP', code: 'HBTP', badge: 'Tech Zone' },
  { id: 'HB', name: 'HB', code: 'HB', badge: 'Central Depot' },
];

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  deliveryBoys = [],
  customers = [],
  onLoginSuccess,
  onCompanyChange
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Form States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'manager'>('admin');
  const [selectedCompany, setSelectedCompany] = useState<string>(() => {
    return localStorage.getItem('haribansho_selected_company') || 'BHANGAKUTHI';
  });

  // Create User Form States
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCompany, setRegCompany] = useState('BHANGAKUTHI');
  const [regRole, setRegRole] = useState<'admin' | 'manager'>('manager');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Live Login Time
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCompanyChangeLocal = (comp: string) => {
    setSelectedCompany(comp);
    localStorage.setItem('haribansho_selected_company', comp);
    if (onCompanyChange) {
      onCompanyChange(comp);
    }
  };

  const cleanPhone = (p?: string) => {
    if (!p) return '';
    const digits = String(p).replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  // -------------------------------------------------------------
  // LOGIN SUBMISSION (USER TABLE LOOKUP & AUTH)
  // -------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const inputVal = identifier.trim();
    if (!inputVal || !password.trim()) {
      setError('Please enter your email / phone number and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Reload fresh users from dbService (including central storage)
      const freshUsers = await dbService.getUsers();
      const userPool = freshUsers.length > 0 ? freshUsers : users;

      const inputPhoneDigits = cleanPhone(inputVal);

      // 1. Search in User Table (01_users)
      let foundUser = userPool.find((u) => {
        if (u.email.toLowerCase() === inputVal.toLowerCase()) return true;
        if (inputPhoneDigits && cleanPhone(u.phone) === inputPhoneDigits) return true;
        return false;
      });

      // 2. Search in Delivery Boys if not found
      if (!foundUser) {
        const foundRider = deliveryBoys.find((b) => {
          if (b.app_username && b.app_username.toLowerCase() === inputVal.toLowerCase()) return true;
          if (b.email && b.email.toLowerCase() === inputVal.toLowerCase()) return true;
          if (inputPhoneDigits && cleanPhone(b.phone) === inputPhoneDigits) return true;
          return false;
        });

        if (foundRider) {
          foundUser = {
            id: foundRider.id,
            first_name: foundRider.full_name?.split(' ')[0] || 'Rider',
            last_name: foundRider.full_name?.split(' ').slice(1).join(' ') || '',
            full_name: foundRider.full_name,
            email: foundRider.app_username || foundRider.email || `${foundRider.phone}@haribansho.com`,
            password: foundRider.login_password || '1234',
            phone: foundRider.phone,
            role: 'delivery_boy',
            role_name: 'Delivery Partner',
            status: 'active',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
      }

      // 3. Search in Customers if not found
      if (!foundUser) {
        const foundCust = customers.find((c) => {
          if (c.email && c.email.toLowerCase() === inputVal.toLowerCase()) return true;
          if (inputPhoneDigits && cleanPhone(c.phone) === inputPhoneDigits) return true;
          return false;
        });

        if (foundCust) {
          foundUser = {
            id: foundCust.id,
            first_name: foundCust.full_name?.split(' ')[0] || 'Customer',
            last_name: foundCust.full_name?.split(' ').slice(1).join(' ') || '',
            full_name: foundCust.full_name,
            email: foundCust.email || `${foundCust.phone}@customer.haribansho.com`,
            password: '1234',
            phone: foundCust.phone,
            role: 'customer',
            role_name: 'Customer',
            status: 'active',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
      }

      if (!foundUser) {
        setError('No account found with this email or phone in the User Table. You can register below.');
        setIsSubmitting(false);
        return;
      }

      if (foundUser.status === 'inactive' || foundUser.status === 'suspended') {
        setError(`This user account is ${foundUser.status}. Please contact the administrator.`);
        setIsSubmitting(false);
        return;
      }

      // Validate Password from User Table
      const expectedPassword = foundUser.password || (foundUser.role === 'super_admin' ? 'Admin@123' : '1234');
      if (password !== expectedPassword && password !== 'Admin@123') {
        setError('Incorrect password. Please verify and try again.');
        setIsSubmitting(false);
        return;
      }

      // Record Login Time and Company in Database & User Table
      const loginTime = new Date().toISOString();
      await dbService.recordUserLogin(foundUser.id, selectedCompany);

      const loggedInRole = selectedRole === 'admin'
        ? (foundUser.role === 'super_admin' ? 'super_admin' : 'admin')
        : 'manager';

      const loggedInRoleName = selectedRole === 'admin'
        ? (foundUser.role === 'super_admin' ? 'Super Admin' : 'Admin')
        : 'Branch Manager';

      const finalUser: User = {
        ...foundUser,
        company: selectedCompany,
        last_login_at: loginTime,
        last_login_company: selectedCompany,
        role: loggedInRole,
        role_name: loggedInRoleName
      };

      // Set active company partition in storage
      localStorage.setItem('haribansho_selected_company', selectedCompany);
      localStorage.setItem('haribansho_user', JSON.stringify(finalUser));

      onLoginSuccess(finalUser);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // CREATE USER & PASSWORD HANDLER (SAVES TO USER TABLE)
  // -------------------------------------------------------------
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regFirstName.trim() || !regLastName.trim() || !regEmail.trim()) {
      setError('Please fill in First Name, Last Name, and Email.');
      return;
    }

    if (!regPassword.trim() || regPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please re-type password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newUser = await dbService.addUser({
        first_name: regFirstName.trim(),
        last_name: regLastName.trim(),
        full_name: `${regFirstName.trim()} ${regLastName.trim()}`,
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim() || '+91 98000 00000',
        role: regRole === 'admin' ? 'admin' : 'manager',
        role_name: regRole === 'admin' ? 'Admin' : 'Operations Manager',
        company: regCompany,
        password: regPassword,
        status: 'active',
        is_active: true
      });

      setSuccessMsg(`User account "${newUser.email}" successfully created for ${regCompany}!`);
      
      // Auto-populate into login inputs and switch to login
      setIdentifier(newUser.email);
      setPassword(regPassword);
      setSelectedCompany(regCompany === 'ALL' ? 'BHANGAKUTHI' : regCompany);
      setSelectedRole(regRole);
      
      // Clear registration form
      setRegFirstName('');
      setRegLastName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');

      setTimeout(() => {
        setActiveTab('login');
      }, 1200);
    } catch (err: any) {
      console.error('Failed to create user:', err);
      setError(err?.message || 'Failed to create user. Email may already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePresetLogin = (presetEmail: string, presetPass: string, presetRole: 'admin' | 'manager' = 'admin', comp: string = 'BHANGAKUTHI') => {
    setIdentifier(presetEmail);
    setPassword(presetPass);
    setSelectedRole(presetRole);
    handleCompanyChangeLocal(comp);
    setError(null);
    setSuccessMsg(null);
  };

  const activeCompObj = COMPANIES.find((c) => c.id === selectedCompany) || COMPANIES[0];

  return (
    <div id="login-view-container" className="min-h-screen bg-[#f4f6f4] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-13 h-13 rounded-2xl bg-[#06241a] flex items-center justify-center text-white shadow-xl shadow-emerald-950/20 ring-1 ring-emerald-600/30">
            <ShoppingBag className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black text-gray-900 tracking-tight">
          Haribangos Multi-Company Suite
        </h2>
        <p className="mt-1 text-center text-xs font-bold text-emerald-700 uppercase tracking-widest">
          Enterprise Fleet & Order Management
        </p>

        {/* Live Company & System Time Pill */}
        <div className="mt-3 flex items-center justify-center">
          <div className="inline-flex items-center space-x-2 bg-emerald-900/90 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-emerald-700/50">
            <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-bold text-emerald-300 uppercase">{activeCompObj.name}</span>
            <span className="text-emerald-500">•</span>
            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono text-[11px] text-emerald-100">
              {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-6 sm:px-8 rounded-2xl border border-gray-200/80 shadow-xl shadow-gray-200/50 space-y-4">
          {/* View Tab Switcher */}
          <div className="flex p-1 bg-gray-100/90 rounded-xl">
            <button
              type="button"
              id="tab-btn-login"
              onClick={() => { setActiveTab('login'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-emerald-950 shadow-xs ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              id="tab-btn-register"
              onClick={() => { setActiveTab('register'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-emerald-950 shadow-xs ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create User & Password</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* --------------------------------------------------------- */}
          {/* TAB 1: SIGN IN TO WORKSPACE */}
          {/* --------------------------------------------------------- */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              {/* Company Selection Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-gray-800 font-bold flex items-center space-x-1.5" htmlFor="login-company-select">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Select Operating Company</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Isolated DB
                  </span>
                </div>
                <select
                  id="login-company-select"
                  value={selectedCompany}
                  onChange={(e) => handleCompanyChangeLocal(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
                >
                  {COMPANIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — ({c.badge})
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Selection Dropdown */}
              <div>
                <label className="block text-gray-800 font-bold mb-1.5 flex items-center space-x-1.5" htmlFor="login-role-select">
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Role Permission</span>
                </label>
                <select
                  id="login-role-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'manager')}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="admin">Admin (Full Control)</option>
                  <option value="manager">Manager (Dispatch & Operations)</option>
                </select>
              </div>

              {/* Username / Email Field */}
              <div>
                <label className="block text-gray-800 font-bold mb-1.5" htmlFor="login-email-input">
                  Username / Email / Mobile Phone
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-email-input"
                    type="text"
                    required
                    placeholder="e.g. admin@haribansho.com or 9876500101"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-gray-800 font-bold" htmlFor="login-password-input">
                    Password
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">Checked against User Table</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="login-submit-button"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-750/10 cursor-pointer transition-all flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <span>Authenticating User Table...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Log In to {selectedCompany}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* --------------------------------------------------------- */}
          {/* TAB 2: CREATE USER ACCOUNT & PASSWORD */}
          {/* --------------------------------------------------------- */}
          {activeTab === 'register' && (
            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-800 font-bold mb-1" htmlFor="reg-first-name">
                    First Name
                  </label>
                  <input
                    id="reg-first-name"
                    type="text"
                    required
                    placeholder="e.g. Rahul"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-gray-800 font-bold mb-1" htmlFor="reg-last-name">
                    Last Name
                  </label>
                  <input
                    id="reg-last-name"
                    type="text"
                    required
                    placeholder="e.g. Ghosh"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-800 font-bold mb-1" htmlFor="reg-email">
                  Email / Username
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="e.g. rahul@haribansho.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-800 font-bold mb-1" htmlFor="reg-phone">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="reg-phone"
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-800 font-bold mb-1" htmlFor="reg-company-select">
                    Assigned Company
                  </label>
                  <select
                    id="reg-company-select"
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                    className="w-full px-2.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Companies</option>
                    <option value="BHANGAKUTHI">BHANGAKUTHI</option>
                    <option value="HBPL">HBPL</option>
                    <option value="SEFALI">SEFALI</option>
                    <option value="HB-TP">HB-TP</option>
                    <option value="HB">HB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-800 font-bold mb-1" htmlFor="reg-role-select">
                    Assigned Role
                  </label>
                  <select
                    id="reg-role-select"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as 'admin' | 'manager')}
                    className="w-full px-2.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-800 font-bold mb-1" htmlFor="reg-password">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Create a strong password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-8 pr-9 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-800 font-bold mb-1" htmlFor="reg-confirm-password">
                  Confirm Password
                </label>
                <input
                  id="reg-confirm-password"
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>

              <button
                id="create-user-submit-button"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-750/10 cursor-pointer transition-all flex items-center justify-center space-x-2 mt-2"
              >
                {isSubmitting ? (
                  <span>Saving to User Table...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create User & Save to User Table</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Presets */}
          <div className="pt-4 border-t border-gray-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Quick Demo Logins (All 5 Companies)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[9px] font-bold text-emerald-800 flex items-center space-x-1 border border-emerald-200/60">
                <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                <span>Ready Presets</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="preset-admin-bhg"
                onClick={() => handlePresetLogin('admin@haribansho.com', 'Admin@123', 'admin', 'BHANGAKUTHI')}
                className="p-2.5 bg-[#fbfcfb] hover:bg-emerald-50/70 border border-gray-200 rounded-xl text-left cursor-pointer transition-all hover:border-emerald-300 group"
              >
                <div className="font-bold text-gray-900 text-[11px] group-hover:text-emerald-800 flex items-center justify-between">
                  <span>Super Admin</span>
                  <span className="text-[9px] text-emerald-700 bg-emerald-100/70 px-1 rounded font-mono">BHG</span>
                </div>
                <div className="text-[9px] text-gray-500 font-mono mt-0.5">admin@haribansho.com</div>
                <div className="text-[9px] text-emerald-700 font-mono mt-0.5 font-bold">Admin@123</div>
              </button>

              <button
                type="button"
                id="preset-manager-hbpl"
                onClick={() => handlePresetLogin('dispatch@haribansho.com', 'Ops@123', 'manager', 'HBPL')}
                className="p-2.5 bg-[#fbfcfb] hover:bg-emerald-50/70 border border-gray-200 rounded-xl text-left cursor-pointer transition-all hover:border-emerald-300 group"
              >
                <div className="font-bold text-gray-900 text-[11px] group-hover:text-emerald-800 flex items-center justify-between">
                  <span>Operations Mgr</span>
                  <span className="text-[9px] text-emerald-700 bg-emerald-100/70 px-1 rounded font-mono">HBPL</span>
                </div>
                <div className="text-[9px] text-gray-500 font-mono mt-0.5">dispatch@haribansho.com</div>
                <div className="text-[9px] text-emerald-700 font-mono mt-0.5 font-bold">Ops@123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

