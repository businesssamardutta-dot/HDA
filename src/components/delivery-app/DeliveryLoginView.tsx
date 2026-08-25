import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { DeliveryBoy } from '../../types';
import { dbService } from '../../services/dbService';

interface DeliveryLoginViewProps {
  onLoginSuccess: (boy: DeliveryBoy) => void;
  deliveryBoys?: DeliveryBoy[];
}

export const DeliveryLoginView: React.FC<DeliveryLoginViewProps> = ({
  onLoginSuccess,
  deliveryBoys = []
}) => {
  const [usernameOrPhone, setUsernameOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [availableRiders, setAvailableRiders] = useState<DeliveryBoy[]>(deliveryBoys);

  useEffect(() => {
    if (deliveryBoys.length > 0) {
      setAvailableRiders(deliveryBoys);
    } else {
      dbService.getDeliveryBoys().then((boys) => {
        setAvailableRiders(boys);
      });
    }
  }, [deliveryBoys]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await dbService.loginDeliveryBoy(usernameOrPhone, password);
      if (result.success && result.boy) {
        onLoginSuccess(result.boy);
      } else {
        setErrorMessage(result.error || 'Invalid credentials. Please verify your username and password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (boy: DeliveryBoy) => {
    setUsernameOrPhone(boy.app_username || boy.employee_code || boy.phone);
    const pass = boy.login_password || '1234';
    setPassword(pass);
    setErrorMessage('');
  };

  return (
    <div className="flex flex-col min-h-full bg-linear-to-b from-emerald-800 via-emerald-900 to-slate-950 text-white select-none">
      {/* Android Top Notch Simulation */}
      <div className="pt-2 px-6 flex justify-between items-center text-xs text-emerald-200/70 font-mono tracking-wider">
        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <div className="flex items-center space-x-1.5 text-[11px]">
          <span>5G</span>
          <span>●●●</span>
          <span>100%</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-center px-6 py-6 max-w-md mx-auto w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-linear-to-tr from-emerald-500 to-teal-300 shadow-xl shadow-emerald-500/20 mb-4 border border-emerald-300/30">
            <Bike className="w-10 h-10 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            <span>Haribansho Rider</span>
            <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Driver App
            </span>
          </h1>
          <p className="text-xs text-emerald-200/80 mt-1">
            Log in to view assigned orders & start deliveries
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 shadow-2xl shadow-black/50">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start space-x-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-emerald-200/90 mb-1.5">
                Username / Employee Code / Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400/60">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={usernameOrPhone}
                  onChange={(e) => setUsernameOrPhone(e.target.value)}
                  placeholder="e.g. DB-0834 or +91 98000 00000"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 rounded-2xl text-sm text-white placeholder-emerald-200/30 transition-all outline-hidden"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-emerald-200/90">
                  Password / Rider PIN
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400/60">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your login PIN/password"
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 rounded-2xl text-sm text-white placeholder-emerald-200/30 transition-all outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-400/60 hover:text-emerald-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-linear-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span className="text-sm">Authenticating with Supabase...</span>
                </>
              ) : (
                <>
                  <span className="text-sm">Login to Driver Portal</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Rider Selector */}
          {availableRiders.length > 0 && (
            <div className="mt-6 pt-5 border-t border-emerald-500/15">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold text-emerald-300/80 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Quick Login as Registered Partner:
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto pr-1">
                {availableRiders.slice(0, 4).map((rider) => (
                  <button
                    key={rider.id}
                    type="button"
                    onClick={() => handleQuickSelect(rider)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950/50 hover:bg-emerald-950/60 border border-emerald-500/20 hover:border-emerald-400/40 flex items-center justify-between text-xs transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-bold text-[10px] text-emerald-300 shrink-0">
                        {rider.full_name?.charAt(0) || 'R'}
                      </div>
                      <div className="truncate">
                        <p className="font-medium text-white truncate">{rider.full_name}</p>
                        <p className="text-[10px] text-emerald-300/60">{rider.employee_code || rider.app_username || rider.phone}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded border border-emerald-400/30">
                      PIN: {rider.login_password || '1234'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="mt-6 text-center text-[11px] text-emerald-200/60 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Connected directly to Haribansho Supabase Cloud</span>
        </div>
      </div>
    </div>
  );
};
