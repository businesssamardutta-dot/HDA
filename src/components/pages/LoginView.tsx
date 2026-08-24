import React, { useState } from 'react';
import { ShoppingBag, Lock, Mail, Eye, EyeOff, AlertCircle, Sparkles, LogIn } from 'lucide-react';
import { User } from '../../types';

interface LoginViewProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);

    // Simulate database lookup network latency
    setTimeout(() => {
      const foundUser = users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (!foundUser) {
        setError('No account found with this email address.');
        setIsSubmitting(false);
        return;
      }

      if (foundUser.status === 'inactive' || foundUser.status === 'suspended') {
        setError(`This user account is ${foundUser.status}. Please contact the Super Admin.`);
        setIsSubmitting(false);
        return;
      }

      // Check password (fallback to 'Admin@123' if not defined for mock users)
      const userPassword = foundUser.password || (foundUser.role === 'super_admin' ? 'Admin@123' : 'Ops@123');
      if (userPassword !== password) {
        setError('Incorrect password. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Log in successfully
      onLoginSuccess(foundUser);
      setIsSubmitting(false);
    }, 600);
  };

  const handlePresetLogin = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError(null);
  };

  return (
    <div id="login-view-container" className="min-h-screen bg-[#faf9f6] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#06241a] flex items-center justify-center text-white shadow-xl shadow-emerald-950/20">
            <ShoppingBag className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <h2 className="mt-5 text-center text-2xl font-black text-gray-900 tracking-tight">
          Haribansho Quick Commerce
        </h2>
        <p className="mt-1.5 text-center text-xs font-semibold text-emerald-700 uppercase tracking-widest">
          Operations & Fleet Management Suite
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-700 font-bold mb-1.5" htmlFor="email-input">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email-input"
                  type="email"
                  required
                  placeholder="admin@haribansho.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-gray-700 font-bold" htmlFor="password-input">
                  Password
                </label>
                <span className="text-[10px] text-gray-400 font-medium">Case sensitive</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
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

            <button
              id="login-submit-button"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-750/10 cursor-pointer transition-all flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Log In to Workspace</span>
                </>
              )}
            </button>
          </form>

          {/* Preset Demo Logins with clear headers */}
          <div className="pt-5 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Quick Preset Roles
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[9px] font-bold text-emerald-800 flex items-center space-x-1">
                <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                <span>Demo Sandbox</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePresetLogin('admin@haribansho.com', 'Admin@123')}
                className="p-2.5 bg-[#fbfcfb] hover:bg-emerald-50/50 border border-gray-100 rounded-xl text-left cursor-pointer transition-all hover:border-emerald-200 group"
              >
                <div className="font-bold text-gray-900 text-[11px] group-hover:text-emerald-800">Super Admin</div>
                <div className="text-[9px] text-gray-500 font-mono mt-0.5">admin@haribansho.com</div>
                <div className="text-[9px] text-gray-400 font-mono mt-0.5">Pass: Admin@123</div>
              </button>

              <button
                type="button"
                onClick={() => handlePresetLogin('dispatch@haribansho.com', 'Ops@123')}
                className="p-2.5 bg-[#fbfcfb] hover:bg-emerald-50/50 border border-gray-100 rounded-xl text-left cursor-pointer transition-all hover:border-emerald-200 group"
              >
                <div className="font-bold text-gray-900 text-[11px] group-hover:text-emerald-800">Operations Mgr</div>
                <div className="text-[9px] text-gray-500 font-mono mt-0.5">dispatch@haribansho.com</div>
                <div className="text-[9px] text-gray-400 font-mono mt-0.5">Pass: Ops@123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
