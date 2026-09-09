import React, { useState } from 'react';
import {
  ShoppingBag,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { User, DeliveryBoy, Customer } from '../../types';
import { dbService } from '../../services/dbService';

interface LoginViewProps {
  users?: User[];
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
  onLoginSuccess,
  onCompanyChange
}) => {
  // Form States
  const [selectedCompany, setSelectedCompany] = useState<string>(() => {
    return localStorage.getItem('haribansho_selected_company') || 'BHANGAKUTHI';
  });
  const [selectedRole, setSelectedRole] = useState<string>('super_admin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompanyChangeLocal = (comp: string) => {
    setSelectedCompany(comp);
    localStorage.setItem('haribansho_selected_company', comp);
    if (onCompanyChange) {
      onCompanyChange(comp);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const inputVal = identifier.trim();
    if (!inputVal || !password.trim()) {
      setError('Please enter your user name and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await dbService.authenticateUser(
        selectedCompany,
        selectedRole,
        inputVal,
        password.trim()
      );

      if (!result.success || !result.user) {
        setError(result.error || 'Authentication failed. Please check your credentials.');
        setIsSubmitting(false);
        return;
      }

      onLoginSuccess(result.user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (u: string, p: string, r: string, c: string) => {
    setIdentifier(u);
    setPassword(p);
    setSelectedRole(r);
    setSelectedCompany(c);
    setError(null);
  };

  return (
    <div id="login-view-container" className="min-h-screen bg-[#f4f6f4] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#06241a] flex items-center justify-center text-white shadow-xl shadow-emerald-950/20 ring-1 ring-emerald-600/30">
            <ShoppingBag className="w-7 h-7 text-emerald-400" />
          </div>
        </div>
        <h1 className="mt-4 text-center text-2xl font-black text-gray-900 tracking-tight">
          Haribansho Multi-Company Suite
        </h1>
        <p className="mt-1 text-center text-xs font-bold text-emerald-700 uppercase tracking-widest">
          Enterprise Fleet & Order Management
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl border border-gray-200/80 shadow-xl shadow-gray-200/50 space-y-5">
          {/* Error Alert */}
          {error && (
            <div id="login-error-alert" className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start space-x-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Secure Login Form */}
          <form id="login-form" onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* 1. Select Operating Company */}
            <div>
              <label className="block text-gray-800 font-bold mb-1.5 flex items-center space-x-1.5" htmlFor="login-company-select">
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Select Operating Company</span>
              </label>
              <select
                id="login-company-select"
                value={selectedCompany}
                onChange={(e) => handleCompanyChangeLocal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
              >
                {COMPANIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.badge})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Role Permission */}
            <div>
              <label className="block text-gray-800 font-bold mb-1.5 flex items-center space-x-1.5" htmlFor="login-role-select">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Role Permission</span>
              </label>
              <select
                id="login-role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all cursor-pointer"
              >
                <option value="super_admin">Super Admin (Central Suite Control)</option>
                <option value="admin">Branch Administrator (Full Control)</option>
                <option value="operations_manager">Operations Manager (Dispatch & Fleet Lead)</option>
                <option value="dispatcher">Dispatch Operator (Orders & Riders)</option>
                <option value="viewer">Read-only Viewer (Audits & Reports)</option>
              </select>
            </div>

            {/* 3. User Name */}
            <div>
              <label className="block text-gray-800 font-bold mb-1.5" htmlFor="login-username-input">
                User Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="login-username-input"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="Enter username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* 4. Password */}
            <div>
              <label className="block text-gray-800 font-bold mb-1.5" htmlFor="login-password-input">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-medium"
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 5. Log In Button */}
            <button
              id="login-submit-button"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-800/10 cursor-pointer transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Log In</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Quick-Select Chips */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-[11px] font-bold text-gray-700 mb-2">Quick Sign-In (All Companies):</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('Admin', 'Admin@1234', 'super_admin', selectedCompany)}
                className="p-2.5 text-left bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[11px] transition-colors cursor-pointer"
              >
                <div className="font-black text-emerald-950">Admin (All Co.)</div>
                <div className="text-emerald-800 text-[10px] mt-0.5">User: <strong className="font-mono">Admin</strong></div>
                <div className="text-emerald-700 text-[10px]">Pass: <strong className="font-mono">Admin@1234</strong></div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('Manager', 'Manager@1234', 'admin', selectedCompany)}
                className="p-2.5 text-left bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-[11px] transition-colors cursor-pointer"
              >
                <div className="font-black text-blue-950">Manager (All Co.)</div>
                <div className="text-blue-800 text-[10px] mt-0.5">User: <strong className="font-mono">Manager</strong></div>
                <div className="text-blue-700 text-[10px]">Pass: <strong className="font-mono">Manager@1234</strong></div>
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="text-center">
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Authorized access only. User accounts and credentials are created and managed by the System Administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
